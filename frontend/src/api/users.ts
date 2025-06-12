import api from "./client";
import {
  User,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "../types/users";

// 获取所有用户
export const getAllUsers = async (): Promise<{
  success: boolean;
  message?: string;
  users?: User[];
}> => {
  const response = await api.get("/api/users");
  return response.data;
};

// 获取单个用户
export const getUser = async (id: number): Promise<UserResponse> => {
  const response = await api.get(`/api/users/${id}`);
  return response.data;
};

// 创建用户
export const createUser = async (
  data: CreateUserRequest
): Promise<UserResponse> => {
  const response = await api.post("/api/users", data);
  return response.data;
};

// 更新用户
export const updateUser = async (
  id: number,
  data: UpdateUserRequest
): Promise<UserResponse> => {
  const response = await api.put(`/api/users/${id}`, data);
  return response.data;
};

// 删除用户
export const deleteUser = async (
  id: number
): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};

// 修改密码
export const changePassword = async (
  id: number,
  data: ChangePasswordRequest
): Promise<{ success: boolean; message?: string }> => {
  const response = await api.post(`/api/users/${id}/change-password`, data);
  return response.data;
};
