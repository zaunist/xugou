import { Context, Next } from "hono";
import { cors as honoCors } from "hono/cors";

/**
 * CORS中间件
 * 处理跨域资源共享并设置必要的响应头
 */
export const corsMiddleware = async (c: Context, next: Next) => {
  // 如果是 OPTIONS 请求，直接返回成功响应
  if (c.req.method === "OPTIONS") {
    c.header("Access-Control-Allow-Origin", "*");
    c.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    c.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    c.header("Access-Control-Max-Age", "86400");
    return new Response(null, { status: 204 });
  }

  // 使用CORS中间件
  const corsHandler = honoCors({
    origin: "*", // 允许所有来源
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400,
  });

  // 先执行CORS中间件
  await corsHandler(c, next);

  // 确保响应头设置正确
  c.header("Access-Control-Allow-Origin", "*");
};
