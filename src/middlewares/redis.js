const { createClient } = require("redis")


const redisMiddleware = function (redisUrl, passRedis) {
  return async function addToCtx(ctx, next) {
    try {
      if (ctx.app.redis === undefined){
        let conf
        if (passRedis !== undefined){
          conf = {url: redisUrl, password: passRedis}
        } else{
          conf = {url: redisUrl}
        }

        const redis = createClient(conf)
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

