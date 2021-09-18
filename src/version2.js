/*
Version 1
Chrome Entity
*/
// External imports
const WAE = require("web-auto-extractor").default;
const Joi = require('joi');
const Router = require("koa-router");
const axios = require('axios');
const Buffer = require("buffer").Buffer;

// Internal imports
const Crawler = require("./crawler.js");
const ts = process.env.WEB_TIMEOUT || 180;

const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36";
const version = 2;

const version2 = new Router({
  prefix: `/v${version}`,
});


const chromeOptions = {
  timeout: ts,
  viewPort: { width: 1280, height: 926 },
  screenshot: false,
  autoScroll: false,
};
  

function extractTags(html) {
  try{
    const parsed = WAE().parse(html);
    return parsed;
  } catch(e){
    return {};
  }
}

/* Use puppeter to open the url gave thorud url query param

 */
version2.get("/chrome", async (ctx, next) => {
  const c = await Crawler.getInstance();
  const url = ctx.request.query.url;
  const screenshot = ctx.request.query.screen;
  const autoScroll = ctx.request.query.autoscroll;
  if (screenshot){
    chromeOptions.screenshot = true;
  }
  if (autoScroll){
    chromeOptions.autoScroll = true;
  }
  // console.log(url);
  const response = await c.goto(url, chromeOptions);
  if (response){
    response["fullurl"] = url;
    ctx.status = 200;
    ctx.body = response;
  } else{
    ctx.status = 500;
    ctx.body = {};
  }
  //const isValid = await ctx.state.chromeResponse(response);
});



const chromePost = Joi.object(
  {
    url: Joi.string().required(),
    ts: Joi.number(),
    screenshot: Joi.string(),
    autoscroll: Joi.string(),
  }
)
// Chrome endpoint
// body data:
// url
// ts
// screenshot
// autoscroll
version2.post("/chrome", async (ctx, next) => {
  const c = await Crawler.getInstance();
  const data = ctx.request.body;
  try {
    const value = await chromePost.validateAsync(data);
    const url = value.url;
    const screenshot = value.screenshot 
    const ts = value.ts 
    const autoScroll = value.autoscroll;
    if (screenshot){
      chromeOptions.screenshot = true;
    }
    if (autoScroll){
       chromeOptions.autoScroll = true;
    }
    if (ts) {
      chromeOptions.timeout = ts;
    }
    const response = await c.goto(url, chromeOptions);
    if (response){
        response["fullurl"] = url;
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


version2.get("/axios", async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  const url = ctx.request.query.url;
  console.log(url);
  const response = {};
  response["fullurl"] = url;
  try{
    const rsp = await axios.get(url,
                                { timeout: ts * 1000,
                                  headers: { 'User-Agent': userAgent}});


    if ( typeof(rsp.data) === "string"){
      response["metadata"] = extractTags(rsp.data);
      if(response["metadata"]["metatags"]["title"]){
        response["title"] = response["metadata"]["metatags"]["title"][0];
      }
    }
    response["content"] = rsp.data;
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


version2.get("/image", async (ctx, next) => {
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

module.exports = version2;
