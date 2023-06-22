/*
Version 1
Chrome Entity
*/
// External imports
const Joi = require('joi');
const Router = require("koa-router");
const axios = require('axios');
const Buffer = require("buffer").Buffer;
// Internal imports
const { protected } = require("../middlewares/security");
const Crawler = require("../crawler3.js");
const ts = process.env.WEB_TIMEOUT || 180;

const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36";
const version = 3;

const version3 = new Router({
  prefix: `/v${version}`,
});

const defaultValues = {
  timeout: process.env.WEB_TIMEOUT || 180,
  viewPort: { width: 1280, height: 926 },
  waitElement: "body",
  screenshot: false,
  autoScroll: false,
  userAgent: userAgent,
};

const crawlTask = Joi.object(
  {
    url: Joi.string().required(),
    ts: Joi.number(),
    waitElement: Joi.string(),
    screenshot: Joi.bool(),
    autoscroll: Joi.bool(),
    userAgent: Joi.string(),
    jsEnabled: Joi.bool(),
  }
)

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
     parsed.timeout = ts;
  }
  if (typeof waitElement !== "undefined") {
     parsed.waitElement = waitElement;
  }

  parsed["url"] = values.url;
  return parsed
  
}

// Chrome endpoint
// body data:
// url
// ts
// screenshot
// autoscroll
version3.post("/chrome", protected, async (ctx, next) => {
  const c = await Crawler.getInstance();
  const data = ctx.request.body;
  try {
    const options = await parseTask(data);
    
    const response = await c.goto(options.url, options);
    if (response){
        response["fullurl"] = options.url;
        ctx.status = 200;
        ctx.body = response;
    } else{
        ctx.status = 500;
        ctx.body = {};
    }

  } catch (err){
    ctx.status = 500;
    ctx.body = { error: err };
  }

    //const isValid = await ctx.state.chromeResponse(response);
});

version3.post("/axios", protected, async (ctx, next) => {
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
                                  headers: { 'User-Agent': options.userAgent}});


    response["content"] = rsp.data;
    response["headers"] = rsp.headers;
    response["status"] = rsp.status;
    
    ctx.status = 200;
    ctx.body = response;
  } catch(e){
    console.log("error for " + options.url + " " + e);
    response["status"] = 500;
    response["error"] = e;
    ctx.status = 500;
    ctx.body = response;
  }
});


version3.get("/image", protected, async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  const url = ctx.request.query.url;
  console.log(url);
  const response = {};
  response["fullurl"] = url;
  try{
    const rsp = await axios.get(url,
                                { timeout: ts * 1000,
                                  headers: { 'User-Agent': userAgent},
                                  responseType: 'arraybuffer'});

    response["image"] = Buffer.from(rsp.data, 'binary').toString('base64');

    response["headers"] = rsp.headers;
    response["status"] = rsp.status;
    
    ctx.status = 200;
    ctx.body = response;
  } catch(e){
    console.log("error for " + url + " " + e);
    response["status"] = 500;
    response["error"] = e;
    ctx.status = 500;
    ctx.body = response;
    
  }
});

module.exports = version3;
