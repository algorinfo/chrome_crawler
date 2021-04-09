/*
Version 1
Chrome Entity
*/
// External imports
const fs = require("fs");
const Ajv = require("ajv");
const Router = require("koa-router");

// Internal imports
const Crawler = require("./crawler.js");
const ts = process.env.WEB_TIMEOUT || 120;
const ajv = new Ajv({ allErrors: true });

const schemas = {
  chromeResponse: fs.readFileSync("schemas/v1/chrome_response.json"),
};

const version = 1;

const version1 = new Router({
  prefix: `/v${version}`,
});

version1.use(async (ctx, next) => {
  ctx.state.chromeResponse = ajv.compile(schemas.chromeResponse);
  await next();
});

/* Use puppeter to open the url gave thorud url query param

*/
version1.get("/chrome", async (ctx, next) => {
  const c = await Crawler.getInstance();
  const url = ctx.request.query.url;
  console.log(url);
  const response = await c.goto(url, ts);
  if (response){
    ctx.status = 200;
    ctx.body = response;
  } else{
    ctx.status = 500;
    ctx.body = {};
  }
  //const isValid = await ctx.state.chromeResponse(response);
});

// Schema endpoint
version1.get("/schemas", (ctx, next) => {
  ctx.body = { schemas: Object.keys(schemas) };
});

// Schema endpoint
version1.get("/schemas/:schema", (ctx, next) => {
  ctx.body = JSON.parse(schemas[ctx.params.schema]);
});

module.exports = version1;
