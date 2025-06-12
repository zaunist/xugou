import { Hono } from "hono";
import { z } from "zod";
import { Bindings } from "../models/db";
import * as NotificationService from "../services/NotificationService";

const notifications = new Hono<{ Bindings: Bindings }>();

// 获取通知配置
notifications.get("/", async (c) => {
  try {
    const config = await NotificationService.getNotificationConfig();

    return c.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("获取通知配置失败:", error);
    return c.json(
      {
        success: false,
        message: "获取通知配置失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 获取通知渠道列表
notifications.get("/channels", async (c) => {
  try {
    const channels = await NotificationService.getNotificationChannels();

    return c.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error("获取通知渠道失败:", error);
    return c.json(
      {
        success: false,
        message: "获取通知渠道失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 获取单个通知渠道
notifications.get("/channels/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message: "无效的渠道ID",
        },
        400
      );
    }

    const channel = await NotificationService.getNotificationChannelById(id);

    if (!channel) {
      return c.json(
        {
          success: false,
          message: "通知渠道不存在",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error("获取通知渠道失败:", error);
    return c.json(
      {
        success: false,
        message: "获取通知渠道失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 创建通知渠道
notifications.post("/channels", async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get("jwtPayload").id;
    const body = await c.req.json();

    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1, "名称不能为空"),
      type: z.string().min(1, "类型不能为空"),
      config: z.string().min(1, "配置不能为空"),
      enabled: z.boolean().optional(),
    });

    const validatedData = schema.parse(body);

    // 创建渠道
    const result = await NotificationService.createNotificationChannel({
      name: validatedData.name,
      type: validatedData.type,
      config: validatedData.config,
      enabled:
        validatedData.enabled !== undefined ? validatedData.enabled : true,
      created_by: userId,
    });

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.message || "创建通知渠道失败",
        },
        500
      );
    }

    return c.json(
      {
        success: true,
        data: {
          id: result.id,
        },
        message: "通知渠道创建成功",
      },
      201
    );
  } catch (error) {
    console.error("创建通知渠道失败:", error);
    return c.json(
      {
        success: false,
        message: "创建通知渠道失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 更新通知渠道
notifications.put("/channels/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message: "无效的渠道ID",
        },
        400
      );
    }

    const body = await c.req.json();

    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1, "名称不能为空").optional(),
      type: z.string().min(1, "类型不能为空").optional(),
      config: z.string().min(1, "配置不能为空").optional(),
      enabled: z.boolean().optional(),
    });

    const validatedData = schema.parse(body);

    // 更新渠道
    const result = await NotificationService.updateNotificationChannel(
      id,
      validatedData
    );

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.message || "更新通知渠道失败",
        },
        result.message?.includes("不存在") ? 404 : 500
      );
    }

    return c.json({
      success: true,
      message: result.message || "通知渠道更新成功",
    });
  } catch (error) {
    console.error("更新通知渠道失败:", error);
    return c.json(
      {
        success: false,
        message: "更新通知渠道失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 删除通知渠道
notifications.delete("/channels/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message: "无效的渠道ID",
        },
        400
      );
    }

    const result = await NotificationService.deleteNotificationChannel(id);

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.message || "删除通知渠道失败",
        },
        result.message?.includes("不存在") ? 404 : 500
      );
    }

    return c.json({
      success: true,
      message: result.message || "通知渠道删除成功",
    });
  } catch (error) {
    console.error("删除通知渠道失败:", error);
    return c.json(
      {
        success: false,
        message: "删除通知渠道失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 获取通知模板列表
notifications.get("/templates", async (c) => {
  try {
    const templates = await NotificationService.getNotificationTemplates();

    return c.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("获取通知模板失败:", error);
    return c.json(
      {
        success: false,
        message: "获取通知模板失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 获取单个通知模板
notifications.get("/templates/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message: "无效的模板ID",
        },
        400
      );
    }

    const template = await NotificationService.getNotificationTemplateById(id);

    if (!template) {
      return c.json(
        {
          success: false,
          message: "通知模板不存在",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("获取通知模板失败:", error);
    return c.json(
      {
        success: false,
        message: "获取通知模板失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 创建通知模板
notifications.post("/templates", async (c) => {
  try {
    const userId = c.get("jwtPayload").id;
    const body = await c.req.json();

    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1, "名称不能为空"),
      type: z.string().min(1, "类型不能为空"),
      subject: z.string().min(1, "主题不能为空"),
      content: z.string().min(1, "内容不能为空"),
      is_default: z.boolean().optional(),
    });

    const validatedData = schema.parse(body);

    // 创建模板
    const result = await NotificationService.createNotificationTemplate({
      name: validatedData.name,
      type: validatedData.type,
      subject: validatedData.subject,
      content: validatedData.content,
      is_default:
        validatedData.is_default !== undefined
          ? validatedData.is_default
          : false,
      created_by: userId,
    });

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.message || "创建通知模板失败",
        },
        500
      );
    }

    return c.json(
      {
        success: true,
        data: {
          id: result.id,
        },
        message: "通知模板创建成功",
      },
      201
    );
  } catch (error) {
    console.error("创建通知模板失败:", error);
    return c.json(
      {
        success: false,
        message: "创建通知模板失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 更新通知模板
notifications.put("/templates/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message: "无效的模板ID",
        },
        400
      );
    }

    const body = await c.req.json();

    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1, "名称不能为空").optional(),
      type: z.string().min(1, "类型不能为空").optional(),
      subject: z.string().min(1, "主题不能为空").optional(),
      content: z.string().min(1, "内容不能为空").optional(),
      is_default: z.boolean().optional(),
    });

    const validatedData = schema.parse(body);

    // 更新模板
    const result = await NotificationService.updateNotificationTemplate(
      id,
      validatedData
    );

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.message || "更新通知模板失败",
        },
        result.message?.includes("不存在") ? 404 : 500
      );
    }

    return c.json({
      success: true,
      message: result.message || "通知模板更新成功",
    });
  } catch (error) {
    console.error("更新通知模板失败:", error);
    return c.json(
      {
        success: false,
        message: "更新通知模板失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 删除通知模板
notifications.delete("/templates/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message: "无效的模板ID",
        },
        400
      );
    }

    const result = await NotificationService.deleteNotificationTemplate(id);

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.message || "删除通知模板失败",
        },
        result.message?.includes("不存在") ? 404 : 500
      );
    }

    return c.json({
      success: true,
      message: result.message || "通知模板删除成功",
    });
  } catch (error) {
    console.error("删除通知模板失败:", error);
    return c.json(
      {
        success: false,
        message: "删除通知模板失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 保存通知设置
notifications.post("/settings", async (c) => {
  try {
    const userId = c.get("jwtPayload").id;
    const body = await c.req.json();

    const schema = z.object({
      target_type: z.string(),
      target_id: z.number().nullable().optional(),
      enabled: z.boolean(),
      on_down: z.boolean().optional(),
      on_recovery: z.boolean().optional(),
      on_offline: z.boolean().optional(),
      on_cpu_threshold: z.boolean().optional(),
      cpu_threshold: z.number().optional(),
      on_memory_threshold: z.boolean().optional(),
      memory_threshold: z.number().optional(),
      on_disk_threshold: z.boolean().optional(),
      disk_threshold: z.number().optional(),
      channels: z.array(z.number()).or(z.string()),
    });

    const validatedData = schema.parse(body);

    // 转换 channels 到 JSON 字符串
    const channelsStr =
      typeof validatedData.channels === "string"
        ? validatedData.channels
        : JSON.stringify(validatedData.channels);

    // 保存设置
    const result = await NotificationService.createOrUpdateSettings({
      user_id: userId,
      target_type: validatedData.target_type,
      target_id: validatedData.target_id || 0,
      enabled: validatedData.enabled,
      on_down: validatedData.on_down || false,
      on_recovery: validatedData.on_recovery || false,
      on_offline: validatedData.on_offline || false,
      on_cpu_threshold: validatedData.on_cpu_threshold || false,
      cpu_threshold: validatedData.cpu_threshold || 90,
      on_memory_threshold: validatedData.on_memory_threshold || false,
      memory_threshold: validatedData.memory_threshold || 90,
      on_disk_threshold: validatedData.on_disk_threshold || false,
      disk_threshold: validatedData.disk_threshold || 90,
      channels: channelsStr,
    });

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.message || "保存通知设置失败",
        },
        500
      );
    }

    return c.json({
      success: true,
      message: "通知设置保存成功",
      data: { id: result.id },
    });
  } catch (error) {
    console.error("保存通知设置失败:", error);
    return c.json(
      {
        success: false,
        message: "保存通知设置失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

// 获取通知历史记录
notifications.get("/history", async (c) => {
  try {
    const type = c.req.query("type") || "";
    const target_id = c.req.query("target_id")
      ? parseInt(c.req.query("target_id")!)
      : undefined;
    const status = c.req.query("status") || "";
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 10;
    const page = c.req.query("page") ? parseInt(c.req.query("page")!) : 1;
    const offset = (page - 1) * limit;

    const result = await NotificationService.getNotificationHistory({
      type,
      targetId: target_id,
      status,
      limit,
      offset,
    });

    return c.json({
      success: true,
      data: {
        total: result.total,
        records: result.records,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("获取通知历史记录失败:", error);
    return c.json(
      {
        success: false,
        message: "获取通知历史记录失败",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export { notifications };
