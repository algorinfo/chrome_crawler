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

const defaultValues = {
  timeout: process.env.WEB_TIMEOUT || 180,
  viewPort: { width: 1280, height: 926 },
  waitElement: null,
  screenshot: false,
  autoScroll: false,
  headers: {"User-Agent": userAgent},
};
const proxyConf =
  {
    server: Joi.string().required(),
    username: Joi.string(),
    password: Joi.string()
  }


const crawlTask = Joi.object(
  {
    url: Joi.string().required(),
    ts: Joi.number(),
    waitElement: Joi.string().optional().allow(null),
    screenshot: Joi.bool(),
    autoscroll: Joi.bool(),
    headers: Joi.any(),
    jsEnabled: Joi.bool(),
    proxy: Joi.object().keys(proxyConf)
  }
)

const searchTask = Joi.object(
  {
    text: Joi.string().required(),
    ts: Joi.number(),
    screenshot: Joi.bool(),
    nextPage: Joi.string().optional().allow(null),
    headers: Joi.any(),
    proxy: Joi.object().keys(proxyConf)
  }
)

async function parseSearchTask(data){
  const values = await searchTask.validateAsync(data);
  const ts = values.ts 
  
  if (typeof values.screenshot !== "undefined"){
    values.screenshot = true
  } 
  if (typeof ts !== "undefined") {
     values.ts = 5;
  }
  return values
}

async function parseTask(data){
  const parsed = defaultValues;
  const values = await crawlTask.validateAsync(data);
  const screenshot = values.screenshot 
  const ts = values.ts 
  const autoScroll = values.autoscroll;
  const waitElement = values.waitElement;
  
  if (typeof screenshot !== "undefined"){
    parsed.screenshot = screenshot
    
  } 
  if (typeof autoScroll !== "undefined"){
       parsed.autoScroll = autoScroll;
  }
  if (typeof ts !== "undefined") {
     parsed.ts = ts;
  }
  if (typeof waitElement !== "undefined") {
     parsed.waitElement = waitElement;
  }

  parsed["url"] = values.url;
  return parsed
  
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

  const response = await crawlPage(options)
  ctx.status = 200;
  ctx.body = response;
  
});


version4.post("/google-search", protected, async (ctx, next) => {
  const data = ctx.request.body;
  const options = await parseSearchTask(data);
  const query = querystring.stringify({q: options.text})
  const response = {}

  if (options.nextPage) {
    options["url"] = `https://google.com${options.nextPage}`
  } else {

    options["url"] = `https://google.com/search?${query}`
  }

  console.log(options["url"])
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

  ctx.status = 200;
  ctx.body = response
})


module.exports = version4;