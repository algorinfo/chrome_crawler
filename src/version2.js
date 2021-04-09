/*
Version 1
Chrome Entity
*/
// External imports
const WAE = require("web-auto-extractor").default;
const Router = require("koa-router");
const axios = require('axios');

// Internal imports
const Crawler = require("./crawler.js");
const ts = process.env.WEB_TIMEOUT || 120;

const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36";
const version = 2;

const version2 = new Router({
  prefix: `/v${version}`,
});

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
  console.log(url);
  const response = await c.goto(url, ts);
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

module.exports = version2;
