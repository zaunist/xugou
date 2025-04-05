import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { Bindings } from './models/db';
import { prettyJSON } from 'hono/pretty-json';
import { checkAndInitializeDatabase } from './setup/initCheck';
import { ExecutionContext } from 'hono';

// 添加全局变量声明
declare global {
  var isInitialized: boolean;
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      PORT?: string;
      JWT_SECRET?: string;
    }
  }
}

// 定义 D1 数据库类型
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = unknown>(query: string): Promise<D1Result<T>>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: object;
}

// 导入路由
import authRoutes from './routes/auth';
import monitorRoutes from './routes/monitors';
import agentRoutes from './routes/agents';
import userRoutes from './routes/users';
import statusRoutes from './routes/status';
import initDbRoutes from './setup/database';
import { monitorTask, runScheduledTasks } from './tasks';
import { notifications } from './routes/notifications';

// 创建Hono应用
const app = new Hono<{ Bindings: Bindings }>();

// 中间件，需要作为服务端接收所有来源客户端的请求
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  credentials: true,
}));
app.use('*', prettyJSON());

// 在 Workers 环境中，您可能需要设置这些响应头
app.use('*', async (c, next) => {
  await next();
  c.header('Access-Control-Allow-Origin', c.req.header('origin') || '*');
  c.header('Access-Control-Allow-Credentials', 'true');
});

// 公共路由
app.get('/', (c) => c.json({ message: 'XUGOU API 服务正在运行' }));

// 获取 JWT 密钥
const getJwtSecret = (c: any) => {
  // 在 Cloudflare Workers 环境中，使用 env 变量
  if (typeof process === 'undefined') {
    return c.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }
  // 在 Node.js 环境中，使用 process.env
  return process.env.JWT_SECRET || 'your-secret-key-change-in-production';
};

// 路由注册
app.route('/api/auth', authRoutes);
app.route('/api/monitors', monitorRoutes);
app.route('/api/agents', agentRoutes);
app.route('/api/users', userRoutes);
app.route('/api/status', statusRoutes);
app.route('/api', initDbRoutes);
app.route('/api/notifications', notifications);

// 添加监控检查触发路由
app.get('/api/trigger-check', async (c) => {
  const { scheduled } = monitorTask;
  if (scheduled) {
    await scheduled(null, c.env, null);
  }
  return c.json({ success: true, message: '监控检查已触发' });
});

// 数据库状态标志，用于记录数据库初始化状态
let dbInitialized = false;

// 导出 fetch 函数供 Cloudflare Workers 使用
export default {
  // 处理 HTTP 请求
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    // 静态初始化标志
    if (!globalThis.isInitialized) {
      console.log('第一次请求，初始化应用...');
      
      // 设置初始化标志
      globalThis.isInitialized = true;
    }

    try {
      // 如果数据库尚未初始化，则进行初始化检查
      if (!dbInitialized) {
        console.log('首次请求，检查数据库状态...');
        try {
          const initResult = await checkAndInitializeDatabase(env);
          dbInitialized = true;
          console.log('数据库检查结果:', initResult.message);
        } catch (error) {
          console.error('数据库初始化检查失败:', error);
          // 即使初始化失败，也设置标志位以避免重复检查
          dbInitialized = true;
        }
      }
      
      // 处理请求
      return app.fetch(request, env, ctx);
    } catch (error) {
      console.error('请求处理错误:', error);
      return new Response(JSON.stringify({ error: '服务器内部错误' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
  
  // 添加定时任务，每分钟执行一次监控检查和客户端状态检查
  async scheduled(event: any, env: any, ctx: any) {
    try {
      // 首先检查数据库状态
      if (!dbInitialized) {
        const initResult = await checkAndInitializeDatabase(env);
        dbInitialized = true;
        console.log('数据库检查结果:', initResult.message);
      }
      
      // 执行所有定时任务
      await runScheduledTasks(event, env, ctx);
    } catch (error) {
      console.error('定时任务执行出错:', error);
    }
  }
}; 