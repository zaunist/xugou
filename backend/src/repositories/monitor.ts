import { Monitor } from "../models";

import { db } from "../config";
import {
  monitors,
  monitorStatusHistory24h,
  monitorDailyStats,
} from "../db/schema";
import { eq, desc, asc, and, inArray } from "drizzle-orm";

/**
 * 监控相关的数据库操作
 */

// 获取需要检查的监控列表
export async function getMonitorsToCheck() {
  // 使用SQL表达式或自定义函数来处理日期计算
  const allmonitors = await db.select().from(monitors).execute();

  // 在JavaScript中进行日期计算筛选
  const now = new Date().getTime();
  const monitorsToCheck = allmonitors.filter((monitor: Monitor) => {
    if (!monitor.last_checked) return true; // 如果没有检查过，需要检查

    const lastCheckedTime = new Date(monitor.last_checked).getTime();
    const intervalMs = (monitor.interval || 60) * 1000; // 转换为毫秒

    return now > lastCheckedTime + intervalMs;
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
export async function getMonitorById(id: number, userId: number, userRole: string) {
  const monitor = await db.select().from(monitors).where(eq(monitors.id, id));

  if (monitor.length === 0) {
    return null;
  }

  // 权限检查：管理员或所有者
  if (userRole !== 'admin' && monitor[0].created_by !== userId) {
    return null;
  }
  
  // 解析 headers 字段
  const monitorData = monitor[0];
  if (monitorData && typeof monitorData.headers === "string") {
    try {
      // @ts-ignore
      monitorData.headers = JSON.parse(monitorData.headers);
    } catch (e) {
      // @ts-ignore
      monitorData.headers = {};
    }
  }
  return monitorData;
}

// 获取所有监控
export async function getAllMonitors(userId: number) {
  const result = await db
    .select()
    .from(monitors)
    .where(eq(monitors.created_by, userId))
    .orderBy(desc(monitors.created_at));

  // 解析所有监控的 headers 字段
  if (result) {
    // fix: 为 monitor 参数添加 Monitor 类型
    result.forEach((monitor: Monitor) => {
      if (typeof monitor.headers === "string") {
        try {
          // @ts-ignore
          monitor.headers = JSON.parse(monitor.headers);
        } catch (e) {
          // @ts-ignore
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
export async function getAllMonitorStatusHistoryIn24h(userId: number) {
  const userMonitors = await getAllMonitors(userId);
  // fix: 添加 Monitor 类型以解决 TS7006
  const monitorIds = userMonitors.map((m: Monitor) => m.id);
  if (monitorIds.length === 0) return [];

  return await db
    .select()
    .from(monitorStatusHistory24h)
    // fix: 使用 inArray 查询多个监控项
    .where(inArray(monitorStatusHistory24h.monitor_id, monitorIds))
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

  await db.insert(monitorStatusHistory24h).values({
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

  await db
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

  const [newMonitor] = await db
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
        // @ts-ignore
      newMonitor.headers = JSON.parse(newMonitor.headers);
    } catch (e) {
        // @ts-ignore
      newMonitor.headers = {};
    }
  }

  return newMonitor;
}

// 更新监控配置
export async function updateMonitorConfig(
  id: number,
  // fix: 修正 Monitor 类型的使用
  updates: Partial<Monitor>
) {
  
  // 准备更新数据对象
  const updateData: { [key: string]: any } = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.url !== undefined) updateData.url = updates.url;
  if (updates.method !== undefined) updateData.method = updates.method;
  if (updates.interval !== undefined) updateData.interval = updates.interval;
  if (updates.timeout !== undefined) updateData.timeout = updates.timeout;
  if (updates.expected_status !== undefined) updateData.expected_status = updates.expected_status;
  if (updates.headers !== undefined) updateData.headers = JSON.stringify(updates.headers);
  if (updates.body !== undefined) updateData.body = updates.body;
  if (updates.active !== undefined) updateData.active = updates.active ? 1 : 0;


  // 如果没有要更新的字段，则提前返回
  if (Object.keys(updateData).length <= 1) { // 只有 updated_at
    return { message: "没有提供要更新的字段" };
  }

  // 执行更新
  const [updatedMonitor] = await db
    .update(monitors)
    .set(updateData)
    .where(eq(monitors.id, id))
    .returning();

  if (!updatedMonitor) {
    throw new Error("更新监控失败");
  }

  // 解析 headers 字段
  if (updatedMonitor && typeof updatedMonitor.headers === "string") {
    try {
        // @ts-ignore
      updatedMonitor.headers = JSON.parse(updatedMonitor.headers);
    } catch (e) {
        // @ts-ignore
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
  await db.delete(monitors).where(eq(monitors.id, id));
}

// 新增：根据用户ID删除监控
export async function deleteMonitorsByUserId(userId: number) {
  const userMonitors = await getAllMonitors(userId);
  // fix: 为参数 'm' 明确添加 Monitor 类型
  const monitorIds = userMonitors.map((m: Monitor) => m.id);

  if (monitorIds.length === 0) {
    return;
  }

  // 批量删除关联的历史数据和每日统计数据
  await db.delete(monitorStatusHistory24h).where(inArray(monitorStatusHistory24h.monitor_id, monitorIds));
  await db.delete(monitorDailyStats).where(inArray(monitorDailyStats.monitor_id, monitorIds));

  // 批量删除监控
  await db.delete(monitors).where(inArray(monitors.id, monitorIds));
}


export async function getMonitorDailyStatsById(id: number) {
  // 查询每日统计数据
  return await db
    .select()
    .from(monitorDailyStats)
    .where(eq(monitorDailyStats.monitor_id, id))
    .orderBy(asc(monitorDailyStats.date));
}

export async function getAllMonitorDailyStats(userId: number) {
  const userMonitors = await getAllMonitors(userId);
  // fix: 添加 Monitor 类型以解决 TS7006
  const monitorIds = userMonitors.map((m: Monitor) => m.id);
  if (monitorIds.length === 0) return [];

  return await db
    .select()
    .from(monitorDailyStats)
    // fix: 使用 inArray 查询多个监控项
    .where(inArray(monitorDailyStats.monitor_id, monitorIds))
    .orderBy(asc(monitorDailyStats.date));
}

