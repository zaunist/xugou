import { Bindings } from "../models/db";
import * as AgentRepository from "../repositories";
import { generateToken, verifyToken } from "../utils/jwt";
import { handleAgentThresholdNotification } from "../jobs/agent-task";

/**
 * 获取所有客户端
 * @param db 数据库连接
 * @returns 客户端列表
 */
export async function getAgents() {
  try {
    const result = await AgentRepository.getAllAgents();
    return {
      success: true,
      agents: result || [],
      status: 200,
    };
  } catch (error) {
    console.error("获取客户端列表错误:", error);
    return {
      success: false,
      message: "获取客户端列表失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 根据ID获取客户端详情
 * @param db 数据库连接
 * @param agentId 客户端ID
 * @returns 客户端详情
 */
export async function getAgentDetail(agentId: number) {
  // 获取客户端信息
  const agent = await AgentRepository.getAgentById(agentId);

  if (!agent) {
    throw new Error("客户端不存在");
  }

  // 不返回令牌，但保留其他所有字段
  const { token, ...rest } = agent;

  return {
    ...rest,
    ip_addresses: getFormattedIPAddresses(agent.ip_addresses as any),
  };
}

/**
 * 更新客户端信息
 * @param db 数据库连接
 * @param agentId 客户端ID
 * @param updateData 更新数据
 * @returns 更新结果
 */
export async function updateAgentService(
  db: Bindings["DB"],
  agentId: number,
  updateData: {
    name?: string;
    hostname?: string;
    ip_addresses?: string[];
    os?: string;
    version?: string;
    status?: string;
  }
) {
  try {
    // 获取当前客户端数据
    const agent = await AgentRepository.getAgentById(agentId);

    if (!agent) {
      return { success: false, message: "客户端不存在", status: 404 };
    }

    // 验证数据
    if (updateData.name && updateData.name.trim() === "") {
      return { success: false, message: "客户端名称不能为空", status: 400 };
    }

    if (updateData.ip_addresses && updateData.ip_addresses.length > 0) {
      agent.ip_addresses = JSON.stringify(updateData.ip_addresses);
    } else {
      agent.ip_addresses = "[]";
    }

    agent.name = updateData.name;
    agent.hostname = updateData.hostname;
    agent.os = updateData.os;
    agent.version = updateData.version;
    agent.status = updateData.status;

    // 执行更新
    const updatedAgent = await AgentRepository.updateAgent(agent);

    return {
      success: true,
      message: "客户端信息已更新",
      agent: updatedAgent,
      status: 200,
    };
  } catch (error) {
    console.error("更新客户端错误:", error);
    return {
      success: false,
      message: "更新客户端失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 删除客户端
 * @param db 数据库连接
 * @param agentId 客户端ID
 * @returns 删除结果
 */
export async function deleteAgentService(agentId: number) {
  try {
    // 获取客户端信息
    const agent = await AgentRepository.getAgentById(agentId);
    if (!agent) {
      throw new Error("客户端不存在");
    }

    // 删除客户端通知设置
    await AgentRepository.deleteNotificationSettings("agent", agent.id);

    // 执行删除客户端
    await AgentRepository.deleteAgent(agent.id);

    return true;
  } catch (error) {
    console.error("删除客户端错误:", error);
    throw error;
  }
}

/**
 * 生成客户端注册令牌
 * @param env 环境变量
 * @returns 生成结果
 */
export async function generateAgentToken(env: any) {
  try {
    return await generateToken(env);
  } catch (error) {
    console.error("生成令牌错误:", error);
    throw new Error("生成令牌失败");
  }
}

/**
 * 验证客户端注册令牌
 * @param token 令牌
 * @param env 环境变量
 * @returns 验证结果
 */
export async function verifyAgentToken(token: string, env: any) {
  try {
    return await verifyToken(token, env);
  } catch (error) {
    console.error("验证令牌错误:", error);
    return { valid: false, message: "令牌验证失败" };
  }
}

/**
 * 获取格式化后的IP地址
 * @param ipAddressesJson IP地址的JSON字符串
 * @returns 格式化后的IP地址
 */
export function getFormattedIPAddresses(
  ipAddressesJson: string | null
): string {
  try {
    if (!ipAddressesJson) return "未知";
    const ipArray = JSON.parse(String(ipAddressesJson));
    return Array.isArray(ipArray) && ipArray.length > 0
      ? ipArray.join(", ")
      : "未知";
  } catch (e) {
    return String(ipAddressesJson || "未知");
  }
}

export async function registerAgentService(
  env: any,
  token: string,
  name: string,
  hostname: string | null = null,
  ipAddresses: string[] | null = null,
  os: string | null = null,
  version: string | null = null
) {
  try {
    // 验证令牌
    if (!token) {
      return { success: false, message: "缺少注册令牌", status: 400 };
    }

    // 通过token查找客户端
    const existingAgent = await AgentRepository.getAgentByToken(token);

    if (existingAgent && existingAgent.id) {
      return {
        success: true,
        message: "客户端已存在",
        status: 200,
        agent: {
          id: existingAgent.id,
        },
      };
    }

    // 验证令牌
    const tokenVerification = await verifyAgentToken(token, env);

    // 如果令牌无效，返回错误
    if (!tokenVerification.valid) {
      return {
        success: false,
        message: `注册令牌无效: ${tokenVerification.message}`,
        status: 400,
      };
    }

    // 查找管理员用户作为客户端创建者
    const adminId = await AgentRepository.getAdminUserId();

    // 创建新客户端
    const newAgent = await AgentRepository.createAgent(
      name,
      token,
      adminId,
      "active",
      hostname || "unknown",
      os || "unknown",
      version || "unknown",
      ipAddresses || []
    );

    return {
      success: true,
      message: "客户端注册成功",
      agent: { id: newAgent.id },
      status: 201,
    };
  } catch (error) {
    console.error("客户端注册错误:", error);
    return {
      success: false,
      message: "客户端注册失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 更新客户端状态
 * @param db 数据库连接
 * @param env 环境变量
 * @param status 客户端指标
 * @returns 更新结果
 */
export async function updateAgentStatusService(status: any) {
  try {
    const statusData = Array.isArray(status) ? status : [status];
    const norlmalInfo = {
      token: statusData[0]?.token,
      ip_addresses: statusData[0]?.ip_addresses,
      hostname: statusData[0]?.hostname,
      os: statusData[0]?.os,
      version: statusData[0]?.version,
      keepalive: statusData[0]?.keepalive,
      status: "active",
    };

    console.log("norlmalInfo", norlmalInfo);

    if (!norlmalInfo.token) {
      throw new Error("缺少API令牌");
    }
    // 通过token查找客户端
    const agent = await AgentRepository.getAgentByToken(norlmalInfo.token);

    if (
      agent.status != "active" ||
      agent.hostname != norlmalInfo.hostname ||
      agent.ip_addresses != norlmalInfo.ip_addresses ||
      agent.os != norlmalInfo.os ||
      agent.version != norlmalInfo.version
    ) {
      agent.ip_addresses = JSON.stringify(norlmalInfo.ip_addresses);
      agent.hostname = norlmalInfo.hostname;
      agent.os = norlmalInfo.os;
      agent.version = norlmalInfo.version;
      agent.keepalive = norlmalInfo.keepalive;
      agent.status = norlmalInfo.status;

      console.log("update agent info: ", agent);

      await AgentRepository.updateAgent(agent);
    }

    // 插入 metric 信息

    const metrics = statusData.map((item) => ({
      agent_id: agent.id,
      timestamp: new Date().toISOString(),
      cpu_usage: item?.cpu?.usage,
      cpu_cores: item?.cpu?.cores,
      cpu_model: item?.cpu?.model_name,
      memory_total: item?.memory?.total,
      memory_used: item?.memory?.used,
      memory_free: item?.memory?.free,
      memory_usage_rate: item?.memory?.usage_rate,
      load_1: item?.load?.load1,
      load_5: item?.load?.load5,
      load_15: item?.load?.load15,
      disk_metrics: JSON.stringify(item?.disks || []),
      network_metrics: JSON.stringify(item?.network || []),
    }));

    console.log("metrics", metrics);

    const result = await AgentRepository.insertAgentMetrics(metrics);
    console.log("插入指标结果:", result);

    // 取出 metrics中的最新一条数据用于通知
    const latestMetric = metrics[metrics.length - 1];
    console.log("latestMetric cpu", latestMetric.cpu_usage);
    console.log("latestMetric memory", latestMetric.memory_usage_rate);
    await handleAgentThresholdNotification(
      agent.id,
      "cpu",
      latestMetric.cpu_usage
    );

    await handleAgentThresholdNotification(
      agent.id,
      "memory",
      latestMetric.memory_usage_rate
    );

    return {
      agentId: agent.id,
    };
  } catch (error) {
    console.error("更新客户端状态错误:", error);
    throw error;
  }
}

export async function getAgentById(id: number) {
  return await AgentRepository.getAgentById(id);
}

export async function getActiveAgents() {
  return await AgentRepository.getActiveAgents();
}

export async function setAgentInactive(id: number) {
  return await AgentRepository.setAgentInactive(id);
}

export async function getAgentMetrics(agentId: number) {
  return await AgentRepository.getAgentMetrics(agentId);
}

export async function getLatestAgentMetrics(agentId: number) {
  return await AgentRepository.getLatestAgentMetrics(agentId);
}
