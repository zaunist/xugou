import { eq, asc, and } from "drizzle-orm";

import { Bindings } from "../models/db";
import { User } from "../models";
import { db } from "../config";
import { users } from "../db/schema";

// 不含密码的用户信息
type UserWithoutPassword = Omit<User, "password">;

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

  const result = await db
    .insert(users)
    .values({
      username: username,
      password: hashedPassword,
      email: email,
      role: role,
      created_at: now,
      updated_at: now,
    })
    .returning();

  if (!result.success) {
    throw new Error("创建用户失败");
  }

  return result[0];
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

  // 准备更新数据
  const fieldsToUpdate = [];
  const values = [];

  if (updates.username !== undefined) {
    fieldsToUpdate.push("username = ?");
    values.push(updates.username);
  }

  if (updates.email !== undefined) {
    fieldsToUpdate.push("email = ?");
    values.push(updates.email);
  }

  if (updates.role !== undefined) {
    fieldsToUpdate.push("role = ?");
    values.push(updates.role);
  }

  if (updates.password !== undefined) {
    fieldsToUpdate.push("password = ?");
    values.push(updates.password);
  }

  fieldsToUpdate.push("updated_at = ?");
  values.push(now);

  // 添加ID作为条件
  values.push(id);

  // 如果没有要更新的字段，返回错误
  if (fieldsToUpdate.length <= 1) {
    throw new Error("没有提供要更新的字段");
  }

  // 执行更新
  const result = await db
    .update(users)
    .set({
      username: updates.username,
      email: updates.email,
      role: updates.role,
      password: updates.password,
      updated_at: now,
    })
    .where(eq(users.id, id))
    .returning();

  if (!result.success) {
    throw new Error("更新用户失败");
  }

  return result[0];
}

// 更新用户密码
export async function updateUserPassword(id: number, hashedPassword: string) {
  const now = new Date().toISOString();

  const result = await db
    .update(users)
    .set({
      password: hashedPassword,
      updated_at: now,
    })
    .where(eq(users.id, id))
    .returning();

  if (!result) {
    throw new Error("更新密码失败");
  }

  return { success: true, message: "密码已更新" };
}

// 删除用户
export async function deleteUser(id: number) {
  const result = await db.delete(users).where(eq(users.id, id)).returning();

  if (!result.success) {
    throw new Error("删除用户失败");
  }

  return { success: true, message: "用户已删除" };
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
    .where(eq(users.username, "admin"));

  if (!adminId) {
    throw new Error("无法找到管理员用户");
  }

  return adminId[0].id;
}
