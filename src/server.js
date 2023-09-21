// Koa imports
const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const { jwtMiddleware} = require("./middlewares/security.js");
const { redisMiddleware} = require("./middlewares/redis.js");
const fs = require("fs");
// Internal imports
const prometheus = require("./middlewares/metrics.js");
// const version3 = require("./routes/version3.js");
// const version4 = require("./routes/version4.js");
// const version5 = require("./routes/version5.js");
const version6 = require("./routes/version6.js");
const playstore1 = require("./routes/playstore1.js");


const app = new Koa();
const router = new Router();
const port = process.env.WEB_PORT || 3000;
const addr = process.env.WEB_ADDR || "localhost";
const jwt_secret = process.env.JWT_SECRET;
const jwt_alg = process.env.JWT_ALG || "ES512";
const urlRedis = process.env.REDIS || "redis://127.0.0.1:6379"
const passRedis = process.env.REDIS_PASSWORD || undefined
var secret = jwt_secret;
if (jwt_alg === "ES512"){
  secret = fs.readFileSync(jwt_secret);
}


// Middlewares
app.use(bodyParser());
app.use(logger());
app.use(prometheus.middleware({}));
app.use(jwtMiddleware(secret, jwt_alg));
// app.use(redisMiddleware(urlRedis, password=passRedis));


// Routes
router.get("/", (ctx, next) => {
  ctx.body = { msg: "Hi world! from Chrome Crawler" };
});

router.get("/echo", (ctx, next) => {
  ctx.body = { msg: ctx.request.query.msg };
});

app.use(router.routes());
// app.use(version3.routes());
app.use(version6.routes());
app.use(playstore1.routes());
console.log(`Listening on: ${addr}:${port}`);
app.listen(port, addr);
