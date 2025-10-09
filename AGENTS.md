# XUGOU 项目开发规则

## 项目概述

XUGOU 是一个基于 CloudFlare 的轻量化系统监控平台，采用现代化的全栈架构：
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Radix UI
- **Backend**: Hono + TypeScript + CloudFlare Workers + D1 Database
- **Agent**: Go + Cobra CLI + gopsutil
- **部署**: CloudFlare Workers + D1

## 代码规范

### 通用规范

1. **代码是写给人看的，只是机器恰好可以运行而已！**
2. **每次修改代码以后，需要确保代码能够编译通过！**
3. 使用 TypeScript 进行类型安全开发
4. 遵循 ESLint 和 Prettier 配置
5. 使用有意义的变量和函数命名
6. 添加必要的注释，特别是复杂业务逻辑
7. 保持代码简洁，避免过度工程化

### Frontend 规范

#### 文件组织
```
src/
├── api/           # API 调用封装
├── components/    # 可复用组件
│   └── ui/       # 基础 UI 组件 (shadcn/ui)
├── config/        # 配置文件
├── hooks/         # 自定义 React Hooks
├── i18n/          # 国际化配置
├── lib/           # 工具库
├── pages/         # 页面组件
├── providers/     # Context Providers
├── router/        # 路由配置
├── styles/        # 样式文件
├── types/         # TypeScript 类型定义
└── utils/         # 工具函数
```

#### 组件规范
1. 使用函数式组件和 React Hooks
2. 组件文件使用 PascalCase 命名 (如 `MonitorCard.tsx`)
3. 导出组件使用 default export
4. Props 接口命名为 `ComponentNameProps`
5. 使用 Radix UI 作为基础组件库
6. 样式使用 TailwindCSS，避免内联样式
7. 状态管理优先使用 React Context，复杂状态考虑 Zustand

#### 示例组件结构
```typescript
interface MonitorCardProps {
  monitor: Monitor;
  onEdit?: (monitor: Monitor) => void;
}

export default function MonitorCard({ monitor, onEdit }: MonitorCardProps) {
  // 组件逻辑
  return (
    <Card className="p-4">
      {/* 组件内容 */}
    </Card>
  );
}
```

### Backend 规范

#### 文件组织
```
src/
├── api/           # API 路由处理
├── config/        # 配置文件
├── db/            # 数据库相关
│   └── schema.ts  # Drizzle ORM 模式定义
├── jobs/          # 定时任务
├── middlewares/   # 中间件
├── models/        # 数据模型和类型
├── repositories/  # 数据访问层
├── services/      # 业务逻辑层
├── static/        # 静态资源
└── utils/         # 工具函数
```

#### API 规范
1. 使用 Hono 框架构建 RESTful API
2. 路由文件按功能模块组织 (如 `auth.ts`, `monitors.ts`)
3. 统一的错误处理和响应格式
4. 使用中间件处理 CORS、JWT 认证等
5. API 路径统一使用 `/api/` 前缀

#### 数据库规范
1. 使用 Drizzle ORM 进行数据库操作
2. 所有表结构定义在 `schema.ts` 中
3. 使用 SQLite (CloudFlare D1) 作为数据库
4. 表名使用复数形式，字段使用 snake_case
5. 必须包含 `created_at` 和 `updated_at` 字段
6. 使用 Repository 模式封装数据访问

#### 示例 API 结构
```typescript
const monitors = new Hono<{ Bindings: Bindings }>();

monitors.get('/', async (c) => {
  try {
    const result = await MonitorService.getAllMonitors(c.env);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});
```

### Agent 规范

#### 文件组织
```
cmd/
└── agent/         # CLI 命令定义
pkg/
├── collector/     # 数据收集器
├── config/        # 配置管理
├── model/         # 数据模型
├── reporter/      # 数据上报
└── utils/         # 工具函数
```

#### Go 代码规范
1. 遵循 Go 官方代码规范
2. 使用 Cobra 构建 CLI 应用
3. 使用 Viper 进行配置管理
4. 错误处理要完整，不忽略任何错误
5. 包名使用小写，避免下划线
6. 导出的函数和类型使用 PascalCase
7. 私有函数和变量使用 camelCase
