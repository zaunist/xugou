/**
 * JWT工具类，提供JWT相关的通用功能
 */

/**
 * 获取JWT密钥
 * 优先从环境变量中获取JWT_SECRET，如果不存在则使用默认值
 *
 * @param c Cloudflare环境上下文
 * @returns JWT密钥
 */
export const getJwtSecret = (c: any): string => {
  // 检查是否直接包含 CF_VERSION_METADATA
  if (c.CF_VERSION_METADATA) {
    const { id: versionId } = c.CF_VERSION_METADATA;
    return versionId || "your-secret-key-change-in-production";
  }

  // 检查是否在 env 属性下包含 CF_VERSION_METADATA
  if (c.env && c.env.CF_VERSION_METADATA) {
    console.log("context.env 包含 CF_VERSION_METADATA");
    const { id: versionId } = c.env.CF_VERSION_METADATA;
    console.log("解析出的 versionId:", versionId);
    return versionId || "your-secret-key-change-in-production";
  }

  console.error("错误: 未找到 CF_VERSION_METADATA");
  return "your-secret-key-change-in-production";
};

/**
 * 生成随机令牌
 * 生成用于API密钥或认证令牌的随机字符串，包含时间戳、前缀和签名
 *
 * @param env 环境变量或上下文对象，用于获取密钥
 * @returns 生成的随机令牌
 */
export async function generateToken(env?: any): Promise<string> {
  console.log("=== 开始生成令牌 ===");
  console.log("env 参数:", env ? "已提供" : "未提供");

  // 生成随机部分
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  console.log("生成的随机部分:", randomPart);

  // 添加时间戳
  const timestamp = Date.now().toString(36);
  console.log("时间戳 (Base36):", timestamp, "原始时间戳:", Date.now());

  // 添加特定前缀，用于标识这是一个XUGOU系统的令牌
  const prefix = "xugou";
  console.log("使用前缀:", prefix);

  // 创建基本令牌
  const baseToken = `${prefix}_${timestamp}_${randomPart}`;
  console.log("基本令牌 (无签名):", baseToken);

  // 获取密钥
  if (!env || !env.CF_VERSION_METADATA) {
    console.error("错误: env.CF_VERSION_METADATA 不存在，无法生成签名");
    return baseToken;
  }

  const {
    id: versionId,
    tag: versionTag,
    timestamp: versionTimestamp,
  } = env.CF_VERSION_METADATA;
  console.log("generateToken 使用的 versionId:", versionId);
  console.log("generateToken 版本信息:", {
    tag: versionTag,
    timestamp: versionTimestamp,
  });

  try {
    // 创建签名
    const msgUint8 = new TextEncoder().encode(baseToken + versionId);
    console.log("签名数据长度:", msgUint8.length, "字节");

    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16);
    console.log("生成的签名:", signature);

    // 返回带签名的令牌
    const fullToken = `${baseToken}.${signature}`;
    console.log("完整令牌:", fullToken);
    console.log("=== 令牌生成完成 ===");
    return fullToken;
  } catch (error) {
    console.error("生成令牌签名时出错:", error);
    return baseToken;
  }
}

/**
 * 验证令牌是否有效
 * 验证令牌的格式和签名是否正确
 *
 * @param token 需要验证的令牌
 * @param env 环境变量或上下文对象，用于获取密钥
 * @returns 验证结果对象，包含是否有效和相关信息
 */
export async function verifyToken(
  token: string,
  env: any
): Promise<{
  valid: boolean;
  message?: string;
  timestamp?: number;
  payload?: any;
}> {
  console.log("=== 开始验证令牌 ===");
  console.log("待验证令牌:", token);

  try {
    // 首先验证令牌格式
    const parts = token.split(".");
    console.log("令牌部分数量:", parts.length);

    // 如果令牌没有签名部分（即不包含.），或者格式不正确，则无效
    if (parts.length !== 2) {
      console.log("验证失败: 令牌格式无效 (没有点号分隔符或分隔符数量不正确)");
      return { valid: false, message: "令牌格式无效" };
    }

    // 解析令牌各部分
    const [baseToken, signature] = parts;
    console.log("基本令牌部分:", baseToken);
    console.log("签名部分:", signature);

    const baseTokenParts = baseToken.split("_");
    console.log("基本令牌组件数量:", baseTokenParts.length);

    // 验证基本令牌格式
    if (baseTokenParts.length !== 3) {
      console.log("验证失败: 基本令牌格式无效 (不包含3个由下划线分隔的部分)");
      return { valid: false, message: "令牌格式无效" };
    }

    const [prefix, timestampStr, randomPart] = baseTokenParts;
    console.log("解析出的令牌组件:", { prefix, timestampStr, randomPart });

    // 验证前缀
    if (prefix !== "xugou") {
      console.log(`验证失败: 令牌前缀无效 (期望 'xugou', 实际为 '${prefix}')`);
      return { valid: false, message: "令牌前缀无效" };
    }

    // 解析时间戳
    const timestamp = parseInt(timestampStr, 36);
    console.log(
      "解析的时间戳 (Base36 -> 数字):",
      timestampStr,
      "->",
      timestamp
    );
    console.log("时间戳对应的日期:", new Date(timestamp).toISOString());

    // 验证时间戳是否为有效数字
    if (isNaN(timestamp)) {
      console.log("验证失败: 时间戳无效 (不是有效的Base36数字)");
      return { valid: false, message: "令牌时间戳无效" };
    }

    // 获取密钥
    if (!env || !env.CF_VERSION_METADATA) {
      console.error("错误: env.CF_VERSION_METADATA 不存在，无法验证签名");
      return { valid: false, message: "环境变量不完整，无法验证签名" };
    }

    const {
      id: versionId,
      tag: versionTag,
      timestamp: versionTimestamp,
    } = env.CF_VERSION_METADATA;
    console.log("verifyToken 使用的 versionId:", versionId);
    console.log("verifyToken 版本信息:", {
      tag: versionTag,
      timestamp: versionTimestamp,
    });

    // 重新计算签名并验证
    const msgUint8 = new TextEncoder().encode(baseToken + versionId);
    console.log("验证签名数据长度:", msgUint8.length, "字节");

    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16);
    console.log("计算出的签名:", calculatedSignature);
    console.log("令牌中的签名:", signature);
    console.log("签名是否匹配:", calculatedSignature === signature);

    // 比较计算出的签名和令牌中的签名
    if (calculatedSignature !== signature) {
      console.log("验证失败: 签名不匹配");
      return { valid: false, message: "令牌签名无效" };
    }

    // 如果所有验证都通过，令牌有效
    console.log("验证成功: 令牌有效");
    const result = {
      valid: true,
      timestamp,
      payload: {
        prefix,
        timestamp,
        randomPart,
      },
    };
    console.log("验证结果:", result);
    console.log("=== 令牌验证完成 ===");
    return result;
  } catch (error) {
    console.error("令牌验证过程出错:", error);
    return { valid: false, message: "令牌验证过程出错" };
  }
}
