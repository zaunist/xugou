import api from "./client";
import type {
  NotificationChannel,
  NotificationConfig,
  NotificationTemplate,
} from "../types/notification";

type BackendNotificationChannel = {
  id: number;
  name: string;
  type: string;
  config: string | Record<string, unknown> | null;
  enabled: number | boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
};

type BackendNotificationTemplate = {
  id: number;
  name: string;
  type: string;
  subject: string;
  content: string;
  is_default: number | boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
};

export type NotificationSettings = NotificationConfig["settings"];

export interface NotificationConfigResponse {
  success: boolean;
  message?: string;
  data?: NotificationConfig;
}

const parseChannelConfig = (
  config: BackendNotificationChannel["config"]
): Record<string, unknown> => {
  if (!config) {
    return {};
  }

  if (typeof config === "string") {
    try {
      const parsed = JSON.parse(config);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch (error) {
      console.error("解析通知渠道配置失败:", error);
    }
    return {};
  }

  if (typeof config === "object" && !Array.isArray(config)) {
    return config as Record<string, unknown>;
  }

  return {};
};

const normalizeBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }

  return fallback;
};

const normalizeNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeChannelIds = (value: unknown): number[] => {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item));
      }
    } catch (error) {
      console.error("解析通知渠道ID列表失败:", error);
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item));
  }

  return [];
};

const transformChannel = (
  channel: BackendNotificationChannel
): NotificationChannel => ({
  id: Number(channel.id),
  name: channel.name,
  type: channel.type,
  config: parseChannelConfig(channel.config),
  enabled: normalizeBoolean(channel.enabled, true),
  createdBy: channel.created_by,
  createdAt: channel.created_at,
  updatedAt: channel.updated_at,
});

const transformTemplate = (
  template: BackendNotificationTemplate
): NotificationTemplate => ({
  id: Number(template.id),
  name: template.name,
  type: template.type,
  subject: template.subject,
  content: template.content,
  isDefault: normalizeBoolean(template.is_default, false),
  createdBy: template.created_by,
  createdAt: template.created_at,
  updatedAt: template.updated_at,
});

