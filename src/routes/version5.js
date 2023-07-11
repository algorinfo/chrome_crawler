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
const { crawlGoogle, parseGoogle } =  require("../google.js");

const version = 5;

const router = new Router({
  prefix: `/v${version}`,
});

const defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0"

}


router.post("/axios", protected, async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  // const url = ctx.request.query.url;
  // console.log(url);
  const data = ctx.request.body;
  let rsp = {};
  let statusCode = 200
  try{
    const options = await parseCrawlPage(data);
    rsp["fullurl"] = options.url;
    const rspAx = await axios.get(options.url,
                                { timeout: options.ts * 1000,
                                  headers: options.headers });


    rsp["content"] = rspAx.data;
    rsp["headers"] = rspAx.headers;
    rsp["status"] = rspAx.status;
    statusCode = rspAx.status
  } catch(e){
    // console.log("error for " + options.url + " " + e);
    statusCode = 500
    rsp["error"] = e;
  }
  ctx.status = statusCode;
  ctx.body = rsp;

});

router.get("/image", protected, async (ctx, next) => {
  // headers: { 'User-Agent': 'YOUR-SERVICE-NAME' }
  const url = ctx.request.query.url;
  let response = {};
  response["fullurl"] = url;
  try{
    rsp = await axios.get(url,
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
  let rsp = {}
  let statusCode = 200
  try{
    const task = await parseCrawlPage(data)
    rsp = await crawlPage(task)
    statusCode = rsp["status"]
  } catch(e){
    statusCode = 500
    rsp["error"] = e
    console.error(e)
  }
  ctx.status = statusCode;
  ctx.body = rsp;
  
});

router.post("/duckduckgo", protected, async (ctx, next) => {
  const data = ctx.request.body;
  let rsp = {}
  let statusCode = 200
  try{
    const task = await parseDuckGo(data)
    rsp = await crawlDuckGo(task)
    statusCode = rsp["status"]
  } catch(e){
    statusCode = 500
    rsp["error"] =  e
    console.error(e)
  }
  ctx.status = statusCode;
  ctx.body = rsp
})

router.post("/google", protected, async (ctx, next) => {
  const data = ctx.request.body;
  let rsp = {}
  let statusCode = 200
  try{
    const task = await parseGoogle(data)
    rsp = await crawlGoogle(task)
  } catch(e){
    statusCode = 500
    rsp["error"] =  e
    console.error(e)
  }
  ctx.status = statusCode;
  ctx.body = rsp

  ctx.status = 200;
  ctx.body = rsp
})




module.exports = router;