// 通知渠道类型定义
export interface NotificationChannel {
  id: number;
  name: string;
  type: string; // telegram, resend, feishu, wecom
  config: string; // JSON字符串
  enabled: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// 通知模板类型定义
export interface NotificationTemplate {
  id: number;
  name: string;
  type: string; // default, custom
  subject: string;
  content: string;
  is_default: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}



// 前端接口所需的通知配置类型
export interface NotificationConfig {
  channels: NotificationChannel[];
  templates: NotificationTemplate[];
  settings: {
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
      };
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
      };
    };
  };
}
