/*
Version 4
Chrome Entity
*/
// External imports
const Joi = require('joi');
const Router = require("koa-router");
const axios = require('axios');
// Internal imports
const { protected } = require("../middlewares/security.js");
const { crawlPage } =  require("../browser.js");
const querystring = require("querystring");
const cheerio = require('cheerio');

const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36";
const version = 4;

const version4 = new Router({
  prefix: `/v${version}`,
});

const defaultTs =  process.env.WEB_TIMEOUT || 180
const googleDefault = "https://www.google.com"

const proxyConf =
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

const emulationDef = {
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

const crawlTask = Joi.object(
  {
    url: Joi.string().required(),
    ts: Joi.number().default(defaultTs),
    waitElement: Joi.string().optional().allow(null),
    screenshot: Joi.bool().default(false),
    autoscroll: Joi.bool().default(false),
    headers: Joi.any().allow(null),
    proxy: Joi.object().keys(proxyConf).optional().allow(null),
    emulation: Joi.object().keys(emulationType).default(emulationDef)
  }
)

const searchTask = Joi.object(
  {
    text: Joi.string().required(),
    url: Joi.string().default(googleDefault),
    ts: Joi.number().default(defaultTs),
    screenshot: Joi.bool().default(false),
    nextPage: Joi.string().optional().allow(null),
    headers: Joi.any().optional(),
    proxy: Joi.object().keys(proxyConf).optional(),
    emulation: Joi.object().keys(emulationType),
  }
)

async function parseSearchTask(data){
  // const emu =await emulationType.validateAsync(emulationDef);
  if (data.emulation === null || data.emulation === undefined ){
    data.emulation = emulationDef
  }
  const values = await searchTask.validateAsync(data);
  console.log(values)
  
  return values
}

async function parseTask(data){
  if (data.emulation === null || data.emulation === undefined ){
    data.emulation = emulationDef
  }
  console.log(data)
  const values = await crawlTask.validateAsync(data);
  
  return values
 
}

version4.post("/axios", protected, async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  // const url = ctx.request.query.url;
  // console.log(url);
  const data = ctx.request.body;

  const options = await parseTask(data);
  const response = {};
  response["fullurl"] = options.url;
  try{
    const rsp = await axios.get(options.url,
                                { timeout: options.ts * 1000,
                                  headers: options.headers });


    response["content"] = rsp.data;
    response["headers"] = rsp.headers;
    response["status"] = rsp.status;
    
    ctx.status = 200;
    ctx.body = response;
  } catch(e){
    // console.log("error for " + options.url + " " + e);
    response["status"] = 500;
    response["error"] = e;
    ctx.status = 500;
    ctx.body = response;
  }
});

version4.post("/chrome", protected, async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  // const url = ctx.request.query.url;
  // console.log(url);
  const data = ctx.request.body;

  const options = await parseTask(data);

  const response = await crawlPage(options, headless=true)
  ctx.status = 200;
  ctx.body = response;
  
});


version4.post("/google-search", protected, async (ctx, next) => {
  const data = ctx.request.body;
  const options = await parseSearchTask(data);
  const query = querystring.stringify({q: options.text})
  const response = {}

  if (options.nextPage) {
    options["url"] = `${options.url}${options.nextPage}`
  } else {

    options["url"] = `${options.url}/search?${query}`
  }

  const pageRsp = await crawlPage(options, headless=true)
  response["query"] = query

  const $ = cheerio.load(pageRsp["content"])
  // const linksHtml = $("#search").find("a")

  const searchHtml = $("#search")
  const linksHtml = searchHtml.find("a")
  // const linksHtml = $("a")
  var links = []
  for (const l of linksHtml){
    let link = {href: $(l).attr("href"), text: $(l).text()}
    links.push(link)
  }
  response["links"] = links
  const nextHtml = $("#pnnext")
  let nextLink = null
  if (nextHtml.text() !== ""){
    nextLink = $(nextHtml).attr("href")
  }

  response["next"] = nextLink
  response["screenshot"] = pageRsp["screenshot"]
  response["content"] = pageRsp["content"]
  response["status"] = pageRsp["status"]

  ctx.status = 200;
  ctx.body = response
})


module.exports = version4;