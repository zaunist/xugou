import api from './index';

// 通知渠道类型
export interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  enabled: boolean;
}

// 通知模板类型
export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  isDefault: boolean;
}

// 通知设置类型
export interface NotificationSettings {
  monitors: {
    enabled: boolean;
    onDown: boolean;
    onRecovery: boolean;
    channels: string[];
  };
  agents: {
    enabled: boolean;
    onOffline: boolean;
    onRecovery: boolean;
    onCpuThreshold: boolean;
    cpuThreshold: number;
    onMemoryThreshold: boolean;
    memoryThreshold: number;
    onDiskThreshold: boolean;
    diskThreshold: number;
    channels: string[];
  };
  specificMonitors: {
    [monitorId: string]: {
      enabled: boolean;
      onDown: boolean;
      onRecovery: boolean;
      channels: string[];
      overrideGlobal: boolean;
    }
  };
  specificAgents: {
    [agentId: string]: {
      enabled: boolean;
      onOffline: boolean;
      onRecovery: boolean;
      onCpuThreshold: boolean;
      cpuThreshold: number;
      onMemoryThreshold: boolean;
      memoryThreshold: number;
      onDiskThreshold: boolean;
      diskThreshold: number;
      channels: string[];
      overrideGlobal: boolean;
    }
  };
}

// 通知配置响应类型
export interface NotificationConfigResponse {
  success: boolean;
  message?: string;
  data?: {
    channels: NotificationChannel[];
    templates: NotificationTemplate[];
    settings: NotificationSettings;
  };
}

// 获取完整的通知配置
export const getNotificationConfig = async (): Promise<NotificationConfigResponse> => {
  try {
    const response = await api.get<NotificationConfigResponse>('/api/notifications');
    
    // 如果响应成功并且有数据，处理数据格式
    if (response.data.success && response.data.data) {
      // 处理渠道配置 - 确保config字段是对象而不是字符串
      if (response.data.data.channels) {
        response.data.data.channels = response.data.data.channels.map(channel => {
          // 使用类型断言访问后端特有属性
          const backendChannel = channel as any;
          return {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            // 将字符串类型的config解析为对象
            config: typeof backendChannel.config === 'string' 
              ? JSON.parse(backendChannel.config) 
              : backendChannel.config,
            enabled: !!backendChannel.enabled
          };
        });
      }
      
      // 处理模板配置 - 确保is_default是布尔类型
      if (response.data.data.templates) {
        response.data.data.templates = response.data.data.templates.map(template => {
          // 使用类型断言访问后端特有属性
          const backendTemplate = template as any;
          return {
            id: template.id,
            name: template.name,
            type: template.type,
            subject: template.subject,
            content: template.content,
            isDefault: !!backendTemplate.is_default
          };
        });
      }
      
      // 确保settings中的所有布尔字段是真正的布尔类型而不是0/1
      if (response.data.data.settings) {
        const { settings } = response.data.data;
        
        // 处理全局监控设置
        if (settings.monitors) {
          settings.monitors = {
            ...settings.monitors,
            enabled: !!settings.monitors.enabled,
            onDown: !!settings.monitors.onDown,
            onRecovery: !!settings.monitors.onRecovery
          };
        }
        
        // 处理全局客户端设置
        if (settings.agents) {
          settings.agents = {
            ...settings.agents,
            enabled: !!settings.agents.enabled,
            onOffline: !!settings.agents.onOffline,
            onRecovery: !!settings.agents.onRecovery,
            onCpuThreshold: !!settings.agents.onCpuThreshold,
            onMemoryThreshold: !!settings.agents.onMemoryThreshold,
            onDiskThreshold: !!settings.agents.onDiskThreshold
          };
        }
        
        // 处理特定监控设置
        if (settings.specificMonitors) {
          Object.keys(settings.specificMonitors).forEach(monitorId => {
            const monitorSetting = settings.specificMonitors[monitorId];
            settings.specificMonitors[monitorId] = {
              ...monitorSetting,
              enabled: !!monitorSetting.enabled,
              onDown: !!monitorSetting.onDown,
              onRecovery: !!monitorSetting.onRecovery,
              overrideGlobal: !!monitorSetting.overrideGlobal
            };
          });
        }
        
        // 处理特定客户端设置
        if (settings.specificAgents) {
          Object.keys(settings.specificAgents).forEach(agentId => {
            const agentSetting = settings.specificAgents[agentId];
            settings.specificAgents[agentId] = {
              ...agentSetting,
              enabled: !!agentSetting.enabled,
              onOffline: !!agentSetting.onOffline,
              onRecovery: !!agentSetting.onRecovery,
              onCpuThreshold: !!agentSetting.onCpuThreshold,
              onMemoryThreshold: !!agentSetting.onMemoryThreshold,
              onDiskThreshold: !!agentSetting.onDiskThreshold,
              overrideGlobal: !!agentSetting.overrideGlobal
            };
          });
        }
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('获取通知配置失败:', error);
    return {
      success: false,
      message: '获取通知配置失败'
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
      data?: NotificationChannel[];
    }>('/api/notifications/channels');
    
    return {
      success: response.data.success,
      message: response.data.message,
      channels: response.data.data
    };
  } catch (error) {
    console.error('获取通知渠道失败:', error);
    return {
      success: false,
      message: '获取通知渠道失败'
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
      data?: NotificationTemplate[];
    }>('/api/notifications/templates');
    
    return {
      success: response.data.success,
      message: response.data.message,
      templates: response.data.data
    };
  } catch (error) {
    console.error('获取通知模板失败:', error);
    return {
      success: false,
      message: '获取通知模板失败'
    };
  }
};

// 保存通知设置
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    // 创建一个请求队列，用于批量保存设置
    const saveRequests: Promise<any>[] = [];

    // 转换全局监控设置
    const monitorSettings = {
      target_type: 'global-monitor',
      enabled: settings.monitors.enabled,
      on_down: settings.monitors.onDown,
      on_recovery: settings.monitors.onRecovery,
      channels: JSON.stringify(settings.monitors.channels),
      override_global: false
    };
    
    saveRequests.push(
      api.post('/api/notifications/settings', monitorSettings)
    );

    // 转换全局客户端设置
    const agentSettings = {
      target_type: 'global-agent',
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
      override_global: false
    };
    
    saveRequests.push(
      api.post('/api/notifications/settings', agentSettings)
    );

    // 处理特定监控设置
    for (const monitorId in settings.specificMonitors) {
      const monitorSetting = settings.specificMonitors[monitorId];
      
      const specificMonitorSettings = {
        target_type: 'monitor',
        target_id: parseInt(monitorId),
        enabled: monitorSetting.enabled,
        on_down: monitorSetting.onDown,
        on_recovery: monitorSetting.onRecovery,
        channels: JSON.stringify(monitorSetting.channels),
        override_global: monitorSetting.overrideGlobal
      };
      
      saveRequests.push(
        api.post('/api/notifications/settings', specificMonitorSettings)
      );
    }

    // 处理特定客户端设置
    for (const agentId in settings.specificAgents) {
      const agentSetting = settings.specificAgents[agentId];
      
      const specificAgentSettings = {
        target_type: 'agent',
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
        override_global: agentSetting.overrideGlobal
      };
      
      saveRequests.push(
        api.post('/api/notifications/settings', specificAgentSettings)
      );
    }

    // 并行执行所有保存请求
    const results = await Promise.all(saveRequests);
    
    // 检查是否有任何请求失败
    const failedRequests = results.filter(response => !response.data?.success);
    
    if (failedRequests.length > 0) {
      console.error('部分通知设置保存失败:', failedRequests);
      return {
        success: false,
        message: '部分通知设置保存失败'
      };
    }
    
    return {
      success: true,
      message: '通知设置保存成功'
    };
  } catch (error) {
    console.error('保存通知设置失败:', error);
    return {
      success: false,
      message: '保存通知设置失败'
    };
  }
};

