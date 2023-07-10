const querystring = require("querystring");
const cheerio = require('cheerio');
const Joi = require('joi');
const { Browser, setupBrowser, browserConfType, defaultBrowserConf } =  require("./browser.js");
const { sleep } = require('./utils');
const duckURL = "https://duckduckgo.com"
const defaultTs =  process.env.WEB_TIMEOUT || 180

const crawlDuckGoType = Joi.object(
  {
    text: Joi.string().required(),
    ts: Joi.number().default(defaultTs),
    moreResults: Joi.number().default(1),
    screenshot: Joi.bool().default(false),
    useCookies: Joi.bool().default(true),
    browser: Joi.object().keys(browserConfType).optional().allow(null).default(defaultBrowserConf),
  }
)

async function parseDuckGo(data){
  // const emu =await emulationType.validateAsync(emulationDef);
  if (data.browser === null || data.browser === undefined ){
    data.browser = defaultBrowserConf
  }
  const values = await crawlDuckGoType.validateAsync(data);
  //console.log(values)
  return values
}



async function setCookiesSettings(region, lang="en_US", headless=true){
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
  const fullLoaded = await client.gotoPage(page, "https://duckduckgo.com/settings")

  await setFormSettings(page, region, lang);
  await client.saveCookies("cookies/duckduckgo.com.json")
  console.log("=> saved cookies into cookies/duckduckgo.com.json")
  const {content, statusCode} = await getContent(page)
  console.log("Status code: ", statusCode)


  await client.close()

}

function extractLinks(content){
  var links = []
  const $ = cheerio.load(content)
  const searchHtml = $(".react-results--main")
  const lis = searchHtml.find("li")
  var links = []
  for (const l of lis){
    let link = {href: $(l).find("a").attr("href"), text: $(l).text()}
    links.push(link)
  }
  return links
}

async function setFormSettings(page, region, lang){
  await page.locator('#setting_kl').selectOption(region);
  await page.locator('#setting_kad').selectOption(lang);
  await page.getByRole('link', { name: 'Save and Exit' }).click();

}

async function crawlDuckGo(task){
  const response = {};
  response["fullurl"] = task.url;
  const client = await setupBrowser(task.browser)

  if (task.useCookies) {
    await client.loadCookies("cookies/duckduckgo.com.json")
  }
  const page = await client.newPage();

  const query = querystring.stringify({q: task.text})
  const url  =  `${duckURL}/?${query}`

  const fullLoaded = await client.gotoPage(page, url)
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
  } catch {
    statusCode = 500
  }

  // await page.getByText('Canada (en)').click();
  // await page.getByText('Argentina', { exact: true }).click();
  var links = []
  if (content){
    links = extractLinks(content)
  }

  response["content"] = content
  response["headers"] = {}
  response["status"] = statusCode
  response["screenshot"] = screenshot
  response["fullLoaded"] = fullLoaded
  response["links"] = links
  await client.close()
  return response
}


module.exports = {crawlDuckGo, setCookiesSettings, parseDuckGo};