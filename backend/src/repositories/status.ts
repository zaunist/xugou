import { StatusPageConfig, Agent, Bindings } from "../models";
import { db } from "../config";
import {
  statusPageConfig,
  statusPageMonitors,
  statusPageAgents,
} from "../db/schema";
import { eq, desc, asc, and, count, sql } from "drizzle-orm";

/**
 * 状态页相关的数据库操作
 */

// 获取所有状态页配置
export async function getAllStatusPageConfigs() {
  return await db.select().from(statusPageConfig);
}

// 新增：根据用户ID获取状态页配置
export async function getStatusPageConfigByUserId(userId: number) {
  const config = await db
    .select()
    .from(statusPageConfig)
    .where(eq(statusPageConfig.user_id, userId))
    .limit(1);
  return config[0];
}

// 获取配置的监控项
export async function getConfigMonitors(configId: number) {
  return await db
    .select()
    .from(statusPageMonitors)
    .where(eq(statusPageMonitors.config_id, configId));
}

// 获取配置的客户端
export async function getConfigAgents(configId: number) {
  return await db
    .select()
    .from(statusPageAgents)
    .where(eq(statusPageAgents.config_id, configId));
}

// 获取状态页配置
export async function getStatusPageConfigById(id: number) {
  const config = await db
    .select()
    .from(statusPageConfig)
    .where(eq(statusPageConfig.id, id));
  return config[0];
}

// 更新状态页配置
export async function updateStatusPageConfig(
  id: number,
  title: string,
  description: string,
  logoUrl: string,
  customCss: string
) {
  return await db
    .update(statusPageConfig)
    .set({
      title: title,
      description: description,
      logo_url: logoUrl,
      custom_css: customCss,
    })
    .where(eq(statusPageConfig.id, id));
}

// 创建状态页配置
export async function createStatusPageConfig(
  userId: number,
  title: string,
  description: string,
  logoUrl: string,
  customCss: string
) {
  const result = await db
    .insert(statusPageConfig)
    .values({
      user_id: userId,
      title: title,
      description: description,
      logo_url: logoUrl,
      custom_css: customCss,
    })
    .returning({ id: statusPageConfig.id }); // D1/SQLite 需要这样获取ID

  if (!result || result.length === 0) {
    throw new Error("创建状态页配置失败");
  }

  // 获取新插入的ID
  return result[0].id;
}

// 清除配置的监控项关联
export async function clearConfigMonitorLinks(configId: number) {
  return await db
    .delete(statusPageMonitors)
    .where(eq(statusPageMonitors.config_id, configId));
}

// 清除配置的客户端关联
export async function clearConfigAgentLinks(configId: number) {
  return await db
    .delete(statusPageAgents)
    .where(eq(statusPageAgents.config_id, configId));
}

// 添加监控项到配置
export async function addMonitorToConfig(configId: number, monitorId: number) {
  return await db.insert(statusPageMonitors).values({
    config_id: configId,
    monitor_id: monitorId,
  });
}

// 添加客户端到配置
export async function addAgentToConfig(configId: number, agentId: number) {
  return await db.insert(statusPageAgents).values({
    config_id: configId,
    agent_id: agentId,
  });
}

// 获取选中的监控项IDs
export async function getSelectedMonitors(configId: number) {
  return await db
    .select({ monitor_id: statusPageMonitors.monitor_id })
    .from(statusPageMonitors)
    .where(eq(statusPageMonitors.config_id, configId));
}

// 获取选中的客户端IDs
export async function getSelectedAgents(configId: number) {
  return await db
    .select({ agent_id: statusPageAgents.agent_id })
    .from(statusPageAgents)
    .where(eq(statusPageAgents.config_id, configId));
}

// 新增：根据用户ID删除状态页配置
export async function deleteStatusPageConfigByUserId(userId: number) {
  await db.delete(statusPageConfig).where(eq(statusPageConfig.user_id, userId));
}