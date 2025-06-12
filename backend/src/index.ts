import { Hono, ExecutionContext } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import * as seed from "./db";
import { Bindings } from "./models/db";
import * as middlewares from "./middlewares";
import * as jobs from "./jobs";
import * as api from "./api";
import * as config from "./config";

// 创建Hono应用
const app = new Hono<{ Bindings: Bindings }>();

// 中间件，需要作为服务端接收所有来源客户端的请求
app.use("*", logger());
app.use("*", middlewares.corsMiddleware);
app.use("*", prettyJSON());
app.use("*", middlewares.jwtMiddleware);

// 公共路由
app.get("/", (c) => c.json({ message: "XUGOU API 服务正在运行" }));

// 路由注册
app.route("/api/auth", api.auth);
app.route("/api/monitors", api.monitors);
app.route("/api/agents", api.agents);
app.route("/api/users", api.users);
app.route("/api/status", api.status);
app.route("/api/notifications", api.notifications);
app.route("/api/dashboard", api.dashboard);
// 数据库状态标志，用于记录数据库初始化状态
let dbInitialized = false;

// 导出 fetch 函数供 Cloudflare Workers 使用
export default {
  // 处理 HTTP 请求
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {

    // 如果是 OPTIONS 请求，直接处理
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      });
    }


    // 初始化 drizzle 实例
    config.initDb(env);

    // 如果数据库尚未初始化，则进行初始化检查
    if (!dbInitialized) {
      console.log("首次请求，检查数据库状态...");
      const initResult = await seed.checkAndInitializeDatabase(env.DB);
      dbInitialized = true;
      console.log("数据库检查结果:", initResult.message);
    }

    // 处理请求
    return app.fetch(request, env, ctx);
  },

  // 添加定时任务，每分钟执行一次监控检查和客户端状态检查
  async scheduled(event: any, env: any, ctx: any) {
    try {
      // 初始化 drizzle 实例
      config.initDb(env);
      await jobs.runScheduledTasks(event, env, ctx);
    } catch (error) {
      console.error("定时任务执行出错:", error);
    }
  },
};
