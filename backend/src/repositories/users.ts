import { eq, asc, and } from 'drizzle-orm';

import { Bindings } from '../models/db';
import { User } from '../models';
import { db } from '../config';
import { users } from '../db/schema';

// 不含密码的用户信息
type UserWithoutPassword = Omit<User, 'password'>;

/**
 * 用户管理相关的数据库操作
 */

// 获取所有用户（不包括密码）
export async function getAllUsers() {
  return await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(users)
    .orderBy(asc(users.id))
    .then((result: User[]) => result);
}

// 根据ID获取用户（不包括密码）
export async function getUserById(id: number) {
  return await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((result: User[]) => result[0] || null);
}

// 根据ID获取完整用户信息（包括密码）
export async function getFullUserById(id: number) {
  return await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((result: User[]) => result[0] || null);
}

// 根据用户名检查用户是否存在
export async function checkUserExists(username: string) {
  return await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
    .then((result: User[]) => result[0] || null);
}

// 创建新用户
export async function createUser(
  username: string,
  hashedPassword: string,
  email: string | null,
  role: string
) {
  const now = new Date().toISOString();

  await db.insert(users).values({
    username: username,
    password: hashedPassword,
    email: email,
    role: role,
    created_at: now,
    updated_at: now,
  });

  // 由于 D1 不支持 returning()，我们在插入后根据用户名重新查询以获取完整的用户信息
  const newUser = await getUserByUsername(username);
  if (!newUser) {
    throw new Error('创建用户失败：无法找到新创建的用户。');
  }
  return newUser;
}

// 更新用户信息
export async function updateUser(
  id: number,
  updates: {
    username?: string;
    email?: string | null;
    role?: string;
    password?: string;
  }
) {
  const now = new Date().toISOString();

  // Drizzle的set方法会自动忽略undefined的值，所以我们可以安全地传递updates对象
  const updatePayload = {
    ...updates,
    updated_at: now,
  };

  if (Object.keys(updates).length === 0) {
    // 如果没有提供任何要更新的字段，直接返回当前用户信息
    return await getFullUserById(id);
  }

  await db.update(users).set(updatePayload).where(eq(users.id, id));

  // 由于 D1 不支持 returning()，我们在更新后重新查询以获取最新的用户信息
  const updatedUser = await getFullUserById(id);
  if (!updatedUser) {
    throw new Error('更新用户失败：无法找到更新后的用户。');
  }
  return updatedUser;
}

// 更新用户密码
export async function updateUserPassword(id: number, hashedPassword: string) {
  const now = new Date().toISOString();

  await db
    .update(users)
    .set({
      password: hashedPassword,
      updated_at: now,
    })
    .where(eq(users.id, id));

  return { success: true, message: '密码已更新' };
}

// 删除用户
export async function deleteUser(id: number) {
  const result = await db.delete(users).where(eq(users.id, id));

  // 在D1中，删除操作成功但没有返回任何行时，result可能不是我们期望的格式
  // 我们假设如果没有抛出错误，操作就是成功的
  return { success: true, message: '用户已删除' };
}

// 根据用户名获取用户
export async function getUserByUsername(
  username: string
): Promise<User | null> {
  return await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
    .then((result: User[]) => result[0] || null);
}

// 获取管理员用户ID
export async function getAdminUserId() {
  const adminId = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, 'admin'));

  if (!adminId || adminId.length === 0) {
    throw new Error('无法找到管理员用户');
  }

  return adminId[0].id;
}
