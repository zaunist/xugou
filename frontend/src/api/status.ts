import api from "./client";
import {
  StatusPageConfig,
  StatusPageConfigResponse,
  StatusPageData,
} from "../types/status";

// 获取状态页配置
export const getStatusPageConfig =
  async (): Promise<StatusPageConfigResponse> => {
    const response = await api.get<StatusPageConfigResponse>(
      "/api/status/config"
    );
    return response.data;
  };

// 保存状态页配置
export const saveStatusPageConfig = async (
  config: StatusPageConfig
): Promise<StatusPageConfigResponse> => {
  const response = await api.post<StatusPageConfigResponse>(
    "/api/status/config",
    config
  );
  return response.data;
};

// 获取状态页数据
export const getStatusPageData = async (): Promise<StatusPageData> => {
  const response = await api.get<StatusPageData>("/api/status/data");
  return response.data;
};
