// 客户端类型定义
export interface Agent {
  id: number;
  name: string;
  token: string;
  created_by: number;
  status: string | null;
  created_at: string;
  updated_at: string;
  hostname: string | null;
  keepalive: string | null;
  ip_addresses: string | null; // 存储多个IP地址的JSON字符串
  os: string | null;
  version: string | null;
}

// 客户端类型定义
export interface AgentWithMetrics {
  id: number;
  name: string;
  token: string;
  created_by: number;
  status: string;
  created_at: string;
  updated_at: string;
  hostname: string | null;
  keepalive: string | null;
  ip_addresses: string | null; // 存储多个IP地址的JSON字符串
  os: string | null;
  version: string | null;
  metrics: Metrics[] | null;
}

export interface Metrics {
  agent_id: number;
  timestamp: string;
  cpu_usage: number;
  cpu_cores: number;
  cpu_model: string;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  memory_usage_rate: number;
  load_1: number;
  load_5: number;
  load_15: number;
  disk_metrics: string;
  network_metrics: string;
}