// 创建通知渠道
export const createNotificationChannel = async (channel: Omit<NotificationChannel, 'id'>): Promise<{
  success: boolean;
  message?: string;
  channelId?: string;
}> => {
  try {
    const response = await api.post<{
      success: boolean;
      message?: string;
      data?: { id: string };
    }>('/api/notifications/channels', channel);
    
    return {
      success: response.data.success,
      message: response.data.message,
      channelId: response.data.data?.id
    };
  } catch (error) {
    console.error('创建通知渠道失败:', error);
    return {
      success: false,
      message: '创建通知渠道失败'
    };
  }
};

// 更新通知渠道
export const updateNotificationChannel = async (id: string, channel: Partial<NotificationChannel>): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await api.put<{
      success: boolean;
      message?: string;
    }>(`/api/notifications/channels/${id}`, channel);
    
    return response.data;
  } catch (error) {
    console.error('更新通知渠道失败:', error);
    return {
      success: false,
      message: '更新通知渠道失败'
    };
  }
};

// 删除通知渠道
export const deleteNotificationChannel = async (id: string): Promise<{
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
    console.error('删除通知渠道失败:', error);
    return {
      success: false,
      message: '删除通知渠道失败'
    };
  }
};

// 创建通知模板
export const createNotificationTemplate = async (template: Omit<NotificationTemplate, 'id'>): Promise<{
  success: boolean;
  message?: string;
  templateId?: string;
}> => {
  try {
    const response = await api.post<{
      success: boolean;
      message?: string;
      data?: { id: string };
    }>('/api/notifications/templates', template);
    
    return {
      success: response.data.success,
      message: response.data.message,
      templateId: response.data.data?.id
    };
  } catch (error) {
    console.error('创建通知模板失败:', error);
    return {
      success: false,
      message: '创建通知模板失败'
    };
  }
};

// 更新通知模板
export const updateNotificationTemplate = async (id: string, template: Partial<NotificationTemplate>): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await api.put(`/api/notifications/templates/${id}`, template);
    return response.data;
  } catch (error) {
    console.error('更新通知模板失败:', error);
    return {
      success: false,
      message: '更新通知模板失败'
    };
  }
};

// 删除通知模板
export const deleteNotificationTemplate = async (id: string): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await api.delete(`/api/notifications/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除通知模板失败:', error);
    return {
      success: false,
      message: '删除通知模板失败'
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
    if (params.type) queryParams.append('type', params.type);
    if (params.targetId !== undefined) queryParams.append('targetId', params.targetId.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
    
    const url = `/api/notifications/history?${queryParams.toString()}`;
    const response = await api.get(url);
    
    return response.data;
  } catch (error) {
    console.error('获取通知历史记录失败:', error);
    return {
      success: false,
      message: '获取通知历史记录失败'
    };
  }
}; 