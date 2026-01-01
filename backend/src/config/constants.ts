/**
 * 应用配置常量
 */

/**
 * JWT 配置
 */
export const JWT_CONFIG = {
  /**
   * Access Token 有效期：30天
   * 用户登录后 30 天内无需重新登录
   */
  ACCESS_TOKEN_EXPIRES_IN: "30d",

  /**
   * 默认 JWT 密钥（生产环境应使用 CloudFlare 版本 ID）
   */
  DEFAULT_SECRET: "your-secret-key-change-in-production",
};

/**
 * 认证相关配置
 */
export const AUTH_CONFIG = {
  /**
   * Bcrypt 加密盐的轮数
   */
  BCRYPT_SALT_ROUNDS: 10,

  /**
   * 密码最小长度
   */
  MIN_PASSWORD_LENGTH: 6,
};

/**
 * 监控配置
 */
export const MONITOR_CONFIG = {
  /**
   * 监控检查间隔（分钟）
   */
  CHECK_INTERVAL_MINUTES: 5,

  /**
   * 请求超时时间（毫秒）
   */
  REQUEST_TIMEOUT_MS: 30000,
};
