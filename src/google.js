const querystring = require("querystring");
const cheerio = require('cheerio');
const Joi = require('joi');
const { Browser, setupBrowser, browserConfType, defaultBrowserConf } =  require("./browser.js");
const { sleep } = require('./utils');
const {nanoid} = require("nanoid/async")
const googleURL = "https://google.com"
const defaultTs =  process.env.WEB_TIMEOUT || 180


const crawlGoogleType = Joi.object(
  {
    text: Joi.string().required(),
    ts: Joi.number().default(defaultTs),
    moreResults: Joi.number().default(1),
    // region: Joi.string().default("countryAR"),
    region: Joi.string().default("Argentina"),
    timeFilter: Joi.string().default(null).allow(null),
    screenshot: Joi.bool().default(false),
    useCookies: Joi.bool().default(true),
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

async function crawlGoogle(task, redis){
  const response = {};
  let errorMsg = null
  // console.log("CRAWLING GOOGLE")
  task.browser.emulation.isMobile = true
  // task.moreResults = 10
  const client = await setupBrowser(task.browser, redis)

  const page = await client.newPage();
  if (task.useCookies) {
    if (task.cookieId){
      await client.loadCookies(`cook.${task.cookieId}`)
    } else {
      task.cookieId = await nanoid(6)
      await client.gotoPage(page, `${googleURL}/preferences`)
      await setFormSettings(page, task.region, "English");
      // await client.gotoPage(page, settingsURL)
      await client.saveCookies(`cook.${task.cookieId}`)
    }
  }
  // lr=lang_en&cr=countryAR
  const query = querystring.stringify({q: task.text, cr: task.region})
  const url  =  `${googleURL}/search?${query}`

  const fullLoaded = await client.gotoPage(page, url)
  if (task.timeFilter){
    await setTimeFilter(page, task.timeFilter)
  }

  // await client.scrollDown(page, "combobox", "Search", "More results", 4)
  let isTheEnd=false
  let i = 0
  while (i < task.moreResults & isTheEnd === false){
    // console.error("Iteration ", i, isTheEnd)
    await page.getByRole("combobox", { name: "Search" }).press('PageDown')
    try{
      await expect(page.getByRole("button", {name: "More results"})).toBeVisible({timeout: 500});
      await page.getByRole('button', { name: 'More results' }).click();
      isTheEnd = true
    } catch {
      //console.error("more results")

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
    await client.saveCookies(`cook.${task.cookieId}`)
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