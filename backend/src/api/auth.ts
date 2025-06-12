import { Hono } from "hono";
import { jwtMiddleware } from "../middlewares";
import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../services/AuthService";
import { Bindings } from "../models/db";
import { db } from "../config";


const auth = new Hono<{ Bindings: Bindings }>();

// 注册路由
auth.post("/register", async (c) => {
  try {
    const { username, password, email } = await c.req.json();

    // 调用 AuthService 的注册方法
    const result = await registerUser(c.env, username, password, email || null);

    return c.json(
      {
        success: result.success,
        message: result.message,
        user: result.user,
      },
      result.success ? 201 : 400
    );
  } catch (error) {
    console.error("注册错误:", error);
    return c.json({ success: false, message: "注册失败" }, 500);
  }
});

// 登录路由
auth.post("/login", async (c) => {
  try {
    console.log("=== 登录路由处理开始 ===");
    console.log("c.env 类型:", typeof c.env);
    console.log("c.env 包含的键:", Object.keys(c.env));
    console.log(
      "c.env.CF_VERSION_METADATA 是否存在:",
      !!c.env.CF_VERSION_METADATA
    );

    if (c.env.CF_VERSION_METADATA) {
      console.log(
        "c.env.CF_VERSION_METADATA 内容:",
        JSON.stringify(c.env.CF_VERSION_METADATA, null, 2)
      );
    } else {
      console.error("错误: c.env.CF_VERSION_METADATA 不存在于路由处理函数中");
    }

    const { username, password } = await c.req.json();
    console.log(`尝试用户登录: ${username}`);

    // 调用 AuthService 的登录方法
    const result = await loginUser(c.env, username, password);

    console.log("登录结果:", {
      success: result.success,
      message: result.message,
      hasToken: !!result.token,
      tokenLength: result.token ? result.token.length : 0,
      user: result.user,
    });

    return c.json(
      {
        success: result.success,
        message: result.message,
        token: result.token,
        user: result.user,
      },
      result.success ? 200 : 401
    );
  } catch (error) {
    console.error("登录错误:", error);
    console.error(
      "错误堆栈:",
      error instanceof Error ? error.stack : "未知错误"
    );
    return c.json({ success: false, message: "登录失败" }, 500);
  }
});

// 获取当前用户信息
auth.use("/me", jwtMiddleware);

auth.get("/me", async (c) => {
  try {
    const payload = c.get("jwtPayload");

    // 调用 AuthService 的获取当前用户方法
    const result = await getCurrentUser(c.env, payload.id);

    return c.json(
      {
        success: result.success,
        message: result.message,
        user: result.user,
      },
      result.success ? 200 : 404
    );
  } catch (error) {
    console.error("获取用户信息错误:", error);
    return c.json({ success: false, message: "获取用户信息失败" }, 500);
  }
});

export { auth };
