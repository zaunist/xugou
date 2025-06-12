import api from "./client";
import {
  Agent,
  AgentResponse,
  AgentsResponse,
  MetricHistory,
} from "../types/agents";

export const generateToken = async (): Promise<{
  success: boolean;
  token?: string;
  message?: string;
}> => {
  try {
    const response = await api.post("/api/agents/token/generate");
    return response.data;
  } catch (error) {
    console.error("生成客户端注册令牌失败:", error);
    return {
      success: false,
      message: "生成客户端注册令牌失败",
    };
  }
};

export const getAllAgents = async (): Promise<AgentsResponse> => {
  const response = await api.get("/api/agents");
  return {
    success: true,
    agents: response.data.agents,
  };
};

export const getAgent = async (id: number): Promise<AgentResponse> => {
  const response = await api.get(`/api/agents/${id}`);
  return {
    success: true,
    agent: response.data.agent,
  };
};

export const deleteAgent = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete(`/api/agents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`删除客户端 ${id} 失败:`, error);
    return {
      success: false,
      message: "删除客户端失败",
    };
  }
};

export const updateAgent = async (
  id: number,
  data: Partial<Agent>
): Promise<AgentResponse> => {
  try {
    const response = await api.put(`/api/agents/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`更新客户端 ${id} 失败:`, error);
    return {
      success: false,
    };
  }
};

export const getAgentMetrics = async (
  id: number
): Promise<{
  success: boolean;
  agent?: MetricHistory[];
  message?: string;
}> => {
  try {
    const response = await api.get(`/api/agents/${id}/metrics`);
    return response.data;
  } catch (error) {
    console.error(`获取客户端 ${id} 的指标失败:`, error);
    return {
      success: false,
      message: "获取客户端指标失败",
    };
  }
};

export const getLatestAgentMetrics = async (
  id: number
): Promise<{
  success: boolean;
  agent?: MetricHistory;
  message?: string;
}> => {
  const response = await api.get(`/api/agents/${id}/metrics/latest`);
  return response.data;
};
