const Joi = require('joi');
const {nanoid} = require("nanoid/async")
const {chromium} = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const { sleep, readFileAsync, writeFileAsync } = require('./utils');
// const { permissions } = require('google-play-scraper');
const defaultTs =  process.env.WEB_TIMEOUT || 180
const headless = process.env.HEADLESS || true

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
  headless: headless,
  emulation: emulationDefault,
}

const defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0"

}

const browserConfType = 
  {
    headless: Joi.boolean().default(headless),
    emulation: Joi.object().keys(emulationType).default(emulationDefault),
    proxy: Joi.object().keys(proxyType).allow(null).default(null),
  }

const crawlPageType = Joi.object(
  {
    url: Joi.string().required(),
    ts: Joi.number().default(defaultTs),
    waitElement: Joi.string().optional().allow(null),
    screenshot: Joi.bool().default(false),
    useCookies: Joi.bool().default(false),
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
  constructor(redis=null){
    this.redis = redis
  }
  async launch(opts={}){
    chromium.use(stealthPlugin());
    this.browser = await chromium.launch(opts);

  }
  async setContext(opts={}){
    this.context = await this.browser.newContext(opts);
  }
  async loadCookies(key){
    const content = await this.redis.get(key)
    if (content !== null) {
      const cookies = JSON.parse(content)
      await this.context.addCookies(cookies)
      return true
    }
    return false
  }
  async loadCookiesFs(path){
    const content = await readFileAsync(path, 'utf8')
    const cookies = JSON.parse(content)
    await this.context.addCookies(cookies)

  }
  async saveCookiesFs(path){
    const cookies = await this.context.cookies()
    const cookieJson = JSON.stringify(cookies)
    await writeFileAsync(path, cookieJson)
  }
  // 2 hours by default
  async saveCookies(key, ttl=7200){
    const cookies = await this.context.cookies()
    const cookieJson = JSON.stringify(cookies)
    await this.redis.set(key, cookieJson, {EX: ttl})
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

  async gotoPage(page, url, timeout=30, waitElement=null){
    let fullLoaded = false
    try{
      await page.goto(url, {
        timeout: timeout * 1000,
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
    }catch (e) {
      // console.error("Error waiting")
      fullLoaded = false
    }
    return fullLoaded

  }

  async close(){
    await this.browser.close()
  }

}

async function setupBrowser(options, redis) {
  const client = new Browser(redis);
  if (options.proxy) {
    await client.launch({proxy: options.proxy, headless: headless, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
  } else {
    await client.launch({headless: headless, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
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


async function crawlPage(task, redis){
  const response = {};
  let errorMsg = null;
  const client = await setupBrowser(task.browser, redis)
  
  const page = await client.newPage();
  if (task.useCookies) {
    if (task.cookieId){
      // await client.loadCookies(`cookies/page.${task.cookieId}.json`)
      await client.loadCookies(`cook.${task.cookieId}`)
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
    console.error(e)
    statusCode = 500
    errorMsg = e
  }

  if (task.useCookies) {
    await client.saveCookies(`cook.${task.cookieId}`)
  }

  response["fullurl"] = task.url;
  response["content"] = content
  response["headers"] = {}
  response["status"] = statusCode
  response["screenshot"] = screenshot
  response["fullLoaded"] = fullLoaded
  response["error"] = errorMsg
  response["cookieId"] = task.cookieId
  await client.close()
  return response
}




module.exports = {crawlPage,  Browser, parseCrawlPage, setupBrowser, browserConfType, defaultBrowserConf };
