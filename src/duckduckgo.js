const querystring = require("querystring");
const cheerio = require('cheerio');
const Joi = require('joi');
const { Browser, setupBrowser, browserConfType, defaultBrowserConf } =  require("./browser6.js");
const { sleep } = require('./utils');
const {nanoid} = require("nanoid/async")
const duckURL = "https://duckduckgo.com"
const settingsURL = `${duckURL}/settings`
const defaultTs =  process.env.WEB_TIMEOUT || 180

const crawlDuckGoType = Joi.object(
  {
    // a query to search in duckduckgo.com
    text: Joi.string().required(),
    // timeout in secs
    ts: Joi.number().default(defaultTs),
    // How many clicks on "More Results"
    moreResults: Joi.number().default(1),
    // "ar-es" by default. 
    region: Joi.string().default("ar-es"),
    // "Any Time", "Past day", "Past week", "Past month", "Past year". Null by default
    timeFilter: Joi.string().default(null).allow(null),
    // Take a screenshot of full rendered page
    screenshot: Joi.bool().default(false),
    // It will store and load cookies
    useCookies: Joi.bool().default(true),
    // Deprecated
    cookieId:  Joi.string().allow(null).default(null),
    browser: Joi.object().keys(browserConfType).optional().allow(null).default(defaultBrowserConf),
  }
)

async function parseDuckGo(data){
  // const emu =await emulationType.validateAsync(emulationDef);
  if (data.browser === null || data.browser === undefined ){
    data.browser = defaultBrowserConf
  }
  const values = await crawlDuckGoType.validateAsync(data);
  console.error(values)
  //console.log(values)
  return values
}


/*
Options for toolTime are:
- Past year
- Past month 
- Past 24 hours
- Past hour
- Any time
*/
async function setTimeFilter(page, toolTime="Past year"){
  await page.getByRole('link', { name: 'Any time ▼' }).click();
  await page.getByRole('link', { name: toolTime }).click();
}

async function setDuckGoRegionCookies(region, lang="en_US", headless=true){
  const client = new Browser();
  
  await client.launch({
    headless: headless, 
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
  await client.setContext({
    // permissions: permissions,
    locale: "en-US",
    // timezoneId: options.emulation.timezoneId,
    isMobile: false,
    viewport: {width: 1280, height: 720},
  })
  await client.context.route('**.jpg', route => route.abort());
  await client.context.route('**.png', route => route.abort());
  const page = await client.newPage();
  const fullLoaded = await client.gotoPage(page, `${duckURL}/settings`)

  await setFormSettings(page, region, lang);
  const u = new URL(duckURL)
  await client.saveCookiesFs(u.hostname)
  const {content, statusCode} = await getContent(page)
  await client.close()

}

function extractLinks(content){
  var links = []
  const $ = cheerio.load(content)
  const searchHtml = $(".react-results--main")
  const lis = searchHtml.find("article")
  var links = []
  for (const l of lis){
    let link = {href: $(l).find("a").attr("href"), text: $(l).text()}
    links.push(link)
  }
  return links
}

async function setFormSettings(page, region, lang){
  await page.locator('#setting_kl').selectOption(region);
  await page.locator('#setting_kad').selectOption('en_US');
  await page.getByRole('link', { name: 'Save and Exit' }).click();

}

async function crawlDuckGo(task, cookiesPath){
  const response = {};
  const client = await setupBrowser(task.browser, cookiesPath)

  const page = await client.newPage();
  if (task.useCookies) {
    const u = new URL(duckURL)
    await client.loadCookiesFs(u.hostname)
  }

  const query = querystring.stringify({q: task.text})
  const url  =  `${duckURL}/?${query}`
  response["fullurl"] = url;
  const fullLoaded = await client.gotoPage(page, url)
  if (task.timeFilter){
    await setTimeFilter(page, task.timeFilter)
  }
  for (let i = 0; i < task.moreResults; i++){
      await page.getByRole('button', { name: 'More results' }).click();
      await sleep(900);
  }
 
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
      // client.debugContentPage("tests/duckduckgo2.html", content)
  } catch {
    statusCode = 500
  }
  var links = []
  // if (content){
  //  links = extractLinks(content)
  // }

  response["query"] = task.text
  response["content"] = content
  response["headers"] = {}
  response["status"] = statusCode
  response["screenshot"] = screenshot
  response["fullLoaded"] = fullLoaded
  response["links"] = links
  response["cookieId"] = null
  response["error"] = null
  await client.close()
  return response
}


module.exports = {crawlDuckGo, setDuckGoRegionCookies, parseDuckGo};