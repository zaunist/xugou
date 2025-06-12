import { Agent, Metrics } from "../models/agent";
import { agents, agentMetrics24h } from "../db/schema";
import { db } from "../config";
import { desc, eq, inArray } from "drizzle-orm";
/**
 * 客户端相关的数据库操作
 */

// 获取所有客户端
export async function getAllAgents() {
  return await db.select().from(agents).orderBy(desc(agents.created_at));
}

// 批量获取客户端详情
export async function getAgentsByIds(agentIds: number[]) {
  if (agentIds.length === 0) {
    return { results: [] };
  }
  return await db.select().from(agents).where(inArray(agents.id, agentIds));
}

// 批量获取客户端指标
export async function getAgentMetricsByIds(agentIds: number[]) {
  if (agentIds.length === 0) {
    return { results: [] };
  }
  return await db
    .select()
    .from(agentMetrics24h)
    .where(inArray(agentMetrics24h.agent_id, agentIds));
}

// 获取单个客户端详情
export async function getAgentById(id: number) {
  const agent = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return agent[0];
}

// 创建新客户端
export async function createAgent(
  name: string,
  token: string,
  createdBy: number,
  status: string = "inactive",
  hostname: string | null = null,
  os: string | null = null,
  version: string | null = null,
  ipAddresses: string[] | null = null,
  keepalive: string | null = null
) {
  const now = new Date().toISOString();

  // 将 ipAddresses 数组转换为 JSON 字符串
  const ipAddressesJson = ipAddresses ? JSON.stringify(ipAddresses) : null;

  const result = await db.insert(agents).values({
    name,
    token,
    created_by: createdBy,
    status,
    created_at: now,
    updated_at: now,
    hostname,
    ip_addresses: ipAddressesJson,
    os,
    version,
    keepalive,
  }).returning();

  if (!result) {
    throw new Error("创建客户端失败");
  }
  return result[0];
}

// 更新客户端信息
export async function updateAgent(
  agent: Agent
) {
  agent.updated_at = new Date().toISOString();
  
  // 从 agent 对象中排除 id 等索引相关属性，避免更新主键
  const { id, token, created_by, ...updateData } = agent;

  try {
    // 确保 updateData 中不包含 id
    const updatedAgent = await db.update(agents).set(updateData).where(eq(agents.id, id)).returning();
    return updatedAgent[0];
  } catch (error) {
    console.error("更新客户端失败:", error);
    throw new Error("更新客户端失败");
  }
}

// 删除客户端
export async function deleteAgent(id: number) {
  // 先删除关联的指标数据
  await db.delete(agentMetrics24h).where(eq(agentMetrics24h.agent_id, id));

  const result = await db.delete(agents).where(eq(agents.id, id));

  if (!result.success) {
    throw new Error("删除客户端失败");
  }

  return { success: true, message: "客户端已删除" };
}

// 通过令牌获取客户端
export async function getAgentByToken(token: string) {
  const agent = await db.select().from(agents).where(eq(agents.token, token));
  return agent[0];
}

// 获取活跃状态的客户端
export async function getActiveAgents() {
  const activeAgents = await db
   .select()
   .from(agents)
   .where(eq(agents.status, "active"));
  return activeAgents;
}

// 设置客户端为离线状态
export async function setAgentInactive(id: number) {
  const now = new Date().toISOString();

  return await db
    .update(agents)
    .set({ status: "inactive", updated_at: now })
    .where(eq(agents.id, id));
}

// 插入客户端资源指标
export async function insertAgentMetrics(metrics: Metrics[]) {
  return await db.batch(metrics.map(metric => db.insert(agentMetrics24h).values(metric)));
}

// 获取指定客户端资源指标
export async function getAgentMetrics(agentId: number) {
  return await db
    .select()
    .from(agentMetrics24h)
    .where(eq(agentMetrics24h.agent_id, agentId));
}

// 获取指定客户端的最新指标
export async function getLatestAgentMetrics(agentId: number) {
  const metrics = await db
    .select()
    .from(agentMetrics24h)
    .where(eq(agentMetrics24h.agent_id, agentId))
    .orderBy(desc(agentMetrics24h.timestamp))
    .limit(1);
  return metrics[0];
}
