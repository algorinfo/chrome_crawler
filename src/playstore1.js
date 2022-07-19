const { protected } = require("./security.js");
const gplay = require('google-play-scraper');
const version = 1;
const Router = require("koa-router");
const playstore1 = new Router({
  prefix: `/playstore/v${version}`,
});


playstore1.get("/status", protected, async (ctx, next) => {
  ctx.body = {"msg": "status ok"}
});

playstore1.get("/:appid", protected, async (ctx, next) => {
  const res = await gplay.app({appId: ctx.params.appid});
  // console.log(res)
  // const res = ctx.params.appid
  ctx.body = res;
  ctx.status = 200;
    //const isValid = await ctx.state.chromeResponse(response);
});

playstore1.post("/list", protected, async (ctx, next) => {
  const data = ctx.request.body;
  const res = await gplay.list(data);
  ctx.body = res;
  ctx.status = 200;
});


playstore1.post("/search", protected, async (ctx, next) => {
  const data = ctx.request.body;
  const res = await gplay.search(data);
  ctx.body = res;
  ctx.status = 200;
});

playstore1.post("/reviews", protected, async (ctx, next) => {
  const data = ctx.request.body;
  const res = await gplay.reviews(data);
  ctx.body = res;
  ctx.status = 200;
});


playstore1.post("/similar", protected, async (ctx, next) => {
  const data = ctx.request.body;
  const res = await gplay.similar(data);
  ctx.body = res;
  ctx.status = 200;
});

module.exports = playstore1;