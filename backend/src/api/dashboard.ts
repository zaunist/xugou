import { Hono } from 'hono';
import { Bindings } from '../models/db';
import { getDashboardData } from '../services/DashboardService';
export const dashboard = new Hono<{ Bindings: Bindings }>();

// 获取仪表盘数据
dashboard.get('/', async c => {
  const payload = c.get('jwtPayload');
  const result = await getDashboardData(payload.id);
  return c.json(
    {
      monitors: result.monitors,
      agents: result.agents,
    },
    200
  );
});
