const {chromium} = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const { readFileAsync, writeFileAsync } = require('./utils');


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

  async scrollDown(page, firstHeadElement, lastElement, limitIterations){
    let isTheEnd = false
    let i = 0
    while (i < limitIterations || isTheEnd === false){
      isTheEnd = await this.goDown(page, firstHeadElement, lastElement)
      // await sleep(1000) 
      i++
      console.log(`(${i}) Scrolling down`)
    }
  }

  async goDown(page, firstHeadElement, lastElement){
    await page.getByRole('heading', {name: firstHeadElement}).press('PageDown');
    let isTheEnd = true
    try {
      await expect(page.getByText(lastElement)).toBeVisible({timeout: 500});
    } catch {
      isTheEnd = false
    }
    return isTheEnd
  }

  async close(){
    await this.browser.close()
  }

}

async function crawlPage(options, headless=true){
  const response = {};
  response["fullurl"] = options.url;
  const client = new Browser();
  if (options.proxyConf) {
    await client.launch({proxy: options.proxyConf, headless: headless});
  } else {
    await client.launch({headless: headless});
  }

  await client.setContext({locale: "en-US", isMobile: false, viewport: { width: 1280, height: 720 }})
  await client.context.route('**.jpg', route => route.abort());
  await client.context.route('**.png', route => route.abort());
  const page = await client.newPage();
  let fullLoaded = false
  try{
    await page.goto(options.url, {
      timeout: options.ts * 1000,
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
    if (options.waitElement){
      const loc = page.getByText(options.waitElement)
      await loc.hover()
    }

  }catch {
    console.error("Error waiting")
  }
  let screenshot = null
  if (options.screenshot === true) {
    const buffer =  await page.screenshot({fullPage: true });
    screenshot = buffer.toString('base64')
  }
  const content = await page.content()
  response["content"] = content
  response["headers"] = {}
  response["status"] = 200
  response["screenshot"] = screenshot
  response["fullLoaded"] = fullLoaded
  await client.close()
  return response
}

module.exports = {crawlPage, Browser};