const normalizeSettings = (settings: any): NotificationSettings => {
  const normalized: NotificationSettings = {
    monitors: {
      enabled: false,
      onDown: false,
      onRecovery: false,
      channels: [],
    },
    agents: {
      enabled: false,
      onOffline: false,
      onRecovery: false,
      onCpuThreshold: false,
      cpuThreshold: 90,
      onMemoryThreshold: false,
      memoryThreshold: 85,
      onDiskThreshold: false,
      diskThreshold: 90,
      channels: [],
    },
    specificMonitors: {},
    specificAgents: {},
  };

  if (!settings) {
    return normalized;
  }

  if (settings.monitors) {
    normalized.monitors = {
      enabled: normalizeBoolean(settings.monitors.enabled),
      onDown: normalizeBoolean(settings.monitors.onDown ?? settings.monitors.on_down),
      onRecovery: normalizeBoolean(
        settings.monitors.onRecovery ?? settings.monitors.on_recovery
      ),
      channels: normalizeChannelIds(settings.monitors.channels),
    };
  }

  if (settings.agents) {
    normalized.agents = {
      enabled: normalizeBoolean(settings.agents.enabled),
      onOffline: normalizeBoolean(settings.agents.onOffline ?? settings.agents.on_offline),
      onRecovery: normalizeBoolean(
        settings.agents.onRecovery ?? settings.agents.on_recovery
      ),
      onCpuThreshold: normalizeBoolean(
        settings.agents.onCpuThreshold ?? settings.agents.on_cpu_threshold
      ),
      cpuThreshold: normalizeNumber(settings.agents.cpuThreshold ?? settings.agents.cpu_threshold, 90),
      onMemoryThreshold: normalizeBoolean(
        settings.agents.onMemoryThreshold ?? settings.agents.on_memory_threshold
      ),
      memoryThreshold: normalizeNumber(
        settings.agents.memoryThreshold ?? settings.agents.memory_threshold,
        85
      ),
      onDiskThreshold: normalizeBoolean(
        settings.agents.onDiskThreshold ?? settings.agents.on_disk_threshold
      ),
      diskThreshold: normalizeNumber(
        settings.agents.diskThreshold ?? settings.agents.disk_threshold,
        90
      ),
      channels: normalizeChannelIds(settings.agents.channels),
    };
  }

  if (settings.specificMonitors) {
    Object.entries(settings.specificMonitors).forEach(
      ([monitorId, monitorSetting]: [string, any]) => {
        normalized.specificMonitors[monitorId] = {
          enabled: normalizeBoolean(monitorSetting?.enabled),
          onDown: normalizeBoolean(
            monitorSetting?.onDown ?? monitorSetting?.on_down
          ),
          onRecovery: normalizeBoolean(
            monitorSetting?.onRecovery ?? monitorSetting?.on_recovery
          ),
          channels: normalizeChannelIds(monitorSetting?.channels),
        };
      }
    );
  }

  if (settings.specificAgents) {
    Object.entries(settings.specificAgents).forEach(
      ([agentId, agentSetting]: [string, any]) => {
        normalized.specificAgents[agentId] = {
          enabled: normalizeBoolean(agentSetting?.enabled),
          onOffline: normalizeBoolean(
            agentSetting?.onOffline ?? agentSetting?.on_offline
          ),
          onRecovery: normalizeBoolean(
            agentSetting?.onRecovery ?? agentSetting?.on_recovery
          ),
          onCpuThreshold: normalizeBoolean(
            agentSetting?.onCpuThreshold ?? agentSetting?.on_cpu_threshold
          ),
          cpuThreshold: normalizeNumber(
            agentSetting?.cpuThreshold ?? agentSetting?.cpu_threshold,
            normalized.agents.cpuThreshold
          ),
          onMemoryThreshold: normalizeBoolean(
            agentSetting?.onMemoryThreshold ?? agentSetting?.on_memory_threshold
          ),
          memoryThreshold: normalizeNumber(
            agentSetting?.memoryThreshold ?? agentSetting?.memory_threshold,
            normalized.agents.memoryThreshold
          ),
          onDiskThreshold: normalizeBoolean(
            agentSetting?.onDiskThreshold ?? agentSetting?.on_disk_threshold
          ),
          diskThreshold: normalizeNumber(
            agentSetting?.diskThreshold ?? agentSetting?.disk_threshold,
            normalized.agents.diskThreshold
          ),
          channels: normalizeChannelIds(agentSetting?.channels),
        };
      }
    );
  }

  return normalized;
};

// 获取完整的通知配置
export const getNotificationConfig =
  async (): Promise<NotificationConfigResponse> => {
    try {
      const response = await api.get<{
        success: boolean;
        message?: string;
        data?: {
          channels?: BackendNotificationChannel[];
          templates?: BackendNotificationTemplate[];
          settings?: any;
        };
      }>("/api/notifications");

      const backendData = response.data.data;

      if (!backendData) {
        return {
          success: response.data.success,
          message: response.data.message,
        };
      }

      const channels = Array.isArray(backendData.channels)
        ? (backendData.channels as BackendNotificationChannel[]).map(
            transformChannel
          )
        : [];

      const templates = Array.isArray(backendData.templates)
        ? (backendData.templates as BackendNotificationTemplate[]).map(
            transformTemplate
          )
        : [];

      return {
        success: response.data.success,
        message: response.data.message,
        data: {
          channels,
          templates,
          settings: normalizeSettings(backendData.settings),
        },
      };
    } catch (error) {
      console.error("获取通知配置失败:", error);
      return {
        success: false,
        message: "获取通知配置失败",
      };
    }
  };

// 获取通知渠道列表
export const getNotificationChannels = async (): Promise<{
  success: boolean;
  message?: string;
  channels?: NotificationChannel[];
}> => {
  try {
    const response = await api.get<{
      success: boolean;
      message?: string;
      data?: BackendNotificationChannel[];
    }>("/api/notifications/channels");

    const channels = Array.isArray(response.data.data)
      ? response.data.data.map(transformChannel)
      : [];

    return {
      success: response.data.success,
      message: response.data.message,
      channels,
    };
  } catch (error) {
    console.error("获取通知渠道失败:", error);
    return {
      success: false,
      message: "获取通知渠道失败",
    };
  }
};

