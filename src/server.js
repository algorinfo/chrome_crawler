// Koa imports
const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

// Internal imports
const prometheus = require("./metrics.js");
// const Crawler = require("./crawler.js");
const version1 = require("./version1.js");
const version2 = require("./version2.js");

const app = new Koa();
const router = new Router();
// const ts = process.env.WEB_TIMEOUT || 150;
const port = process.env.WEB_PORT || 3000;

// Middlewares
app.use(bodyParser());
app.use(logger());
app.use(prometheus.middleware({}));

// Routes
router.get("/", (ctx, next) => {
  ctx.body = { msg: "Hi world!" };
});

router.get("/echo", (ctx, next) => {
  ctx.body = { msg: ctx.request.query.msg };
});

app.use(router.routes());
app.use(version1.routes());
app.use(version2.routes());
console.log(`Listening on: ${port}`);
app.listen(port);
