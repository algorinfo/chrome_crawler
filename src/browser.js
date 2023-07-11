const Joi = require('joi');
const {nanoid} = require("nanoid/async")
const {chromium} = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const { sleep, readFileAsync, writeFileAsync } = require('./utils');
// const { permissions } = require('google-play-scraper');
const defaultTs =  process.env.WEB_TIMEOUT || 180

const proxyType =
  {
    server: Joi.string().required(),
    username: Joi.string(),
    password: Joi.string()
  }


// 40.6976312,-74.1444858 New York
const geoType = {
  longitude: Joi.number().default(40.6976312),
  latitude: Joi.number().default(-74.1444858)
}
const viewPortType = {
  width: Joi.number().default(1280),
  height: Joi.number().default(720)
}
const emulationType =
  {
    locale: Joi.string().default("en-US"),
    timezoneId: Joi.string().default("America/New_York"),
    isMobile: Joi.boolean().default(false),
    viewport: Joi.object().keys(viewPortType),
    geoEnabled: Joi.boolean().default(false),
    geolocation: Joi.object().keys(geoType).optional().allow(null),
  }

const emulationDefault = {
  locale: "en-US",
  timezoneId: "America/New_York",
  isMobile: false,
  viewport: { width: 1280, height: 720},
  geoEnabled: false,
  geolocation: {
    longitude: 40.6976312,
    latitude: -74.1444858
  }
}
const defaultBrowserConf = {
  headless: true,
  emulation: emulationDefault,
}

const defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0"

}

const browserConfType = 
  {
    headless: Joi.boolean().default(true),
    emulation: Joi.object().keys(emulationType).default(emulationDefault),
    proxy: Joi.object().keys(proxyType).allow(null).default(null),
  }

const crawlPageType = Joi.object(
  {
    url: Joi.string().required(),
    ts: Joi.number().default(defaultTs),
    waitElement: Joi.string().optional().allow(null),
    screenshot: Joi.bool().default(false),
    useCookies: Joi.bool().default(true),
    cookieId:  Joi.string().allow(null).default(null),
    headers: Joi.any().allow(null),
    browser: Joi.object().keys(browserConfType).optional().allow(null).default(defaultBrowserConf),
  }
)



async function parseCrawlPage(data){
  // const emu =await emulationType.validateAsync(emulationDef);
  if (data.browser === null || data.browser === undefined ){
    data.browser = defaultBrowserConf
  }
  if (data.headers === null || data.headers === undefined ){
    data.headers = defaultHeaders
  }
  const values = await crawlPageType.validateAsync(data);
  //console.log(values)
  return values
}


class Browser {
  browser; 
  context;
  constructor(){
  }
  async launch(opts={}){
    chromium.use(stealthPlugin());
    this.browser = await chromium.launch(opts);

  }
  async setContext(opts={}){
    this.context = await this.browser.newContext(opts);
  }
  async loadCookies(path){
    const content = await readFileAsync(path, 'utf8')
    const cookies = JSON.parse(content)
    await this.context.addCookies(cookies)

  }
  async saveCookies(path){
    const cookies = await this.context.cookies()
    const cookieJson = JSON.stringify(cookies)
    await writeFileAsync(path, cookieJson)
  }
  async newPage(){
    const p = await this.context.newPage();
    return p
  }

  async scrollDown(page, firstRoleType, firstRoleName, lastElement, limitIterations){
    let isTheEnd = false
    let i = 0
    while (i < limitIterations || isTheEnd === false){
      isTheEnd = await this.goDown(page, firstRoleType, firstRoleName, lastElement)
      await sleep(300) 
      i++
      // console.log(`(${i}) Scrolling down`)
    }
  }

  async goDown(page, firstRoleType, firstRoleName, lastElement){
    await page.getByRole(firstRoleType, { name: firstRoleName }).press('PageDown')
    let isTheEnd = true
    try {
      await expect(page.getByText(lastElement)).toBeVisible({timeout: 500});
    } catch {
      isTheEnd = false
    }
    return isTheEnd
  }

  async gotoPage(page, url, timeout=30000, waitElement=null){
    let fullLoaded = false
    try{
      await page.goto(url, {
        timeout: timeout,
        waitUntil: "load"
      })
      fullLoaded = true
    }
    catch {
      fullLoaded = false
      // console.log("Not full loaded")
    }
    try {
      // await expect(page.getByTitle("Crónica en vivo")).toBeVisible({timeout: 15000})
      // console.log(options.waitElement)
      if (waitElement){
        const loc = page.getByText(waitElement)
        await loc.hover()
      }
    }catch {
      // console.error("Error waiting")
      fullLoaded = false
    }
    return fullLoaded

  }

  async close(){
    await this.browser.close()
  }

}

async function setupBrowser(options) {
  const client = new Browser();
  if (options.proxy) {
    await client.launch({proxy: options.proxy, headless: options.headless, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
  } else {
    await client.launch({headless: options.headless, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
  }
  const permissions = []
  if (options.emulation.geoEnabled) {
    permissions.push("geolocation")
  }

  await client.setContext({
    permissions: permissions,
    locale: options.emulation.locale,
    timezoneId: options.emulation.timezoneId,
    isMobile: options.emulation.isMobile,
    viewport: options.emulation.viewport,
    geolocation: options.emulation.geolocation,
  })
  await client.context.route('**.jpg', route => route.abort());
  await client.context.route('**.png', route => route.abort());
  return client

}


async function crawlPage(task){
  const response = {};
  let errorMsg = null;
  const client = await setupBrowser(task.browser)
  
  const page = await client.newPage();
  if (task.useCookies) {
    if (task.cookieId){
      await client.loadCookies(`cookies/page.${task.cookieId}.json`)
    } else {
      task.cookieId = await nanoid(6)
    }
  }


  const fullLoaded = await client.gotoPage(page, task.url, timeout=task.ts, waitElement=task.waitElement)
  let screenshot = null
  let statusCode = 200
  let content = null
  if (task.screenshot === true) {
    const buffer =  await page.screenshot({fullPage: true });
    screenshot = buffer.toString('base64')
  }
    // await page.reload({ waitUntil: "networkidle"})
  try{
      content = await page.content()
  } catch (e) {
    statusCode = 500
    errorMsg = e
  }

  if (task.useCookies) {
    await client.saveCookies(`cookies/page.${task.cookieId}.json`)
  }

  response["fullurl"] = task.url;
  response["content"] = content
  response["headers"] = {}
  response["status"] = statusCode
  response["screenshot"] = screenshot
  response["fullLoaded"] = fullLoaded
  response["error"] = errorMsg
  await client.close()
  return response
}




module.exports = {crawlPage,  Browser, parseCrawlPage, setupBrowser, browserConfType, defaultBrowserConf };
