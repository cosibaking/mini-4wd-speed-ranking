# 迷你四驱圈速打榜

微信小程序 + Node.js 后端，支持赛道管理、圈速榜单与社区交流。

## 技术栈

| 层级 | 技术 |
|------|------|
| 客户端 | 微信小程序（`miniapp/`） |
| 服务端 | Node 20 · Koa 2 · TypeScript · Prisma |
| 数据库 | MySQL 8 |
| 缓存 | Redis 7（可选，不可用时自动降级） |

## 目录结构

```
├── miniapp/          # 微信小程序（workspace）
├── server/           # Koa API 服务（workspace）
├── docs/             # 产品与技设文档
└── docker-compose.yml
```

## 环境要求

- Node.js >= 20
- Docker Desktop（用于 MySQL / Redis）

## 快速开始

### 1. 启动基础设施

```bash
docker compose up -d
```

默认端口：

- MySQL: `3306`（用户 `mini4wd` / 密码 `mini4wd`，库名 `mini4wd`）
- Redis: `6379`

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp server/.env.example server/.env
```

开发环境默认 `WECHAT_MOCK=true`，可用任意 `code` 字符串模拟微信登录（`openId = mock_{code}`）。

### 4. 数据库迁移与种子

```bash
npm run db:migrate -w server
npm run db:seed -w server
```

### 5. 启动 API 服务

```bash
npm run dev:server
```

服务地址：`http://localhost:3000`

健康检查：`GET http://localhost:3000/api/v1/health`

## 开发接口速查（M01 已实现）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 微信 code 登录（dev mock） |
| POST | `/api/v1/auth/refresh` | 续期 token |
| GET | `/api/v1/users/me` | 当前用户资料 |
| PATCH | `/api/v1/users/me` | 更新昵称/头像 |
| GET | `/api/v1/health` | 健康检查 |

### Mock 登录示例

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test-user-1"}'
```

## 常用命令

```bash
npm run dev:server      # 开发模式（热重载）
npm run build:server    # TypeScript 编译
npm run db:generate     # 生成 Prisma Client
npm run db:migrate      # 执行迁移
npm run db:seed         # 写入 boards 种子数据
```

## 模块分工

| Agent | 模块 | 路径 |
|-------|------|------|
| Agent 1 | 基础架构 + M01 用户认证 | `server/src/shared`, `middleware`, `modules/auth`, 路由 stub |
| Agent 2 | M02 赛道 | `server/src/modules/track`, `routes/track.routes.ts` |
| Agent 3 | M03 圈速榜单 | `server/src/modules/record`, `routes/record.routes.ts` |
| Agent 4 | M04 社区 | `server/src/modules/community`, `routes/community.routes.ts` |
| Agent 5 | M05 媒体 | `server/src/modules/media`, `routes/media.routes.ts` |

## 上线配置

生产环境请使用配置模板并按说明填写：

```bash
cp server/.env.production.example server/.env   # 服务端
# 小程序：复制 miniapp/config.production.example.ts → miniapp/config.ts
```

详细步骤见 [生产配置使用说明](docs/生产配置使用说明.md)。

## 文档

- [产品设计文档](docs/产品设计文档.md)
- [生产配置使用说明](docs/生产配置使用说明.md)
- [架构设计](docs/tech/架构设计.md)
- [数据库设计](docs/tech/数据库设计.md)
- [API 接口总览](docs/tech/API接口总览.md)
