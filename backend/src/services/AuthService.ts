/**
 * AuthService.ts
 * 认证服务，处理用户认证、注册和令牌管理相关的业务逻辑
 */

import * as bcrypt from "bcryptjs";
import * as jsonwebtoken from "jsonwebtoken";
import * as repositories from "../repositories";
import { getJwtSecret } from "../utils/jwt";
import { Bindings } from "../models/db";

/**
 * 用户登录
 * @param env 环境变量，包含数据库连接
 * @param username 用户名
 * @param password 密码(明文)
 * @returns 登录结果，包含令牌和用户信息
 */
export async function loginUser(
  env: { DB: Bindings["DB"] } & any,
  username: string,
  password: string
): Promise<{ success: boolean; message: string; token?: string; user?: any }> {
  try {
    console.log("=== loginUser 函数被调用 ===");
    console.log("传入的 env 参数类型:", typeof env);
    console.log(
      "传入的 env 参数结构:",
      JSON.stringify(
        env,
        (key, value) => {
          // 排除可能的循环引用对象
          if (key === "DB" && typeof value === "object") {
            return "[DB Object]";
          }
          return value;
        },
        2
      )
    );

    // 查找用户
    console.log("开始查找用户:", username);
    const user = await repositories.getUserByUsername(username);

    if (!user) {
      console.log("用户不存在:", username);
      return { success: false, message: "用户名或密码错误" };
    }

    console.log("找到用户, ID:", user.id);

    // 验证密码
    console.log("开始验证密码");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("密码验证结果:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("密码验证失败");
      return { success: false, message: "用户名或密码错误" };
    }

    // 生成JWT令牌
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    console.log("JWT payload:", payload);

    console.log("调用 getJwtSecret 前的环境变量检查:");
    console.log("env 是否存在:", !!env);
    console.log("env.CF_VERSION_METADATA 是否存在:", !!env.CF_VERSION_METADATA);

    try {
      const secret = getJwtSecret(env);
      console.log("获取到的 JWT secret:", secret);

      const token = jsonwebtoken.sign(payload, secret, { expiresIn: "24h" });
      console.log("成功生成 JWT token, 长度:", token.length);

      return {
        success: true,
        message: "登录成功",
        token,
        user: { id: user.id, username: user.username, role: user.role },
      };
    } catch (jwtError) {
      console.error("JWT 生成错误:", jwtError);
      console.error(
        "JWT 错误堆栈:",
        jwtError instanceof Error ? jwtError.stack : "未知错误"
      );
      return { success: false, message: "Token 生成失败" };
    }
  } catch (error) {
    console.error("登录错误:", error);
    console.error(
      "错误堆栈:",
      error instanceof Error ? error.stack : "未知错误"
    );
    return { success: false, message: "登录处理失败" };
  }
}

/**
 * 用户注册
 * @param env 环境变量，包含数据库连接
 * @param username 用户名
 * @param password 密码(明文)
 * @param email 电子邮箱
 * @param role 用户角色
 * @returns 注册结果
 */
export async function registerUser(
  env: { DB: Bindings["DB"] } & any,
  username: string,
  password: string,
  email: string | null = null,
  role: string = "user"
): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    // 检查用户名是否已存在
    const existingUser = await repositories.getUserByUsername(username);
    if (existingUser) {
      return { success: false, message: "用户名已存在" };
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    const newUser = await repositories.createUser(
      username,
      hashedPassword,
      email,
      role
    );

    return {
      success: true,
      message: "注册成功",
      user: newUser,
    };
  } catch (error) {
    console.error("注册错误:", error);
    return { success: false, message: "注册处理失败" };
  }
}

/**
 * 获取当前用户信息
 * @param env 环境变量，包含数据库连接
 * @param userId 用户ID
 * @returns 用户信息
 */
export async function getCurrentUser(
  env: { DB: Bindings["DB"] } & any,
  userId: number
): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    const user = await repositories.getUserById(userId);

    if (!user) {
      return { success: false, message: "用户不存在" };
    }

    return {
      success: true,
      message: "获取用户信息成功",
      user,
    };
  } catch (error) {
    console.error("获取用户信息错误:", error);
    return { success: false, message: "获取用户信息失败" };
  }
}
