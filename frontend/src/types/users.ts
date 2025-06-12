/**
 * 用户相关类型定义
 */

export interface User {
  id: number;
  username: string;
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email?: string;
  role?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
