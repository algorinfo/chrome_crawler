var jwt = require('jsonwebtoken');

function extractBearerToken(authHeader){
  if (authHeader.startsWith("Bearer ")){
      token = authHeader.substring(7, authHeader.length);
  } else {
    return "invalid"
  }
  return token
};

const jwtMiddleware = function (secretOrPublic) {
  return async function tokenValidation(ctx, next) {
    try {
      const authHeader = ctx.headers.authorization
      // console.log("authHeader: ", authHeader)
      const bearerToken = extractBearerToken(authHeader);
      if (bearerToken !== "invalid"){
            const decoded = jwt.verify(bearerToken, secretOrPublic, algorithms=["ES512"])
            ctx.state.jwtDecoded = decoded 
            // await next()
      } else {
          ctx.throw(401)
      }
    } catch (e) {
      // console.error(e)
      // ctx.status = 401
      // ctx.body = {"msg": "auth error"}
      ctx.state.jwtDecoded = undefined;
    }

    await next()
  }
}

const protected = async (ctx, next) =>  {
    if (ctx.state.jwtDecoded !== undefined){
      await next();
    } else {
      //ctx.throw(401)
      ctx.status = 401
      ctx.body = {"msg": "auth error"}
    }
}

module.exports = { jwtMiddleware, protected};

