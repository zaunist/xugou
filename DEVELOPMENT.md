# 开发指南

## 环境要求

- Node.js >= 20.19.5
- pnpm >= 10.20.0
- Go >= 1.24 (用于Agent开发)

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动前端开发服务器
pnpm run dev:frontend

# 启动后端开发服务器
pnpm run dev:backend

# 同时启动前后端
pnpm run dev:preview
```

### 构建

```bash
# 构建前端
pnpm run build:frontend

# 构建后端
pnpm run build:backend

# 完整构建（包括数据库迁移）
pnpm run build
```

### 代码质量

```bash
# 运行代码检查
pnpm run lint

# 格式化代码
pnpm run format

# 检查格式（不修改文件）
pnpm run format:check

# 安全审计
pnpm run audit

# 自动修复安全问题
pnpm run audit:fix
```

## 代码规范

### ESLint & Prettier

项目使用 ESLint 和 Prettier 进行代码质量检查和格式化：

- **ESLint**: 检查代码质量和潜在问题
- **Prettier**: 统一代码格式

配置文件：
- `frontend/eslint.config.js` - 前端ESLint配置
- `backend/eslint.config.js` - 后端ESLint配置
- `.prettierrc` - 全局Prettier配置

### Pre-commit 钩子

项目配置了 pre-commit 钩子，在每次提交前自动运行：

- 代码格式检查
- ESLint检查
- 删除尾随空格
- 检查大文件

安装钩子：
```bash
npx pre-commit install
```

### EditorConfig

项目使用 `.editorconfig` 确保不同编辑器的代码风格一致。

## 安全

### 依赖审计

定期运行安全审计：
```bash
pnpm audit
```

### 自动化安全更新

项目配置了 GitHub Actions 工作流，每周一自动检查安全更新并创建PR。

## CI/CD

### 工作流

- `ci.yml`: 完整的CI/CD流程
- `security.yml`: 安全审计和更新
- `build.yml`: Agent二进制构建
- `deploy.yml`: 部署流程
- `docker-build.yml`: Docker构建
- `release.yml`: 发布流程

### 质量门禁

CI流程包含：
- 依赖安装
- 安全审计
- 代码检查
- 构建测试
- 安全扫描

## 日志

项目使用统一的日志系统：

```typescript
import { createLogger } from './utils/logger';

const logger = createLogger('ComponentName');

logger.info('信息消息');
logger.warn('警告消息');
logger.error('错误消息', { error: details });
```

## 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改（会自动运行代码检查）
4. 创建 Pull Request

## 许可证

ISC License