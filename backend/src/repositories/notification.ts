import {
  NotificationChannel,
  NotificationTemplate,
  NotificationSettings,
  NotificationHistory,
  NotificationConfig,
} from "../models";
import { db } from "../config";
import {
  notificationChannels,
  notificationTemplates,
  notificationSettings,
  notificationHistory,
} from "../db/schema";
import { eq, desc, asc, and, count, isNull } from "drizzle-orm";

// 获取所有通知渠道
export const getNotificationChannels = async (): Promise<
  NotificationChannel[]
> => {
  const result = await db
    .select()
    .from(notificationChannels)
    .orderBy(asc(notificationChannels.id));
  return result || [];
};

// 根据ID获取通知渠道
export const getNotificationChannelById = async (
  id: number
): Promise<NotificationChannel | null> => {
  const result = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.id, id));
  return result[0];
};

// 创建通知渠道
export const createNotificationChannel = async (
  channel: Omit<NotificationChannel, "id" | "created_at" | "updated_at">
): Promise<number> => {
  const result = await db
    .insert(notificationChannels)
    .values({
      name: channel.name,
      type: channel.type,
      config: channel.config,
      enabled: channel.enabled ? 1 : 0,
      created_by: channel.created_by,
    })
    .returning();

  return result[0].id;
};

// 更新通知渠道
export const updateNotificationChannel = async (
  id: number,
  channel: Partial<
    Omit<NotificationChannel, "id" | "created_at" | "updated_at">
  >
): Promise<boolean> => {
  
  const result = await db
    .update(notificationChannels)
    .set({
      name: channel.name,
      type: channel.type,
      config: channel.config,
      enabled: channel.enabled ? 1 : 0,
      updated_at: new Date().toISOString(),
    })
    .where(eq(notificationChannels.id, id));

  return result.success;
};

// 删除通知渠道
export const deleteNotificationChannel = async (
  id: number
): Promise<boolean> => {
  // 先删除通知历史记录表中的关联记录
  await db
    .delete(notificationHistory)
    .where(eq(notificationHistory.channel_id, id));

  // 再检查并更新通知设置中的channels列表
  const allSettings = await db.select().from(notificationSettings);

  // 遍历所有设置，从channels列表中移除要删除的渠道ID
  if (allSettings && allSettings.length > 0) {
    for (const setting of allSettings) {
      try {
        const channelsList = JSON.parse(setting.channels || "[]");
        const newChannelsList = channelsList.filter(
          (channelId: number) => channelId !== id
        );

        // 如果列表变化了，更新数据库
        if (JSON.stringify(channelsList) !== JSON.stringify(newChannelsList)) {
          await db
            .update(notificationSettings)
            .set({
              channels: JSON.stringify(newChannelsList),
            })
            .where(eq(notificationSettings.id, setting.id));
        }
      } catch (error) {
        console.error("解析通知设置渠道列表出错:", error);
      }
    }
  }

  // 最后删除通知渠道本身
  const result = await db
    .delete(notificationChannels)
    .where(eq(notificationChannels.id, id));

  return result.length > 0;
};

// 获取所有通知模板
export const getNotificationTemplates = async (): Promise<
  NotificationTemplate[]
> => {
  const result = await db
    .select()
    .from(notificationTemplates)
    .orderBy(
      desc(notificationTemplates.is_default),
      asc(notificationTemplates.id)
    );
  return result || [];
};

// 根据ID获取通知模板
export const getNotificationTemplateById = async (
  id: number
): Promise<NotificationTemplate | null> => {
  const result = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.id, id));
  return result;
};

// 创建通知模板
export const createNotificationTemplate = async (
  template: Omit<NotificationTemplate, "id" | "created_at" | "updated_at">
): Promise<number> => {
  const result = await db
    .insert(notificationTemplates)
    .values({
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content,
      is_default: template.is_default ? 1 : 0,
      created_by: template.created_by,
    })
    .returning();

  return result[0].id;
};

