import api from "./client";
import { Monitor, Agent } from "../types";

// 获取仪表盘数据
export const getDashboardData = async (): Promise<{
  monitors: Monitor[];
  agents: Agent[];
}> => {
  const response = await api.get("/api/dashboard");
  return response.data;
};
