import { Monitor } from "../models";

import { db } from "../config";
import {
  monitors,
  monitorStatusHistory24h,
  monitorDailyStats,
} from "../db/schema";
import { eq, desc, asc, lt } from "drizzle-orm";

/**
 * 监控相关的数据库操作
 */

// 获取需要检查的监控列表
export async function getMonitorsToCheck() {
  
  // 使用SQL表达式或自定义函数来处理日期计算
  const allmonitors = await db
    .select()
    .from(monitors)
    .execute();
    
  // 在JavaScript中进行日期计算筛选
  const now = new Date().getTime();
  const monitorsToCheck = allmonitors.filter((monitor: Monitor) => {
    if (!monitor.last_checked) return true; // 如果没有检查过，需要检查
    
    const lastCheckedTime = new Date(monitor.last_checked).getTime();
    const intervalMs = (monitor.interval || 60) * 1000; // 转换为毫秒
    
    return now > (lastCheckedTime + intervalMs);
  });

  // 解析所有监控的 headers 字段
  if (monitorsToCheck) {
    monitorsToCheck.forEach((monitor: Monitor) => {
      if (typeof monitor.headers === "string") {
        try {
          monitor.headers = JSON.parse(monitor.headers);
        } catch (e) {
          monitor.headers = {};
        }
      }
    });
  }
  return monitorsToCheck;
}

// 获取单个监控详情
export async function getMonitorById(id: number) {
  const monitor = await db.select().from(monitors).where(eq(monitors.id, id));

  // 解析 headers 字段
  if (monitor && typeof monitor.headers === "string") {
    try {
      monitor.headers = JSON.parse(monitor.headers);
    } catch (e) {
      monitor.headers = {};
    }
  }
  return monitor[0];
}

// 获取所有监控
export async function getAllMonitors() {
  const result = await db
    .select()
    .from(monitors)
    .orderBy(desc(monitors.created_at));

  // 解析所有监控的 headers 字段
  if (result) {
    result.forEach((monitor: Monitor) => {
      if (typeof monitor.headers === "string") {
        try {
          monitor.headers = JSON.parse(monitor.headers);
        } catch (e) {
          monitor.headers = {};
        }
      }
    });
  }

  return result;
}

// 获取单个监控状态历史 24小时内
export async function getMonitorStatusHistoryIn24h(monitorId: number) {
  return await db
    .select()
    .from(monitorStatusHistory24h)
    .where(eq(monitorStatusHistory24h.monitor_id, monitorId))
    .orderBy(asc(monitorStatusHistory24h.timestamp));
}

// 获取所有监控状态历史 24小时内
export async function getAllMonitorStatusHistoryIn24h() {
  return await db
    .select()
    .from(monitorStatusHistory24h)
    .orderBy(asc(monitorStatusHistory24h.timestamp));
}
// 记录监控状态历史到热表
export async function insertMonitorStatusHistory(
  monitorId: number,
  status: string,
  response_time: number,
  status_code: number,
  error: string | null
) {
  // 使用ISO格式的时间戳
  const now = new Date().toISOString();

  return await db.insert(monitorStatusHistory24h).values({
    monitor_id: monitorId,
    status: status,
    timestamp: now,
    response_time: response_time,
    status_code: status_code,
    error: error,
  });
}

// 更新监控状态
export async function updateMonitorStatus(
  monitorId: number,
  status: string,
  responseTime: number
) {
  // 使用ISO格式的时间戳
  const now = new Date().toISOString();

  return await db
    .update(monitors)
    .set({
      status: status,
      last_checked: now,
      response_time: responseTime,
    })
    .where(eq(monitors.id, monitorId));
}

// 创建新监控
export async function createMonitor(
  name: string,
  url: string,
  method: string = "GET",
  interval: number = 60,
  timeout: number = 30,
  expectedStatus: number = 200,
  headers: Record<string, string> = {},
  body: string = "",
  userId: number
) {
  const now = new Date().toISOString();

  const newMonitor = await db
    .insert(monitors)
    .values({
      name: name,
      url: url,
      method: method,
      interval: interval,
      timeout: timeout,
      expected_status: expectedStatus,
      headers: JSON.stringify(headers),
      body: body,
      created_by: userId,
      active: 1,
      status: "pending",
      response_time: 0,
      last_checked: null,
      created_at: now,
      updated_at: now,
    })
    .returning();

  if (!newMonitor) {
    throw new Error("创建监控失败");
  }

  if (newMonitor && typeof newMonitor.headers === "string") {
    try {
      newMonitor.headers = JSON.parse(newMonitor.headers);
    } catch (e) {
      newMonitor.headers = {};
    }
  }

  return newMonitor;
}

// 更新监控配置
export async function updateMonitorConfig(
  id: number,
  updates: Partial<Monitor>
) {
  // 准备更新字段
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }

  if (updates.url !== undefined) {
    fields.push("url = ?");
    values.push(updates.url);
  }

  if (updates.method !== undefined) {
    fields.push("method = ?");
    values.push(updates.method);
  }

  if (updates.interval !== undefined) {
    fields.push("interval = ?");
    values.push(updates.interval);
  }

  if (updates.timeout !== undefined) {
    fields.push("timeout = ?");
    values.push(updates.timeout);
  }

  if (updates.expected_status !== undefined) {
    fields.push("expected_status = ?");
    values.push(updates.expected_status);
  }

  if (updates.headers !== undefined) {
    fields.push("headers = ?");
    values.push(JSON.stringify(updates.headers));
  }

  if (updates.body !== undefined) {
    fields.push("body = ?");
    values.push(updates.body);
  }

  if (updates.active !== undefined) {
    fields.push("active = ?");
    values.push(updates.active ? 1 : 0);
  }

  // 添加更新时间
  fields.push("updated_at = ?");
  values.push(new Date().toISOString());

  // 没有要更新的字段时返回
  if (fields.length === 0) {
    return { message: "没有提供要更新的字段" };
  }

  // 添加 ID 作为 WHERE 条件
  values.push(id);

  // 执行更新
  const updatedMonitor = await db
    .update(monitors)
    .set({
      name: updates.name,
      url: updates.url,
      method: updates.method,
      interval: updates.interval,
      timeout: updates.timeout,
      expected_status: updates.expected_status,
      headers: JSON.stringify(updates.headers),
    })
    .where(eq(monitors.id, id))
    .returning();

  if (!updatedMonitor) {
    throw new Error("更新监控失败");
  }

  // 解析 headers 字段
  if (updatedMonitor && typeof updatedMonitor.headers === "string") {
    try {
      updatedMonitor.headers = JSON.parse(updatedMonitor.headers);
    } catch (e) {
      updatedMonitor.headers = {};
    }
  }

  return updatedMonitor;
}

// 删除监控
export async function deleteMonitor(id: number) {
  // 先删除关联的历史数据

  await db
    .delete(monitorStatusHistory24h)
    .where(eq(monitorStatusHistory24h.monitor_id, id));

  // 删除每日统计数据
  await db
    .delete(monitorDailyStats)
    .where(eq(monitorDailyStats.monitor_id, id));

  // 执行删除监控
  return await db.delete(monitors).where(eq(monitors.id, id));
}

export async function getMonitorDailyStatsById(id: number) {
  // 查询每日统计数据
  return await db
    .select()
    .from(monitorDailyStats)
    .where(eq(monitorDailyStats.monitor_id, id))
    .orderBy(asc(monitorDailyStats.date));
}

export async function getAllMonitorDailyStats() {
  return await db
    .select()
    .from(monitorDailyStats)
    .orderBy(asc(monitorDailyStats.date));
}
