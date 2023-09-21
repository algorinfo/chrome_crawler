const querystring = require("querystring");
const cheerio = require('cheerio');
const Joi = require('joi');
const { Browser, setupBrowser, browserConfType, defaultBrowserConf } =  require("./browser6.js");
const { sleep } = require('./utils');
const {nanoid} = require("nanoid/async")
const googleURL = "https://google.com"
const defaultTs =  process.env.WEB_TIMEOUT || 180


const crawlGoogleType = Joi.object(
  {
    // a query to search in google.com
    text: Joi.string().required(),
    // timeout in secs
    ts: Joi.number().default(defaultTs),
    // It will performs a "PgDown" actions for `moreResults` times. 
    moreResults: Joi.number().default(1),
    // region: Joi.string().default("countryAR"),
    region: Joi.string().default("Argentina"),
    // country 
    cr: Joi.string().default("US"),
    // interfaz lang, it should be always "en" to work
    hl: Joi.string().default("en"),
    // "Any Time", "Past hour", "Past 24 hours", "Past week", "Past month", "Past year". Null by default
    timeFilter: Joi.string().default(null).allow(null),
    // Take and screenshot
    screenshot: Joi.bool().default(false),
    // use cookies
    useCookies: Joi.bool().default(true),
    // deprecated
    cookieId:  Joi.string().allow(null).default(null),
    browser: Joi.object().keys(browserConfType).optional().allow(null).default(defaultBrowserConf),
  }
)

function extractLinks(content){
  var links = []
  const $ = cheerio.load(content)
  const searchHtml = $("#search")
  const boxes = searchHtml.find(".MjjYud")
  for (const box of boxes){
    let link = { href: $(box).find("a").attr("href"), text: $(box).text()}
    links.push(link)
  }
  return links
}

async function parseGoogle(data){
  // const emu =await emulationType.validateAsync(emulationDef);
  if (data.browser === null || data.browser === undefined ){
    data.browser = defaultBrowserConf
  }
  const values = await crawlGoogleType.validateAsync(data);
  //console.log(values)
  return values
}

async function setFormSettings(page, region, lang){
  await page.locator('#regionanchormore').click();
  await page.getByRole('radio', { name: region }).click();
  // await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('link', { name: 'Languages' }).click();
  await page.getByRole('radio', { name: lang }).click();
  await page.getByRole('button', { name: 'Save' }).click();
}

async function setGoogleRegionCookies(region, lang="English"){

  defaultBrowserConf.emulation.isMobile = true
  const client = await setupBrowser(defaultBrowserConf)
  const page = await client.newPage();
  await client.gotoPage(page, `${googleURL}/preferences`)
  await setFormSettings(page, region, lang)
  
  await client.saveCookies("cookies/google.com.default.json")
  console.log("=> saved cookies into cookies/google.com.default.json")
  const {content, statusCode} = await getContent(page)
  console.log("Status code: ", statusCode)
  await client.close()

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
  await page.getByRole('button', { name: 'Tools' }).click();
  await page.getByRole('button', { name: 'Any time' }).click();
  await page.getByRole('menuitemradio', { name: toolTime }).click();
}

async function crawlGoogle(task, cookiesPath){
  const response = {};
  let errorMsg = null
  // console.log("CRAWLING GOOGLE")
  task.browser.emulation.isMobile = true
  // task.moreResults = 10
  const client = await setupBrowser(task.browser, cookiesPath)

  const page = await client.newPage();
  if (task.useCookies) {
      const u = new URL(googleURL)
      try {
        await client.loadCookiesFs(u.hostname)
      } catch {
        // await client.gotoPage(page, `${googleURL}/preferences`)
        // await setFormSettings(page, task.region, "English");
        await client.saveCookiesFs(u.hostname)
      }
      
      // await client.gotoPage(page, settingsURL)
  }
  // lr=lang_en&cr=countryAR
  const query = querystring.stringify({q: task.text, cr: task.region, hl: task.hl})
  const url  =  `${googleURL}/search?${query}`
  console.log("URL: ", url)

  const fullLoaded = await client.gotoPage(page, url)
  if (task.timeFilter){
    await setTimeFilter(page, task.timeFilter)
  }

  // await client.scrollDown(page, "combobox", "Search", "More results", 4)
  let isTheEnd=false
  let i = 0
  while (i < task.moreResults & isTheEnd === false){
    // console.error("Iteration ", i, isTheEnd)
    let loc;
    try{

      // await expect(page.getByRole("combobox", { name: "Search" })).toBeVisible({timeout: 3000})
      // await expect(page.getByRole("button", { name: "Search" })).toBeVisible({timeout: 3000})
      console.log("Doing pagedown")
      loc = await page.getByRole("button", { name: "Search" }).press("PageDown")
    } catch{
      // loc = await page.getByRole("button", { name: "Buscar" }).press("PageDown")
      console.error("Failling looking for moreResults doing PageDown on Search button")
      isTheEnd = true
    }
    try{
      await expect(page.getByRole("button", {name: "More results"})).toBeVisible({timeout: 200});
      await page.getByRole('button', { name: 'More results' }).click();
    } catch {
      try{
        await expect(page.getByRole("link", {name: "Next"})).toBeVisible({timeout: 200});
        await page.getByRole('link', { name: 'Next' }).click();
      } catch {
        isTheEnd = true
        console.error("Error getting more results")
      }
    }
    await sleep(200);
    i++
  }
  // await page.getByRole('button', { name: 'More results' }).click();

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

  // await page.getByText('Canada (en)').click();
  // await page.getByText('Argentina', { exact: true }).click();
  var links = []
  if (content){
    links = extractLinks(content)
  }
  if (task.useCookies) {
    const u = new URL(googleURL)
    await client.saveCookiesFs(u.hostname)
  }

  response["fullurl"] = url;
  response["query"] = task.text
  response["content"] = content
  response["headers"] = {}
  response["status"] = statusCode
  response["screenshot"] = screenshot
  response["fullLoaded"] = fullLoaded
  response["links"] = links
  response["cookieId"] = task.cookieId
  response["error"] = errorMsg
  await client.close()
  return response
}


module.exports = {crawlGoogle, parseGoogle};