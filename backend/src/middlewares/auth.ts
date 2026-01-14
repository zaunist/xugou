import { Context, Next } from "hono";
import { jwt } from "hono/jwt";
import { getJwtSecret } from "../utils/jwt";

/**
 * JWT认证中间件
 * 验证请求中的JWT令牌并将解码的payload存入上下文
 */
export const jwtMiddleware = async (c: Context, next: Next) => {
  // 跳过所有非 API 路径的认证检查（用于静态文件服务）
  if (!c.req.path.startsWith("/api/")) {
    return next();
  }

  // 跳过特定的 API 端点
  if (
    (c.req.path.endsWith("/status") ||
      c.req.path.endsWith("/register") ||
      c.req.path.endsWith("/login")) &&
    c.req.method === "POST"
  ) {
    return next();
  }

  // 新增：跳过获取新用户注册设置的公共接口
  if (c.req.path === "/api/settings/allow_new_user_registration" && c.req.method === "GET") {
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
    alg: 'HS256',
  });
  return middleware(c, next);
};
