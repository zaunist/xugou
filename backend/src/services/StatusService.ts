import * as repositories from "../repositories";
import { Agent } from "../models";

/**
 * 获取状态页配置
 * @param userId - 当前用户的ID（修复后此参数被忽略，以获取全局配置）
 * @returns 状态页配置对象
 */
export async function getStatusPageConfig(userId: number) {
  try {
    // 修复：状态页配置是全局的，不应按用户ID查找。获取所有配置并使用第一个。
    const allConfigs = await repositories.getAllStatusPageConfigs();

    if (!allConfigs || allConfigs.length === 0) {
      // 备注：如果系统中没有任何配置，将抛出错误。首次使用时，管理员需要先保存一次配置。
      throw new Error("状态页配置不存在");
    }

    // 将第一个配置视为全局配置
    const existingConfig = allConfigs[0];

    console.log("使用的状态页配置:", existingConfig);

    // 获取被选中的监控项
    const monitorsResult = await repositories.getConfigMonitors(
      existingConfig.id
    );

    // 获取所有监控项
    const allMonitors = await repositories.getAllMonitors();

    // 获取被选中的客户端
    const agentsResult = await repositories.getConfigAgents(
      existingConfig.id
    );

    // 获取所有客户端
    const allAgents = await repositories.getAllAgents();

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
    // 修复：同样，保存时也应操作全局的第一个配置
    const allConfigs = await repositories.getAllStatusPageConfigs();
    const existingConfig = (allConfigs && allConfigs.length > 0) ? allConfigs[0] : null;

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
 * @returns 公共状态页数据
 */
export async function getStatusPagePublicData() {
  // 获取所有配置
  const configsResult = await repositories.getAllStatusPageConfigs();

  if (!configsResult || configsResult.length === 0) {
    console.log("没有找到任何状态页配置");
    return {
      title: "系统状态",
      description: "当前没有可用的状态页配置。",
      logoUrl: "",
      customCss: "",
      monitors: [],
      agents: [],
    };
  }

  // 使用第一个配置作为全局配置
  const config = configsResult[0];

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
        const monitor = await repositories.getMonitorById(monitorId);
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
