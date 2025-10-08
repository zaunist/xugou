import * as repositories from "../repositories";
import { Agent } from "../models";

/**
 * 获取状态页配置
 * @param userId - 当前用户的ID
 * @returns 状态页配置对象
 */
export async function getStatusPageConfig(userId: number) {
  try {
    // 获取指定用户的状态页配置
    const existingConfig = await repositories.getStatusPageConfigByUserId(userId);

    if (!existingConfig) {
      // 如果用户没有配置，可以返回一个默认的空配置
      return {
        title: "系统状态",
        description: "实时监控系统运行状态",
        logoUrl: "",
        customCss: "",
        monitors: [],
        agents: [],
      };
    }

    console.log("使用的状态页配置:", existingConfig);

    // 获取被选中的监控项
    const monitorsResult = await repositories.getConfigMonitors(
      existingConfig.id
    );

    // 获取该用户的所有监控项
    const allMonitors = await repositories.getAllMonitors(userId);

    // 获取被选中的客户端
    const agentsResult = await repositories.getConfigAgents(
      existingConfig.id
    );

    // 获取该用户的所有客户端
    const allAgents = await repositories.getAllAgents(userId);

    // 构建返回的监控列表，标记哪些监控项被选中
    const monitors = allMonitors.map((monitor: any) => {
      const isSelected = monitorsResult.some(
        (m: any) => m.monitor_id === monitor.id
      );
      return { ...monitor, selected: isSelected };
    });

    // 构建返回的客户端列表，标记哪些客户端被选中
    const agents = allAgents.map((agent: any) => {
      const isSelected = agentsResult.some(
        (a: any) => a.agent_id === agent.id
      );
      return { ...agent, selected: isSelected };
    });

    return {
      title: existingConfig?.title || "",
      description: existingConfig?.description || "",
      logoUrl: existingConfig?.logo_url || "",
      customCss: existingConfig?.custom_css || "",
      monitors: monitors,
      agents: agents,
    };
  } catch (error) {
    console.error("获取状态页配置失败:", error);
    throw new Error("获取状态页配置失败");
  }
}


/**
 * 保存状态页配置
 * @param userId - 当前操作用户的ID
 * @param data - 要保存的配置数据
 * @returns 保存结果
 */
export async function saveStatusPageConfig(
  userId: number,
  data: {
    title: string;
    description: string;
    logoUrl: string;
    customCss: string;
    monitors: number[];
    agents: number[];
  }
) {
  try {
    const existingConfig = await repositories.getStatusPageConfigByUserId(userId);

    let configId: number;

    if (existingConfig && existingConfig.id) {
      // 更新现有配置
      await repositories.updateStatusPageConfig(
        existingConfig.id,
        data.title,
        data.description,
        data.logoUrl,
        data.customCss
      );
      configId = existingConfig.id;
    } else {
      // 如果不存在，则为当前用户创建一个新的全局配置
      const newConfigId = await repositories.createStatusPageConfig(
        userId,
        data.title,
        data.description,
        data.logoUrl,
        data.customCss
      );

      if (!newConfigId) {
        throw new Error("创建状态页配置失败");
      }
      configId = newConfigId;
    }

    // 清除并重新关联选定的监控项
    await repositories.clearConfigMonitorLinks(configId);
    if (data.monitors && data.monitors.length > 0) {
      for (const monitorId of data.monitors) {
        await repositories.addMonitorToConfig(configId, monitorId);
      }
    }

    // 清除并重新关联选定的客户端
    await repositories.clearConfigAgentLinks(configId);
    if (data.agents && data.agents.length > 0) {
      for (const agentId of data.agents) {
        await repositories.addAgentToConfig(configId, agentId);
      }
    }

    // 返回成功信息
    return { success: true, message: "配置已保存" };
  } catch (error) {
    console.error("保存状态页配置失败:", error);
    throw new Error("保存状态页配置失败");
  }
}

/**
 * 获取公共状态页所需的数据
 * @param userId - 用户ID
 * @returns 公共状态页数据
 */
export async function getStatusPagePublicData(userId: number) {
  // 获取用户的配置
  const config = await repositories.getStatusPageConfigByUserId(userId);

  if (!config) {
    console.log(`用户 ${userId} 没有找到状态页配置`);
    return {
      title: "系统状态",
      description: "当前没有可用的状态页配置。",
      logoUrl: "",
      customCss: "",
      monitors: [],
      agents: [],
    };
  }

  // 获取选中的监控项ID
  const selectedMonitors = await repositories.getSelectedMonitors(
    config.id as number
  );

  // 获取选中的客户端ID
  const selectedAgents = await repositories.getSelectedAgents(
    config.id as number
  );

  // 获取监控项的详细信息
  let monitors: any[] = [];
  if (selectedMonitors && selectedMonitors.length > 0) {
    const monitorIds = selectedMonitors.map((m: any) => m.monitor_id);
    if (monitorIds.length > 0) {
      for (const monitorId of monitorIds) {
        const monitor = await repositories.getMonitorById(monitorId, userId, "user"); // use "user" role to avoid admin check
        if (monitor) { // 确保监控项存在
          const monitorDailyStats = await repositories.getMonitorDailyStatsById(
            monitorId
          );
          const monitorHistory = await repositories.getMonitorStatusHistoryIn24h(
            monitorId
          );
          monitors.push({
            ...monitor,
            dailyStats: monitorDailyStats,
            history: monitorHistory,
          });
        }
      }
    }
  }

  // 获取客户端的详细信息
  let agents: Agent[] = [];
  if (selectedAgents && selectedAgents.length > 0) {
    const agentIds = selectedAgents.map((a: any) => a.agent_id);
    if (agentIds.length > 0) {
      const agentsResult = await repositories.getAgentsByIds(agentIds);
      if (agentsResult) {
        agents = agentsResult as Agent[];
      }
    }
  }

  return {
    title: config.title,
    description: config.description,
    logoUrl: config.logo_url,
    customCss: config.custom_css,
    monitors: monitors,
    agents: agents,
  };
}
