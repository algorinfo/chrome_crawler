const { createClient } = require("redis")


const redisMiddleware = function (redisUrl) {
  return async function addToCtx(ctx, next) {
    try {
      if (ctx.app.redis === undefined){
        console.log("==> Initializing Redis")
        const redis = createClient({url: redisUrl})
        await redis.connect()
        ctx.app.redis = redis 
      }
      
    } catch (e) {
      console.error(e)
      // console.error(e)
      // ctx.status = 401
      // ctx.body = {"msg": "auth error"}
      ctx.state.redis = undefined;
    }

    await next()
  }
}


module.exports = { redisMiddleware };

