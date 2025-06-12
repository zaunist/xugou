import { int, sqliteTable, text, real, primaryKey } from "drizzle-orm/sqlite-core";

// 用户表
export const users = sqliteTable("users", {
  id: int("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull(),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
});

// 监控表
export const monitors = sqliteTable("monitors", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").notNull(),
  interval: int("interval").notNull(),
  timeout: int("timeout").notNull(),
  expected_status: int("expected_status").notNull(),
  headers: text("headers").notNull(),
  body: text("body"),
  created_by: int("created_by").notNull().references(() => users.id),
  active: int("active").notNull(), // SQLite 没有布尔类型，用 int 代替
  status: text("status").default("pending"),
  response_time: int("response_time").default(0),
  last_checked: text("last_checked"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
});

// 24小时监控状态历史表
export const monitorStatusHistory24h = sqliteTable("monitor_status_history_24h", {
  id: int("id").primaryKey({ autoIncrement: true }),
  monitor_id: int("monitor_id").notNull().references(() => monitors.id),
  status: text("status").notNull(),
  timestamp: text("timestamp").default("CURRENT_TIMESTAMP"),
  response_time: int("response_time"),
  status_code: int("status_code"),
  error: text("error")
});

// 监控每日统计表
export const monitorDailyStats = sqliteTable("monitor_daily_stats", {
  id: int("id").primaryKey({ autoIncrement: true }),
  monitor_id: int("monitor_id").notNull().references(() => monitors.id),
  date: text("date").notNull(),
  total_checks: int("total_checks").notNull().default(0),
  up_checks: int("up_checks").notNull().default(0),
  down_checks: int("down_checks").notNull().default(0),
  avg_response_time: int("avg_response_time").default(0),
  min_response_time: int("min_response_time").default(0),
  max_response_time: int("max_response_time").default(0),
  availability: real("availability").default(0),
  created_at: text("created_at").notNull()
});

// 客户端表
export const agents = sqliteTable("agents", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  created_by: int("created_by").notNull().references(() => users.id),
  status: text("status").default("inactive"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  hostname: text("hostname"),
  ip_addresses: text("ip_addresses"),
  os: text("os"),
  version: text("version"),
  keepalive: text("keepalive"),
});

// 客户端资源指标表
export const agentMetrics24h = sqliteTable("agent_metrics_24h", {
  id: int("id").primaryKey({ autoIncrement: true }),
  agent_id: int("agent_id").notNull().references(() => agents.id),
  timestamp: text("timestamp").default("CURRENT_TIMESTAMP"),
  cpu_usage: real("cpu_usage"),
  cpu_cores: int("cpu_cores"),
  cpu_model: text("cpu_model"),
  memory_total: int("memory_total"),
  memory_used: int("memory_used"),
  memory_free: int("memory_free"),
  memory_usage_rate: real("memory_usage_rate"),
  load_1: real("load_1"),
  load_5: real("load_5"),
  load_15: real("load_15"),
  disk_metrics: text("disk_metrics"),
  network_metrics: text("network_metrics")
});

// 状态页配置表
export const statusPageConfig = sqliteTable("status_page_config", {
  id: int("id").primaryKey({ autoIncrement: true }),
  user_id: int("user_id").notNull().references(() => users.id),
  title: text("title").notNull().default("系统状态"),
  description: text("description").default("系统当前运行状态"),
  logo_url: text("logo_url").default(""),
  custom_css: text("custom_css").default(""),
  created_at: text("created_at").default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").default("CURRENT_TIMESTAMP")
});

// 状态页监控项关联表
export const statusPageMonitors = sqliteTable("status_page_monitors", {
  config_id: int("config_id").notNull().references(() => statusPageConfig.id, { onDelete: "cascade" }),
  monitor_id: int("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey(table.config_id, table.monitor_id)
}));

// 状态页客户端关联表
export const statusPageAgents = sqliteTable("status_page_agents", {
  config_id: int("config_id").notNull().references(() => statusPageConfig.id, { onDelete: "cascade" }),
  agent_id: int("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey(table.config_id, table.agent_id)
}));

// 通知渠道表
export const notificationChannels = sqliteTable("notification_channels", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  config: text("config").notNull(),
  enabled: int("enabled").notNull().default(1),
  created_by: int("created_by").notNull().references(() => users.id),
  created_at: text("created_at").default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").default("CURRENT_TIMESTAMP")
});

// 通知模板表
export const notificationTemplates = sqliteTable("notification_templates", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  is_default: int("is_default").notNull().default(0),
  created_by: int("created_by").notNull().references(() => users.id),
  created_at: text("created_at").default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").default("CURRENT_TIMESTAMP")
});

// 通知设置表
export const notificationSettings = sqliteTable("notification_settings", {
  id: int("id").primaryKey({ autoIncrement: true }),
  user_id: int("user_id").notNull().references(() => users.id),
  target_type: text("target_type").notNull().default("global"),
  target_id: int("target_id"),
  enabled: int("enabled").notNull().default(1),
  on_down: int("on_down").notNull().default(1),
  on_recovery: int("on_recovery").notNull().default(1),
  on_offline: int("on_offline").notNull().default(1),
  on_cpu_threshold: int("on_cpu_threshold").notNull().default(0),
  cpu_threshold: int("cpu_threshold").notNull().default(90),
  on_memory_threshold: int("on_memory_threshold").notNull().default(0),
  memory_threshold: int("memory_threshold").notNull().default(85),
  on_disk_threshold: int("on_disk_threshold").notNull().default(0),
  disk_threshold: int("disk_threshold").notNull().default(90),
  channels: text("channels").default("[]"),
  created_at: text("created_at").default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").default("CURRENT_TIMESTAMP")
});

// 通知历史记录表
export const notificationHistory = sqliteTable("notification_history", {
  id: int("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  target_id: int("target_id"),
  channel_id: int("channel_id").notNull().references(() => notificationChannels.id),
  template_id: int("template_id").notNull().references(() => notificationTemplates.id),
  status: text("status").notNull(),
  content: text("content").notNull(),
  error: text("error"),
  sent_at: text("sent_at").default("CURRENT_TIMESTAMP")
});
