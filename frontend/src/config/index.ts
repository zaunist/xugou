/**
 * 应用配置
 */

// 优先从环境变量获取API基础URL
export const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 优先从环境变量获取API请求超时时间
export const ENV_API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 60000;
