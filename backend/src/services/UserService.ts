import { compare, hash } from "bcryptjs";
import * as repositories from "../repositories";
import { error } from "console";

export async function getAllUsersService(userRole: string) {
  try {
    // 检查权限
    if (userRole !== "admin") {
      return { success: false, message: "无权访问用户列表", status: 403 };
    }

    // 查询所有用户，不包括密码
    const result = await repositories.getAllUsers();

    return { success: true, users: result, status: 200 };
  } catch (error) {
    console.error("获取用户列表错误:", error);
    return { success: false, message: "获取用户列表失败", status: 500 };
  }
}

export async function getUserByIdService(
  id: number,
  currentUserId: number,
  userRole: string
) {
  try {
    // 检查权限（仅允许管理员或用户本人）
    if (userRole !== "admin" && currentUserId !== id) {
      return { success: false, message: "无权访问此用户信息", status: 403 };
    }

    // 查询用户，不包括密码
    const user = await repositories.getUserById(id);

    if (!user) {
      return { success: false, message: "用户不存在", status: 404 };
    }

    return { success: true, user, status: 200 };
  } catch (error) {
    console.error("获取用户详情错误:", error);
    return { success: false, message: "获取用户详情失败", status: 500 };
  }
}

export async function createUserService(
  userData: {
    username: string;
    password: string;
    email?: string;
    role: string;
  },
  userRole: string
) {
  try {
    // 检查权限
    if (userRole !== "admin") {
      return { success: false, message: "无权创建用户", status: 403 };
    }

    // 验证必填字段
    if (!userData.username || !userData.password || !userData.role) {
      return { success: false, message: "缺少必填字段", status: 400 };
    }

    // 检查用户名是否已存在
    const existingUser = await repositories.checkUserExists(userData.username);

    if (existingUser) {
      return { success: false, message: "用户名已存在", status: 400 };
    }

    // 检查角色是否有效
    const validRoles = ["admin", "manager", "viewer"];
    if (!validRoles.includes(userData.role)) {
      return { success: false, message: "无效的角色", status: 400 };
    }

    // 哈希密码
    const hashedPassword = await hash(userData.password, 10);

    // 插入新用户
    const newUser = await repositories.createUser(
      userData.username,
      hashedPassword,
      userData.email || null,
      userData.role
    );

    return { success: true, user: newUser, status: 201 };
  } catch (error) {
    console.error("创建用户错误:", error);
    return { success: false, message: "创建用户失败", status: 500 };
  }
}

export async function updateUserService(
  id: number,
  updateData: {
    username?: string;
    email?: string | null;
    role?: string;
    password?: string;
  },
  currentUserId: number,
  userRole: string
) {
  try {
    // 检查权限（仅允许管理员或用户本人）
    if (userRole !== "admin" && currentUserId !== id) {
      return { success: false, message: "无权修改此用户信息", status: 403 };
    }

    // 检查用户是否存在
    const user = await repositories.getFullUserById(id);

    if (!user) {
      return { success: false, message: "用户不存在", status: 404 };
    }

    // 非管理员不能修改角色
    if (
      userRole !== "admin" &&
      updateData.role &&
      updateData.role !== user.role
    ) {
      return { success: false, message: "无权修改用户角色", status: 403 };
    }

    // 准备更新数据
    const updates: any = {};

    if (
      updateData.username !== undefined &&
      updateData.username !== user.username
    ) {
      // 检查新用户名是否已存在
      const existingUser = await repositories.checkUserExists(
        updateData.username
      );

      if (existingUser) {
        return { success: false, message: "用户名已存在", status: 400 };
      }

      updates.username = updateData.username;
    }

    if (updateData.email !== undefined) {
      updates.email = updateData.email;
    }

    if (updateData.role !== undefined) {
      updates.role = updateData.role;
    }

    // 如果提供了新密码，则更新密码
    if (updateData.password) {
      updates.password = await hash(updateData.password, 10);
    }

    // 执行更新
    try {
      const updatedUser = await repositories.updateUser(id, updates);
      return { success: true, user: updatedUser, status: 200 };
    } catch (err) {
      if (err instanceof Error && err.message === "没有提供要更新的字段") {
        return { success: false, message: "没有提供要更新的字段", status: 400 };
      }
      throw err;
    }
  } catch (error) {
    console.error("更新用户错误:", error);
    return { success: false, message: "更新用户失败", status: 500 };
  }
}

export async function deleteUserService(
  id: number,
  currentUserId: number,
  userRole: string
) {
  try {
    // 检查权限
    if (userRole !== "admin") {
      return { success: false, message: "无权删除用户", status: 403 };
    }

    // 防止删除自己
    if (currentUserId === id) {
      return { success: false, message: "不能删除当前登录的用户", status: 400 };
    }

    // 检查用户是否存在
    const user = await repositories.getUserById(id);

    if (!user) {
      return { success: false, message: "用户不存在", status: 404 };
    }

    // 执行删除
    await repositories.deleteUser(id);

    return { success: true, message: "用户已删除", status: 200 };
  } catch (error) {
    console.error("删除用户错误:", error);
    return { success: false, message: "删除用户失败", status: 500 };
  }
}

export async function changePasswordService(
  id: number,
  passwordData: {
    currentPassword?: string;
    newPassword: string;
  }
) {
  try {
    if (!passwordData.newPassword) {
      throw error("new password is required");
    }

    // 获取用户
    const user = await repositories.getFullUserById(id);

    if (!user) {
      throw error("user not found");
    }

    // 非管理员需要验证当前密码
    if (passwordData.currentPassword) {
      const isPasswordValid = await compare(
        passwordData.currentPassword,
        user.password
      );
      if (!isPasswordValid) {
       throw error("current password is invalid");
      }
    }

    // 哈希新密码
    const hashedPassword = await hash(passwordData.newPassword, 10);

    // 更新密码
    await repositories.updateUserPassword(id, hashedPassword);

    return { success: true, message: "密码已更新", status: 200 };
  } catch (error) {
    console.error("修改密码错误:", error);
    return { success: false, message: error, status: 500 };
  }
}
