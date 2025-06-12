import { Hono } from "hono";
import { Bindings } from "../models/db";
import { getDashboardData } from "../services/DashboardService";
export const dashboard = new Hono<{ Bindings: Bindings }>();

// 获取仪表盘数据
dashboard.get("/", async (c) => {
  const result = await getDashboardData();
  return c.json(
    {
      monitors: result.monitors,
      agents: result.agents,
    },
    200
  );
});
