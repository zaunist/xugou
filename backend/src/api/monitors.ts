import { Hono } from "hono";
import { Bindings } from "../models/db";
import * as MonitorService from "../services/MonitorService";

const monitors = new Hono<{ Bindings: Bindings }>();

// 获取所有监控
monitors.get("/", async (c) => {
  const payload = c.get("jwtPayload");

  // 调用服务层获取监控列表
  const result = await MonitorService.getAllMonitors(payload.id);

  return c.json(
    {
      success: result.success,
      monitors: result.monitors,
    },
    result.status as any
  );
});

// 获取所有监控的每日统计数据
monitors.get("/daily", async (c) => {
  const payload = c.get("jwtPayload");
  // 调用服务层获取所有监控的每日统计数据
  const result = await MonitorService.getAllMonitorDailyStats(payload.id);

  return c.json({
    success: result.success,
    dailyStats: result.dailyStats,
    message: result.message,
  });
});

// 创建监控
monitors.post("/", async (c) => {
  const payload = c.get("jwtPayload");
  const data = await c.req.json();

  // 调用服务层创建监控
  const result = await MonitorService.createMonitor(data, payload.id);

  return c.json(
    {
      success: result.success,
      monitor: result.monitor,
      message: result.message,
    },
    result.status as any
  );
});

// 获取所有监控状态历史
monitors.get("/history", async (c) => {
  const payload = c.get("jwtPayload");
  // 调用服务层获取监控历史
  const result = await MonitorService.getAllMonitorStatusHistory(payload.id);

  return c.json(
    {
      success: result.success,
      history: result.history,
    },
    result.status as any
  );
});

// 获取单个监控
monitors.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层获取监控详情
  const result = await MonitorService.getMonitorById(id, payload.id, payload.role);

  return c.json(
    {
      success: result.success,
      monitor: result.monitor,
      message: result.message,
    },
    result.status as any
  );
});

// 更新监控
monitors.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const data = await c.req.json();
  const payload = c.get("jwtPayload"); // 获取用户信息

  // 调用服务层更新监控，并传入用户信息以进行权限验证
  const result = await MonitorService.updateMonitor(id, data, payload.id, payload.role);

  return c.json(
    {
      success: result.success,
      monitor: result.monitor,
      message: result.message,
    },
    result.status as any
  );
});

// 删除监控
monitors.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层删除监控，并传入用户信息以进行权限验证
  const result = await MonitorService.deleteMonitor(id, payload.id, payload.role);

  return c.json(
    {
      success: result.success,
      message: result.message,
    },
    result.status as any
  );
});

// 获取单个监控状态历史
monitors.get("/:id/history", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层获取监控历史
  const result = await MonitorService.getMonitorStatusHistoryById(
    id,
    payload.id,
    payload.role
  );

  return c.json(
    {
      success: result.success,
      history: result.history,
      message: result.message,
    },
    result.status as any
  );
});

// 获取单个监控的每日统计数据
monitors.get("/:id/daily", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层获取每日统计数据
  const result = await MonitorService.getMonitorDailyStats(id, payload.id, payload.role);

  return c.json({
    success: result.success,
    dailyStats: result.dailyStats,
    message: result.message,
  });
});

// 手动检查单个监控
monitors.post("/:id/check", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层手动检查监控，并传入用户信息以进行权限验证
  const result = await MonitorService.manualCheckMonitor(id, payload.id, payload.role);

  return c.json(
    {
      success: result.success,
      message: result.message,
      result: result.result,
    },
    result.status as any
  );
});

export { monitors };
