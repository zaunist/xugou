import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { z } from 'zod';
import { Bindings } from '../models/db';
import { getJwtSecret } from '../utils/jwt';
import { 
  getNotificationChannels, 
  getNotificationChannelById,
  createNotificationChannel, 
  updateNotificationChannel,
  deleteNotificationChannel,
  getNotificationTemplates,
  getNotificationTemplateById,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  getNotificationConfig,
  createOrUpdateSettings,
  getNotificationHistory
} from '../db/notification';
import { Context, Next } from 'hono';
import { validateEmailSMTP } from '../utils/notification';

const notifications = new Hono<{ Bindings: Bindings }>();

// 获取通知配置
notifications.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get('jwtPayload').id;
    
    const config = await getNotificationConfig(db, userId);
    
    return c.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('获取通知配置失败:', error);
    return c.json({
      success: false,
      message: '获取通知配置失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取通知渠道列表
notifications.get('/channels', async (c) => {
  try {
    const db = c.env.DB;
    const channels = await getNotificationChannels(db);
    
    return c.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('获取通知渠道失败:', error);
    return c.json({
      success: false,
      message: '获取通知渠道失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取单个通知渠道
notifications.get('/channels/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: '无效的渠道ID'
      }, 400);
    }
    
    const channel = await getNotificationChannelById(db, id);
    
    if (!channel) {
      return c.json({
        success: false,
        message: '通知渠道不存在'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: channel
    });
  } catch (error) {
    console.error('获取通知渠道失败:', error);
    return c.json({
      success: false,
      message: '获取通知渠道失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 创建通知渠道
notifications.post('/channels', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get('jwtPayload').id;
    const body = await c.req.json();
    
    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1, '名称不能为空'),
      type: z.string().min(1, '类型不能为空'),
      config: z.string().min(1, '配置不能为空'),
      enabled: z.boolean().optional()
    });
    
    const validatedData = schema.parse(body);
    
    // 插入数据
    const id = await createNotificationChannel(db, {
      name: validatedData.name,
      type: validatedData.type,
      config: validatedData.config,
      enabled: validatedData.enabled !== undefined ? validatedData.enabled : true,
      created_by: userId
    });
    
    return c.json({
      success: true,
      data: {
        id
      },
      message: '通知渠道创建成功'
    }, 201);
  } catch (error) {
    console.error('创建通知渠道失败:', error);
    return c.json({
      success: false,
      message: '创建通知渠道失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 更新通知渠道
notifications.put('/channels/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: '无效的渠道ID'
      }, 400);
    }
    
    const body = await c.req.json();
    
    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1, '名称不能为空').optional(),
      type: z.string().min(1, '类型不能为空').optional(),
      config: z.string().min(1, '配置不能为空').optional(),
      enabled: z.boolean().optional()
    });
    
    const validatedData = schema.parse(body);
    
    // 更新数据
    const success = await updateNotificationChannel(db, id, validatedData);
    
    if (!success) {
      return c.json({
        success: false,
        message: '通知渠道不存在或未做任何更改'
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '通知渠道更新成功'
    });
  } catch (error) {
    console.error('更新通知渠道失败:', error);
    return c.json({
      success: false,
      message: '更新通知渠道失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 删除通知渠道
notifications.delete('/channels/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: '无效的渠道ID'
      }, 400);
    }
    
    try {
      const success = await deleteNotificationChannel(db, id);
      
      if (!success) {
        return c.json({
          success: false,
          message: '通知渠道不存在'
        }, 404);
      }
      
      return c.json({
        success: true,
        message: '通知渠道删除成功'
      });
    } catch (dbError) {
      console.error('删除通知渠道数据库操作失败:', dbError);
      return c.json({
        success: false,
        message: '删除通知渠道失败，可能存在关联数据',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, 500);
    }
  } catch (error) {
    console.error('删除通知渠道失败:', error);
    return c.json({
      success: false,
      message: '删除通知渠道失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取通知模板列表
notifications.get('/templates', async (c) => {
  try {
    const db = c.env.DB;
    const templates = await getNotificationTemplates(db);
    
    return c.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('获取通知模板失败:', error);
    return c.json({
      success: false,
      message: '获取通知模板失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取单个通知模板
notifications.get('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: '无效的模板ID'
      }, 400);
    }
    
    const template = await getNotificationTemplateById(db, id);
    
    if (!template) {
      return c.json({
        success: false,
        message: '通知模板不存在'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('获取通知模板失败:', error);
    return c.json({
      success: false,
      message: '获取通知模板失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 创建通知模板
notifications.post('/templates', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get('jwtPayload').id;
    const body = await c.req.json();
    
    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1, '名称不能为空'),
      type: z.string().min(1, '类型不能为空'),
      subject: z.string().min(1, '主题不能为空'),
      content: z.string().min(1, '内容不能为空'),
      is_default: z.boolean().optional()
    });
    
    const validatedData = schema.parse(body);
    
    // 插入数据
    const id = await createNotificationTemplate(db, {
      name: validatedData.name,
      type: validatedData.type,
      subject: validatedData.subject,
      content: validatedData.content,
      is_default: validatedData.is_default || false,
      created_by: userId
    });
    
    return c.json({
      success: true,
      data: {
        id
      },
      message: '通知模板创建成功'
    }, 201);
  } catch (error) {
    console.error('创建通知模板失败:', error);
    return c.json({
      success: false,
      message: '创建通知模板失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 更新通知模板
notifications.put('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: '无效的模板ID'
      }, 400);
    }
    
    const body = await c.req.json();
    
    // 验证请求数据
    const schema = z.object({
      name: z.string().min(1, '名称不能为空').optional(),
      type: z.string().min(1, '类型不能为空').optional(),
      subject: z.string().min(1, '主题不能为空').optional(),
      content: z.string().min(1, '内容不能为空').optional(),
      is_default: z.boolean().optional()
    });
    
    const validatedData = schema.parse(body);
    
    // 更新数据
    const success = await updateNotificationTemplate(db, id, validatedData);
    
    if (!success) {
      return c.json({
        success: false,
        message: '通知模板不存在或未做任何更改'
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '通知模板更新成功'
    });
  } catch (error) {
    console.error('更新通知模板失败:', error);
    return c.json({
      success: false,
      message: '更新通知模板失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 删除通知模板
notifications.delete('/templates/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: '无效的模板ID'
      }, 400);
    }
    
    const success = await deleteNotificationTemplate(db, id);
    
    if (!success) {
      return c.json({
        success: false,
        message: '通知模板不存在'
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '通知模板删除成功'
    });
  } catch (error) {
    console.error('删除通知模板失败:', error);
    return c.json({
      success: false,
      message: '删除通知模板失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 更新通知设置
notifications.post('/settings', async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get('jwtPayload').id;
    const body = await c.req.json();
    
    // 验证请求数据
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
      channels: z.string(),
      override_global: z.boolean().optional()
    });
    
    const validatedData = schema.parse(body);
    
    // 创建完整的设置对象，包含所有必需字段的默认值
    const settingsData = {
      user_id: userId,
      target_type: validatedData.target_type,
      target_id: validatedData.target_id === undefined ? null : validatedData.target_id,
      enabled: validatedData.enabled,
      
      // 所有字段都设置默认值，后面会根据target_type重新赋值
      on_down: false,
      on_recovery: false,
      
      on_offline: false,
      on_cpu_threshold: false,
      cpu_threshold: 90,
      on_memory_threshold: false,
      memory_threshold: 85,
      on_disk_threshold: false,
      disk_threshold: 90,
      
      channels: validatedData.channels,
      override_global: validatedData.override_global || false
    };
    
    // 根据目标类型更新特定字段
    if (validatedData.target_type.includes('monitor') || validatedData.target_type === 'monitor') {
      settingsData.on_down = validatedData.on_down || false;
      settingsData.on_recovery = validatedData.on_recovery || false;
    }
    
    if (validatedData.target_type.includes('agent') || validatedData.target_type === 'agent') {
      settingsData.on_offline = validatedData.on_offline || false;
      settingsData.on_recovery = validatedData.on_recovery || false;
      settingsData.on_cpu_threshold = validatedData.on_cpu_threshold || false;
      settingsData.cpu_threshold = validatedData.cpu_threshold || 90;
      settingsData.on_memory_threshold = validatedData.on_memory_threshold || false;
      settingsData.memory_threshold = validatedData.memory_threshold || 85;
      settingsData.on_disk_threshold = validatedData.on_disk_threshold || false;
      settingsData.disk_threshold = validatedData.disk_threshold || 90;
    }
    
    const id = await createOrUpdateSettings(db, settingsData);
    
    return c.json({
      success: true,
      data: {
        id
      },
      message: '通知设置保存成功'
    });
  } catch (error) {
    console.error('保存通知设置失败:', error);
    return c.json({
      success: false,
      message: '保存通知设置失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取通知历史记录
notifications.get('/history', async (c) => {
  try {
    const db = c.env.DB;
    
    // 获取查询参数
    const type = c.req.query('type') || undefined;
    const targetIdStr = c.req.query('targetId');
    const targetId = targetIdStr ? parseInt(targetIdStr) : undefined;
    const status = c.req.query('status') || undefined;
    const limitStr = c.req.query('limit');
    const limit = limitStr ? parseInt(limitStr) : 20;
    const offsetStr = c.req.query('offset');
    const offset = offsetStr ? parseInt(offsetStr) : 0;
    
    const history = await getNotificationHistory(db, {
      type,
      targetId,
      status,
      limit,
      offset
    });
    
    return c.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取通知历史记录失败:', error);
    return c.json({
      success: false,
      message: '获取通知历史记录失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 验证电子邮件配置
notifications.post('/verify-email', async (c) => {
  try {
    const body = await c.req.json();
    
    // 验证请求数据
    const schema = z.object({
      smtpServer: z.string().min(1, 'SMTP服务器不能为空'),
      smtpPort: z.string().min(1, '端口不能为空'),
      smtpUsername: z.string().min(1, '用户名不能为空'),
      smtpPassword: z.string().min(1, '密码不能为空'),
      useSSL: z.boolean().optional(),
      sendTestEmail: z.boolean().optional(),
      testRecipient: z.string().optional()
    });
    
    const validatedData = schema.parse(body);
    
    // 验证SMTP配置
    const isValid = await validateEmailSMTP(
      validatedData.smtpServer,
      validatedData.smtpPort,
      validatedData.smtpUsername,
      validatedData.smtpPassword,
      validatedData.useSSL || false
    );
    
    // 如果SMTP配置有效并且请求发送测试邮件
    if (isValid && validatedData.sendTestEmail && validatedData.testRecipient) {
      // 创建临时通知渠道配置
      const tempChannel = {
        id: 'temp-test-email',
        name: 'Test Email',
        type: 'email',
        config: {
          smtpServer: validatedData.smtpServer,
          smtpPort: validatedData.smtpPort,
          smtpUsername: validatedData.smtpUsername,
          smtpPassword: validatedData.smtpPassword,
          senderEmail: validatedData.smtpUsername,
          receipts: validatedData.testRecipient,
          useSSL: validatedData.useSSL || false
        },
        enabled: true
      };
      
      // 发送测试邮件
      console.log(`[验证邮箱] 发送测试邮件到: ${validatedData.testRecipient}`);
      
      try {
        // 导入sendTestEmail函数
        const { sendTestEmail } = await import('../utils/notification');
        
        // 发送测试通知
        const result = await sendTestEmail(
          tempChannel, 
          'SMTP测试邮件', 
          '这是一封测试邮件，用于验证SMTP配置是否正确。\n\n' +
          '如果您收到此邮件，说明您的SMTP配置工作正常！\n\n' +
          `配置信息:\n` +
          `- SMTP服务器: ${validatedData.smtpServer}\n` +
          `- 端口: ${validatedData.smtpPort}\n` +
          `- 用户名: ${validatedData.smtpUsername}\n` +
          `- SSL: ${validatedData.useSSL ? '启用' : '禁用'}\n\n` +
          '发送时间: ' + new Date().toLocaleString()
        );
        
        if (result.success) {
          console.log('[验证邮箱] 测试邮件发送成功');
          return c.json({
            success: true,
            message: '电子邮件配置验证成功，测试邮件已发送'
          });
        } else {
          console.error('[验证邮箱] 测试邮件发送失败:', result.error);
          return c.json({
            success: false,
            message: `电子邮件配置验证失败：${result.error || '无法发送测试邮件'}`
          });
        }
      } catch (emailError) {
        console.error('[验证邮箱] 测试邮件发送过程出错:', emailError);
        return c.json({
          success: false,
          message: `电子邮件配置验证成功，但测试邮件发送失败: ${emailError instanceof Error ? emailError.message : String(emailError)}`
        });
      }
    }
    
    return c.json({
      success: isValid,
      message: isValid ? '电子邮件配置验证成功' : '电子邮件配置验证失败，请检查设置'
    });
  } catch (error) {
    console.error('验证电子邮件配置失败:', error);
    return c.json({
      success: false,
      message: '验证电子邮件配置失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

const jwtMiddleware = (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const jwtSecret = getJwtSecret(c.env.JWT_SECRET);
  return jwt({ secret: jwtSecret })(c, next);
};

// 应用JWT中间件到所有路由
export const notificationsWithAuth = new Hono<{ Bindings: Bindings }>();
notificationsWithAuth.use('*', jwtMiddleware);
notificationsWithAuth.route('/', notifications);

export default notificationsWithAuth; 