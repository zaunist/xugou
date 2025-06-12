import * as repositories from "../repositories";
import { Agent } from "../models";

export async function getStatusPageConfig(userId: number) {
  try {
    // 检查是否已存在配置
    const existingConfig = await repositories.getStatusPageConfigById(userId);

    if (!existingConfig) {
      throw new Error("状态页配置不存在");
    }

    console.log("existingConfig", existingConfig);

    // 获取被选中的监控项
    const monitorsResult = await repositories.getConfigMonitors(
      existingConfig.id
    );

    // 获取所有监控项
    const allMonitors = await repositories.getAllMonitors();
    console.log("monitorsResult", monitorsResult);

    // 获取被选中的客户端
    const agentsResult = await repositories.getConfigAgents(
      existingConfig.id
    );

    // 获取所有客户端
    const allAgents = await repositories.getAllAgents();

    console.log("agentsResult", agentsResult);

    // 构建返回的监控列表，将 allMonitors 和 monitorsResult 去重，同时 monitorsResult 中存在的需要标记为选中
    const monitors = allMonitors.map((monitor: any) => {
      const isSelected = monitorsResult.some(
        (m: any) => m.monitor_id === monitor.id
      );
      return { ...monitor, selected: isSelected };
    });

    // 构建返回的客户端列表，将 allAgents 和 agentsResult 去重，同时 agentsResult 中存在的需要标记为选中
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
    // 检查是否已存在配置
    const existingConfig = await repositories.getStatusPageConfigById(userId);

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
      // 创建新配置
      const insertResult = await repositories.createStatusPageConfig(
        userId,
        data.title,
        data.description,
        data.logoUrl,
        data.customCss
      );

      if (!insertResult || typeof insertResult.id !== "number") {
        throw new Error("创建状态页配置失败");
      }

      configId = insertResult.id;
    }

    // 清除现有的监控项关联
    await repositories.clearConfigMonitorLinks(configId);

    // 清除现有的客户端关联
    await repositories.clearConfigAgentLinks(configId);

    // 添加选定的监控项
    if (data.monitors && data.monitors.length > 0) {
      for (const monitorId of data.monitors) {
        await repositories.addMonitorToConfig(configId, monitorId);
      }
    }

    // 添加选定的客户端
    if (data.agents && data.agents.length > 0) {
      for (const agentId of data.agents) {
        await repositories.addAgentToConfig(configId, agentId);
      }
    }

    return existingConfig;
  } catch (error) {
    console.error("保存状态页配置失败:", error);
    throw new Error("保存状态页配置失败");
  }
}

export async function getStatusPagePublicData() {
  // 获取所有配置
  const configsResult = await repositories.getAllStatusPageConfigs();

  if (!configsResult || configsResult.length === 0) {
    console.log("没有找到任何配置");

    return {
      title: "故障状态",
      description: "没有找到任何数据，请检查",
      logoUrl: "",
      customCss: "",
      monitors: [],
      agents: [],
    };
  }

  // 简单处理：获取第一个配置
  const config = configsResult[0];

  // 获取选中的监控项
  const selectedMonitors = await repositories.getSelectedMonitors(
    config.id as number
  );


  // 获取选中的客户端
  const selectedAgents = await repositories.getSelectedAgents(
    config.id as number
  );

  // 获取监控项详细信息
  let monitors: any[] = [];
  if (selectedMonitors && selectedMonitors.length > 0) {
    const monitorIds = selectedMonitors.map((m: any) => m.monitor_id);
    if (monitorIds.length > 0) {
      for (const monitorId of monitorIds) {
        const monitor = await repositories.getMonitorById(monitorId);
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

  let agents: Agent[] = [];

  // 获取客户端基本信息
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
