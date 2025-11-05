import * as repositories from '../repositories';

/**
 * 获取是否允许新用户注册的设置
 * @returns boolean
 */
export async function getAllowNewUserRegistration() {
  const value = await repositories.getSetting('allow_new_user_registration');
  // 如果数据库中没有该设置，默认为 false
  return value === 'true';
}

/**
 * 更新是否允许新用户注册的设置
 * @param allowed boolean
 * @returns result object
 */
export async function updateAllowNewUserRegistration(allowed: boolean) {
  await repositories.updateSetting(
    'allow_new_user_registration',
    allowed ? 'true' : 'false'
  );
  return { success: true, message: '设置已更新' };
}

/**
 * 获取所有设置
 * @returns result object with all settings
 */
export async function getAllSettings() {
  const allSettings = await repositories.getAllSettings();
  // 将设置数组转换为键值对对象
  // 修复：为 reduce 回调函数中的参数 acc 和 setting 添加显式类型
  const settingsObj = allSettings.reduce(
    (
      acc: Record<string, string | null>,
      setting: { key: string; value: string | null }
    ) => {
      if (setting.key) {
        acc[setting.key] = setting.value;
      }
      return acc;
    },
    {}
  );
  return { success: true, settings: settingsObj };
}