// 获取通知模板列表
export const getNotificationTemplates = async (): Promise<{
  success: boolean;
  message?: string;
  templates?: NotificationTemplate[];
}> => {
  try {
    const response = await api.get<{
      success: boolean;
      message?: string;
      data?: BackendNotificationTemplate[];
    }>("/api/notifications/templates");

    const templates = Array.isArray(response.data.data)
      ? response.data.data.map(transformTemplate)
      : [];

    return {
      success: response.data.success,
      message: response.data.message,
      templates,
    };
  } catch (error) {
    console.error("获取通知模板失败:", error);
    return {
      success: false,
      message: "获取通知模板失败",
    };
  }
};

// 保存通知设置
export const saveNotificationSettings = async (
  settings: NotificationSettings
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    // 创建一个请求队列，用于批量保存设置
    const saveRequests: Promise<any>[] = [];

    // 转换全局监控设置
    const monitorSettings = {
      target_type: "global-monitor",
      enabled: settings.monitors.enabled,
      on_down: settings.monitors.onDown,
      on_recovery: settings.monitors.onRecovery,
      channels: JSON.stringify(settings.monitors.channels),
    };

    saveRequests.push(api.post("/api/notifications/settings", monitorSettings));

    // 转换全局客户端设置
    const agentSettings = {
      target_type: "global-agent",
      enabled: settings.agents.enabled,
      on_offline: settings.agents.onOffline,
      on_recovery: settings.agents.onRecovery,
      on_cpu_threshold: settings.agents.onCpuThreshold,
      cpu_threshold: settings.agents.cpuThreshold,
      on_memory_threshold: settings.agents.onMemoryThreshold,
      memory_threshold: settings.agents.memoryThreshold,
      on_disk_threshold: settings.agents.onDiskThreshold,
      disk_threshold: settings.agents.diskThreshold,
      channels: JSON.stringify(settings.agents.channels),
    };

    saveRequests.push(api.post("/api/notifications/settings", agentSettings));

    // 处理特定监控设置
    for (const monitorId in settings.specificMonitors) {
      const monitorSetting = settings.specificMonitors[monitorId];

      const specificMonitorSettings = {
        target_type: "monitor",
        target_id: parseInt(monitorId),
        enabled: monitorSetting.enabled,
        on_down: monitorSetting.onDown,
        on_recovery: monitorSetting.onRecovery,
        channels: JSON.stringify(monitorSetting.channels),
      };

      saveRequests.push(
        api.post("/api/notifications/settings", specificMonitorSettings)
      );
    }

    // 处理特定客户端设置
    for (const agentId in settings.specificAgents) {
      const agentSetting = settings.specificAgents[agentId];

      const specificAgentSettings = {
        target_type: "agent",
        target_id: parseInt(agentId),
        enabled: agentSetting.enabled,
        on_offline: agentSetting.onOffline,
        on_recovery: agentSetting.onRecovery,
        on_cpu_threshold: agentSetting.onCpuThreshold,
        cpu_threshold: agentSetting.cpuThreshold,
        on_memory_threshold: agentSetting.onMemoryThreshold,
        memory_threshold: agentSetting.memoryThreshold,
        on_disk_threshold: agentSetting.onDiskThreshold,
        disk_threshold: agentSetting.diskThreshold,
        channels: JSON.stringify(agentSetting.channels),
      };

      saveRequests.push(
        api.post("/api/notifications/settings", specificAgentSettings)
      );
    }

    // 并行执行所有保存请求
    const results = await Promise.all(saveRequests);

    // 检查是否有任何请求失败
    const failedRequests = results.filter(
      (response) => !response.data?.success
    );

    if (failedRequests.length > 0) {
      console.error("部分通知设置保存失败:", failedRequests);
      return {
        success: false,
        message: "部分通知设置保存失败",
      };
    }

    return {
      success: true,
      message: "通知设置保存成功",
    };
  } catch (error) {
    console.error("保存通知设置失败:", error);
    return {
      success: false,
      message: "保存通知设置失败",
    };
  }
};