// 更新通知模板
export const updateNotificationTemplate = async (
  id: number,
  template: Partial<
    Omit<NotificationTemplate, "id" | "created_at" | "updated_at">
  >
): Promise<boolean> => {
  const sets: string[] = [];
  const values: any[] = [];

  if (template.name !== undefined) {
    sets.push("name = ?");
    values.push(template.name);
  }

  if (template.type !== undefined) {
    sets.push("type = ?");
    values.push(template.type);
  }

  if (template.subject !== undefined) {
    sets.push("subject = ?");
    values.push(template.subject);
  }

  if (template.content !== undefined) {
    sets.push("content = ?");
    values.push(template.content);
  }

  if (template.is_default !== undefined) {
    sets.push("is_default = ?");
    values.push(template.is_default ? 1 : 0);
  }

  if (sets.length === 0) {
    return false;
  }

  sets.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const result = await db
    .update(notificationTemplates)
    .set({
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content,
      is_default: template.is_default ? 1 : 0,
    })
    .where(eq(notificationTemplates.id, id));

  return result.length > 0;
};

// 删除通知模板
export const deleteNotificationTemplate = async (
  id: number
): Promise<boolean> => {
  const result = await db
    .delete(notificationTemplates)
    .where(eq(notificationTemplates.id, id));

  return result.length > 0;
};

// 获取全局通知设置
export const getGlobalSettings = async (): Promise<{
  monitorSettings: NotificationSettings | null;
  agentSettings: NotificationSettings | null;
}> => {
  const monitorSettings = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.target_type, "global-monitor"));

  const agentSettings = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.target_type, "global-agent"));
    
  return {
    monitorSettings: monitorSettings[0],
    agentSettings: agentSettings[0],
  };
};

// 获取特定对象的通知设置
export const getSpecificSettings = async (
  targetType: "monitor" | "agent",
  targetId?: number
): Promise<NotificationSettings[]> => {
  if (targetId !== undefined) {
    return await db
      .select()
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.target_type, targetType),
          eq(notificationSettings.target_id, targetId)
        )
      );
  }
  return await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.target_type, targetType));
};

