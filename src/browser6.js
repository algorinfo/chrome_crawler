const Joi = require('joi');
const {nanoid} = require("nanoid/async")
const {chromium} = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const { sleep, readFileAsync, writeFileAsync } = require('./utils');
// const { permissions } = require('google-play-scraper');
const defaultTs =  process.env.WEB_TIMEOUT || 180
let headless = process.env.HEADLESS || "true"
if (headless === "true"){
  headless = true 
}else{
  headless = false
}

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
    // Valid formed url to open
    url: Joi.string().required(),
    // Timeout in secs
    ts: Joi.number().default(defaultTs),
    //  Visible text of an element to wait
    waitElement: Joi.string().optional().allow(null),
    // Take a screenshot of the fullpage
    screenshot: Joi.bool().default(false),
    // Save cookies for the domain of the url
    useCookies: Joi.bool().default(false),
    // If ture, the browser will have a fresh start
    cleanCookies: Joi.bool().default(false),
    // Derecated
    cookieId:  Joi.string().allow(null).default(null),
    // Headers used only for axios
    headers: Joi.any().allow(null),
    // Browser configuration see BrowserConfType
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
  constructor(cookiesPath, redis=null){
    this.redis = redis
    this.cookiesPath = cookiesPath
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
  async loadCookiesFs(key){
    try{
      const content = await readFileAsync(`${this.cookiesPath}/${key}`, 'utf8')
      const cookies = JSON.parse(content)
      await this.context.addCookies(cookies)
    } catch {
      await writeFileAsync(`${this.cookiesPath}/${key}`, JSON.stringify([]));
    }

  }
  async saveCookiesFs(key){
    const cookies = await this.context.cookies()
    const cookieJson = JSON.stringify(cookies)
    await writeFileAsync(`${this.cookiesPath}/${key}`, cookieJson)
  }
  async cleanCookiesFs(key){
    await writeFileAsync(`${this.cookiesPath}/${key}`, JSON.stringify([]))
  }

  async debugContentPage(path, content){
    await writeFileAsync(path, content)
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

async function setupBrowser(options, cookiesPath) {
  const client = new Browser(cookiesPath);
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


async function crawlPage(task, cookiesPath){
  const response = {};
  let errorMsg = null;
  const client = await setupBrowser(task.browser, cookiesPath)
  
  const page = await client.newPage();
  const u = new URL(task.url)
  if (task.useCookies) {
    if (task.cleanCookies) {
      client.cleanCookies(u.hostname)
    }
    await client.loadCookiesFs(u.hostname)
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
    const u = new URL(task.url)
    await client.saveCookiesFs(u.hostname)
  }

  response["fullurl"] = task.url;
  response["content"] = content
  response["headers"] = {}
  response["status"] = statusCode
  response["screenshot"] = screenshot
  response["fullLoaded"] = fullLoaded
  response["error"] = errorMsg
  response["cookieId"] = null
  await client.close()
  return response
}

module.exports = {crawlPage,  Browser, parseCrawlPage, setupBrowser, browserConfType, defaultBrowserConf };
