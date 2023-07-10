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
const { crawlPage, parseCrawlPage } =  require("../browser.js");
const { crawlDuckGo, parseDuckGo } =  require("../duckduckgo.js");

const userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36";
const version = 5;

const router = new Router({
  prefix: `/v${version}`,
});

const defaultTs =  process.env.WEB_TIMEOUT || 180
const defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0"

}


router.post("/axios", protected, async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  // const url = ctx.request.query.url;
  // console.log(url);
  const data = ctx.request.body;

  const options = await parseCrawlPage(data);
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

router.get("/image", protected, async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  const url = ctx.request.query.url;
  const response = {};
  response["fullurl"] = url;
  try{
    const rsp = await axios.get(url,
                                { timeout: ts * 1000,
                                  headers: defaultHeaders,
                                  responseType: 'arraybuffer'});

    response["image"] = Buffer.from(rsp.data, 'binary').toString('base64');

    response["headers"] = rsp.headers;
    response["status"] = rsp.status;
    
    ctx.status = 200;
    ctx.body = response;

  } catch(e){
    response["status"] = 500;
    response["error"] = e;
    ctx.status = 500;
    ctx.body = response;
  }
});

router.post("/chrome", protected, async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  // const url = ctx.request.query.url;
  // console.log(url);
  const data = ctx.request.body;
  const task = await parseCrawlPage(data)

  const response = await crawlPage(task)
  ctx.status = 200;
  ctx.body = response;
  
});

router.post("/duckduckgo", protected, async (ctx, next) => {
  const data = ctx.request.body;
  const task = await parseDuckGo(data)
  const rsp = await crawlDuckGo(task)
  rsp["query"] = task.text

  ctx.status = 200;
  ctx.body = rsp
})


module.exports = router;