import { Hono } from "hono";
import { Bindings } from "../models/db";
import { Agent } from "../models/agent";
import {
  getAgents,
  getAgentDetail,
  updateAgentService,
  deleteAgentService,
  generateAgentToken,
  registerAgentService,
  updateAgentStatusService,
  getAgentMetrics,
  getLatestAgentMetrics,
} from "../services/AgentService";

const agents = new Hono<{
  Bindings: Bindings;
  Variables: { agent: Agent; jwtPayload: any };
}>();

// 获取所有客户端
agents.get("/", async (c) => {
  const result = await getAgents();

  return c.json(
    {
      success: result.success,
      agents: result.agents,
      message: result.message,
    },
    result.status as any
  );
});

// 更新客户端信息
agents.put("/:id", async (c) => {
  const agentId = Number(c.req.param("id"));
  const payload = c.get("jwtPayload");
  const updateData = await c.req.json();

  const result = await updateAgentService(c.env.DB, agentId, updateData);

  return c.json(
    {
      success: result.success,
      message: result.message,
      agent: result.agent,
    },
    result.status as any
  );
});

// 删除客户端
agents.delete("/:id", async (c) => {
  try {
    const agentId = Number(c.req.param("id"));

    await deleteAgentService(agentId);

    return c.json(
      {
        success: true,
        message: "客户端已删除",
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 生成客户端Token
agents.post("/token/generate", async (c) => {
  // 生成新令牌
  const newToken = await generateAgentToken(c.env);

  // 可以选择将此token存储在临时表中，或者使用其他方式验证(例如，设置过期时间)
  // 这里为简化操作，只返回令牌

  return c.json({
    success: true,
    message: "已生成客户端注册令牌",
    token: newToken,
  });
});

// 客户端自注册接口
agents.post("/register", async (c) => {
  const { token, name, hostname, ip_addresses, os, version } = await c.req.json();

  const result = await registerAgentService(
    c.env,
    token,
    name || "New Agent",
    hostname,
    ip_addresses,
    os,
    version
  );

  return c.json(
    {
      success: result.success,
      message: result.message,
      agent: result.agent,
    },
    result.status as any
  );
});

// 通过令牌更新客户端状态
agents.post("/status", async (c) => {
  // 获取客户端发送的所有数据并打印日志
  const statusData = await c.req.json();

  console.log("statusData: ", statusData);

  try {
    await updateAgentStatusService(statusData);
    return c.json(
      {
        success: true,
        message: "客户端状态已更新",
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 获取单个客户端的指标
agents.get("/:id/metrics", async (c) => {
  const agentId = Number(c.req.param("id"));
  const result = await getAgentMetrics(agentId);
  return c.json(
    {
      success: true,
      agent: result,
      message: "获取客户端指标成功",
    },
    200
  );
});

// 获取单个客户端的最新指标
agents.get("/:id/metrics/latest", async (c) => {
  const agentId = Number(c.req.param("id"));
  const result = await getLatestAgentMetrics(agentId);
  return c.json(
    {
      success: true,
      agent: result,
      message: "获取客户端最新指标成功",
    },
    200
  );
});

// 获取单个客户端
agents.get("/:id", async (c) => {
  const agentId = Number(c.req.param("id"));

  const result = await getAgentDetail(agentId);

  console.log("result: ", result);

  return c.json(
    {
      success: true,
      agent: result,
    },
    200
  );
});

export { agents };
