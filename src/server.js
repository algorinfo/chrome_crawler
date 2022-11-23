// Koa imports
const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const { jwtMiddleware} = require("./security.js");
const fs = require("fs");
// Internal imports
const prometheus = require("./metrics.js");
// const Crawler = require("./crawler.js");
// const version1 = require("./version1.js");
// const version2 = require("./version2.js");
const version3 = require("./version3.js");
const version4 = require("./version3.js");
const playstore1 = require("./playstore1.js");

const app = new Koa();
const router = new Router();
// const ts = process.env.WEB_TIMEOUT || 150;
const port = process.env.WEB_PORT || 3000;
const addr = process.env.WEB_ADDR || "localhost";
const jwt_secret = process.env.JWT_SECRET;
const jwt_alg = process.env.JWT_ALG || "ES512";
var secret = jwt_secret;
if (jwt_alg === "ES512"){
  secret = fs.readFileSync(jwt_secret);
}


// Middlewares
app.use(bodyParser());
app.use(logger());
app.use(prometheus.middleware({}));
app.use(jwtMiddleware(secret));

// Routes
router.get("/", (ctx, next) => {
  ctx.body = { msg: "Hi world!" };
});

router.get("/echo", (ctx, next) => {
  ctx.body = { msg: ctx.request.query.msg };
});

app.use(router.routes());
// app.use(version1.routes()); // no protected
// app.use(version2.routes()); // no protected
app.use(version3.routes());
app.use(version4.routes());
app.use(playstore1.routes());
console.log(`Listening on: ${addr}:${port}`);
app.listen(port, addr);