// 创建通知渠道
export const createNotificationChannel = async (
  channel: Omit<NotificationChannel, "id" | "createdBy" | "createdAt" | "updatedAt">
): Promise<{
  success: boolean;
  message?: string;
  channelId?: number;
}> => {
  try {
    const response = await api.post<{
      success: boolean;
      message?: string;
      data?: { id: number };
    }>("/api/notifications/channels", channel);

    return {
      success: response.data.success,
      message: response.data.message,
      channelId: response.data.data?.id,
    };
  } catch (error) {
    console.error("创建通知渠道失败:", error);
    return {
      success: false,
      message: "创建通知渠道失败",
    };
  }
};

// 更新通知渠道
export const updateNotificationChannel = async (
  id: number,
  channel: Partial<
    Omit<NotificationChannel, "id" | "createdBy" | "createdAt" | "updatedAt">
  >
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const payload: Record<string, unknown> = {};
    if (channel.name !== undefined) payload.name = channel.name;
    if (channel.type !== undefined) payload.type = channel.type;
    if (channel.config !== undefined) payload.config = channel.config;
    if (channel.enabled !== undefined) payload.enabled = channel.enabled;

    const response = await api.put<{
      success: boolean;
      message?: string;
    }>(`/api/notifications/channels/${id}`, payload);

    return response.data;
  } catch (error) {
    console.error("更新通知渠道失败:", error);
    return {
      success: false,
      message: "更新通知渠道失败",
    };
  }
};

// 删除通知渠道
export const deleteNotificationChannel = async (
  id: number
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await api.delete<{
      success: boolean;
      message?: string;
    }>(`/api/notifications/channels/${id}`);

    return response.data;
  } catch (error) {
    console.error("删除通知渠道失败:", error);
    return {
      success: false,
      message: "删除通知渠道失败",
    };
  }
};

// 创建通知模板
export const createNotificationTemplate = async (
  template: Omit<NotificationTemplate, "id" | "createdBy" | "createdAt" | "updatedAt">
): Promise<{
  success: boolean;
  message?: string;
  templateId?: number;
}> => {
  try {
    const payload = {
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content,
      is_default: template.isDefault,
    };

    const response = await api.post<{
      success: boolean;
      message?: string;
      data?: { id: number };
    }>("/api/notifications/templates", payload);

    return {
      success: response.data.success,
      message: response.data.message,
      templateId: response.data.data?.id,
    };
  } catch (error) {
    console.error("创建通知模板失败:", error);
    return {
      success: false,
      message: "创建通知模板失败",
    };
  }
};

// 更新通知模板
export const updateNotificationTemplate = async (
  id: number,
  template: Partial<
    Omit<NotificationTemplate, "id" | "createdBy" | "createdAt" | "updatedAt">
  >
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const payload: Record<string, unknown> = {};
    if (template.name !== undefined) payload.name = template.name;
    if (template.type !== undefined) payload.type = template.type;
    if (template.subject !== undefined) payload.subject = template.subject;
    if (template.content !== undefined) payload.content = template.content;
    if (template.isDefault !== undefined) {
      payload.is_default = template.isDefault;
    }

    const response = await api.put<{ success: boolean; message?: string }>(
      `/api/notifications/templates/${id}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("更新通知模板失败:", error);
    return {
      success: false,
      message: "更新通知模板失败",
    };
  }
};

// 删除通知模板
export const deleteNotificationTemplate = async (
  id: number
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await api.delete(`/api/notifications/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error("删除通知模板失败:", error);
    return {
      success: false,
      message: "删除通知模板失败",
    };
  }
};

// 获取通知历史记录
export const getNotificationHistory = async (params: {
  type?: string;
  targetId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  message?: string;
  data?: any[];
}> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append("type", params.type);
    if (params.targetId !== undefined)
      queryParams.append("targetId", params.targetId.toString());
    if (params.status) queryParams.append("status", params.status);
    if (params.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params.offset !== undefined)
      queryParams.append("offset", params.offset.toString());

    const url = `/api/notifications/history?${queryParams.toString()}`;
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    console.error("获取通知历史记录失败:", error);
    return {
      success: false,
      message: "获取通知历史记录失败",
    };
  }
};
