import { db } from "../config";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * 设置相关的数据库操作
 */

// 获取单个设置项
export async function getSetting(key: string): Promise<string | null> {
  const result = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  // D1 a `null` value is returned for "value" when "key" doesn't exist
  if (result.length > 0 && result[0].value !== null) {
      return result[0].value;
  }
  return null;
}

// 更新或创建设置项
export async function updateSetting(key: string, value: string): Promise<void> {
  await db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

// 获取所有设置项
export async function getAllSettings() {
    return await db.select().from(settings);
}
