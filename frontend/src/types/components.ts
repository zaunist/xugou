/**
 * 组件相关类型定义
 */
import { NotificationChannel } from "./notification";
import { Monitor } from "./monitors";
import { Agent, MetricHistory } from "./agents";



// ChannelSelector 组件类型
export interface ChannelSelectorProps {
  channels: NotificationChannel[];
  selectedChannelIds: string[];
  onChange: (channelIds: string[]) => void;
}

// StatusSummaryCard 组件类型
export interface StatusItem {
  id: string;
  name: string;
  status: "up" | "down" | "pending" | "unknown" | "active" | "inactive";
  time?: string;
}

export interface StatusSummaryCardProps {
  title: string;
  items: StatusItem[];
  type: "monitors" | "agents";
}

// MonitorCard 组件类型
export interface MonitorCardProps {
  monitor: Monitor;
}

// StatusCodeSelect 组件类型
export interface StatusCodeSelectProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

// AgentCard 组件类型
export interface AgentCardProps {
  agent: Agent;
  metrics?: MetricHistory[];
  showIpAddress?: boolean; // 是否显示IP地址
  showHostname?: boolean; // 是否显示主机名
  showLastUpdated?: boolean; // 是否显示最后更新时间

  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

// Layout 组件类型
export interface LayoutProps {
  children: React.ReactNode;
}
