import { Context, Next } from "hono";
import { jwt } from "hono/jwt";
import { getJwtSecret } from "../utils/jwt";

/**
 * JWT认证中间件
 * 验证请求中的JWT令牌并将解码的payload存入上下文
 */
export const jwtMiddleware = async (c: Context, next: Next) => {
  if (
    (c.req.path.endsWith("/status") ||
      c.req.path.endsWith("/register") ||
      c.req.path.endsWith("/login")) &&
    c.req.method === "POST"
  ) {
    return next();
  }

  if (c.req.path.endsWith("/data") && c.req.method === "GET") {
    return next();
  }
  // 获取 metrics 时暂时先不验证。
  if (
    (c.req.path.endsWith("/metrics") ||
      c.req.path.endsWith("/metrics/latest")) &&
    c.req.method === "GET"
  ) {
    return next();
  }
  const middleware = jwt({
    secret: getJwtSecret(c),
  });
  return middleware(c, next);
};
