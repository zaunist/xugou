import { Hono } from "hono";
import { Bindings } from "../models/db";
import {
  getStatusPageConfig,
  saveStatusPageConfig,
  getStatusPagePublicData,
} from "../services/StatusService";

// 状态页配置接口
interface StatusPageConfig {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  monitors: number[]; // 已选择的监控项ID
  agents: number[]; // 已选择的客户端ID
}

// 创建API路由
const status = new Hono<{ Bindings: Bindings }>();

// 获取状态页配置(管理员)
status.get("/config", async (c) => {
  const payload = c.get("jwtPayload");
  const userId = payload.id;

  try {
    const config = await getStatusPageConfig(userId);
    return c.json(config);
  } catch (error) {
    console.error("获取状态页配置失败:", error);
    return c.json({ error: "获取状态页配置失败" }, 500);
  }
});

// 保存状态页配置
status.post("/config", async (c) => {
  const payload = c.get("jwtPayload");
  const userId = payload.id;
  const data = (await c.req.json()) as StatusPageConfig;

  console.log("接收到的配置数据:", JSON.stringify(data));

  if (!data) {
    console.log("无效的请求数据");
    return c.json({ error: "无效的请求数据" }, 400);
  }

  try {
    const result = await saveStatusPageConfig(userId, data);
    return c.json(result);
  } catch (error) {
    console.error("保存状态页配置失败:", error);
    return c.json({ error: "保存状态页配置失败" }, 500);
  }
});

status.get("/data", async (c) => {
  const result = await getStatusPagePublicData();
  return c.json(result);
});

export { status };