// 创建或更新通知设置
export const createOrUpdateSettings = async (
  settings: Omit<NotificationSettings, "id" | "created_at" | "updated_at">
): Promise<number> => {
  // 确保target_id为0时使用isNull，否则使用eq
  const condition = settings.target_id === 0 ? isNull(notificationSettings.target_id) : eq(notificationSettings.target_id, settings.target_id);
  // 先检查是否已存在相同的设置
  const existingSettings = await db
    .select()
    .from(notificationSettings)
    .where(
      and(
        eq(notificationSettings.target_type, settings.target_type),
        condition
      )
    );

  if (existingSettings.length === 1) {
    const existingSetting = existingSettings[0];
    // 如果已存在则更新
    await db
      .update(notificationSettings)
      .set({
        enabled: settings.enabled ? 1 : 0,
        on_down: settings.on_down ? 1 : 0,
        on_recovery: settings.on_recovery ? 1 : 0,
        on_offline: settings.on_offline ? 1 : 0,
        on_cpu_threshold: settings.on_cpu_threshold ? 1 : 0,
        cpu_threshold: settings.cpu_threshold,
        on_memory_threshold: settings.on_memory_threshold ? 1 : 0,
        memory_threshold: settings.memory_threshold,
        on_disk_threshold: settings.on_disk_threshold ? 1 : 0,
        disk_threshold: settings.disk_threshold,
        channels: settings.channels,
        updated_at: new Date().toISOString(),
      })
      .where(eq(notificationSettings.id, existingSetting.id));
    return existingSettings.id;
  } else {
    // 如果不存在则创建
    const result = await db
      .insert(notificationSettings)
      .values({
        user_id: settings.user_id,
        target_type: settings.target_type,
        target_id: settings.target_id,
        enabled: settings.enabled ? 1 : 0,
        on_down: settings.on_down ? 1 : 0,
        on_recovery: settings.on_recovery ? 1 : 0,
        on_offline: settings.on_offline ? 1 : 0,
        on_cpu_threshold: settings.on_cpu_threshold ? 1 : 0,
        cpu_threshold: settings.cpu_threshold,
        on_memory_threshold: settings.on_memory_threshold ? 1 : 0,
        memory_threshold: settings.memory_threshold,
        on_disk_threshold: settings.on_disk_threshold ? 1 : 0,
        disk_threshold: settings.disk_threshold,
        channels: settings.channels,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning();

    return result[0].id;
  }
};

// 记录通知历史
export const createNotificationHistory = async (
  history: Omit<NotificationHistory, "id" | "sent_at">
): Promise<number> => {
  const result = await db
    .insert(notificationHistory)
    .values({
      type: history.type,
      target_id: history.target_id,
      channel_id: history.channel_id,
      template_id: history.template_id,
      status: history.status,
      content: history.content,
      error: history.error,
    })
    .returning();

  return result[0].id;
};

// 获取通知历史记录
export const getNotificationHistory = async (filter: {
  type?: string | undefined;
  targetId?: number | undefined;
  status?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}): Promise<{ total: number; records: NotificationHistory[] }> => {
  // 构建查询
  let whereConditions = [];
  let whereParams = [];

  if (filter.type) {
    whereConditions.push("type = ?");
    whereParams.push(filter.type);
  }

  if (filter.targetId !== undefined) {
    whereConditions.push("target_id = ?");
    whereParams.push(filter.targetId);
  }

  if (filter.status) {
    whereConditions.push("status = ?");
    whereParams.push(filter.status);
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // 查询总数
  const countResult = await db
    .select({ count: count() })
    .from(notificationHistory)
    .where(whereClause);
  const total = countResult?.count || 0;

  // 查询记录

  const recordsResult = await db
    .select()
    .from(notificationHistory)
    .where(whereClause)
    .orderBy(desc(notificationHistory.sent_at))
    .limit(filter.limit || 10)
    .offset(filter.offset || 0);

  return {
    total,
    records: recordsResult || [],
  };
};

// 获取完整的通知配置
export const getNotificationConfig = async (): Promise<NotificationConfig> => {
  // 获取所有渠道
  const channels = await getNotificationChannels();

  console.log("channels", channels);

  // 获取所有模板
  const templates = await getNotificationTemplates();

  console.log("templates", templates);

  // 获取全局设置
  const globalSettings = await getGlobalSettings();

  console.log("globalSettings", globalSettings);

  // 获取特定监控项设置
  const monitorSettings = await getSpecificSettings("monitor");

  console.log("monitorSettings", monitorSettings);

  // 获取特定客户端设置
  const agentSettings = await getSpecificSettings("agent");

  console.log("agentSettings", agentSettings);

    // 构建通知配置
  const config: NotificationConfig = {
    channels: channels,
    templates: templates,
    settings: {
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
    },
  };

  // 如果找到全局设置，应用到配置对象
  if (globalSettings.monitorSettings) {
    config.settings.monitors = {
      enabled: globalSettings.monitorSettings.enabled,
      onDown: globalSettings.monitorSettings.on_down,
      onRecovery: globalSettings.monitorSettings.on_recovery,
      channels: JSON.parse(globalSettings.monitorSettings.channels || "[]"),
    };
  }

  if (globalSettings.agentSettings) {
    config.settings.agents = {
      enabled: globalSettings.agentSettings.enabled,
      onOffline: globalSettings.agentSettings.on_offline,
      onRecovery: globalSettings.agentSettings.on_recovery,
      onCpuThreshold: globalSettings.agentSettings.on_cpu_threshold,
      cpuThreshold: globalSettings.agentSettings.cpu_threshold,
      onMemoryThreshold: globalSettings.agentSettings.on_memory_threshold,
      memoryThreshold: globalSettings.agentSettings.memory_threshold,
      onDiskThreshold: globalSettings.agentSettings.on_disk_threshold,
      diskThreshold: globalSettings.agentSettings.disk_threshold,
      channels: JSON.parse(globalSettings.agentSettings.channels || "[]"),
    };
  }

  // 处理特定监控项设置
  for (const setting of monitorSettings) {
    const monitorId = setting.target_id!.toString();

    config.settings.specificMonitors[monitorId] = {
      enabled: setting.enabled,
      onDown: setting.on_down,
      onRecovery: setting.on_recovery,
      channels: JSON.parse(setting.channels),
    };
  }

  // 处理特定客户端设置
  for (const setting of agentSettings) {
    const agentId = setting.target_id!.toString();

    config.settings.specificAgents[agentId] = {
      enabled: setting.enabled,
      onOffline: setting.on_offline,
      onRecovery: setting.on_recovery,
      onCpuThreshold: setting.on_cpu_threshold,
      cpuThreshold: setting.cpu_threshold,
      onMemoryThreshold: setting.on_memory_threshold,
      memoryThreshold: setting.memory_threshold,
      onDiskThreshold: setting.on_disk_threshold,
      diskThreshold: setting.disk_threshold,
      channels: JSON.parse(setting.channels),
    };
  }

  return config;
};
