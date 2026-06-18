# 技术选型约束

适用于所有项目。目标：控制技术碎片化，降低团队认知负担，保持 AI 编码工具高效生成。

## 核心原则

- **内部包优先**：优先使用 `@yuanjing/*` 内部包（见下方清单），再考虑第三方
- **复用优先**：优先使用项目中已有的依赖，不引入功能重叠的新库
- **团队共识**：引入新语言、框架或核心依赖需团队讨论确认，不可单方面决定
- **最小依赖**：能用已有工具解决的，不引入新依赖；能用标准库的，不引入第三方库
- **AI 友好**：优先选用主流 AI 编码工具深度优化的技术组合（TSX + Tailwind + shadcn/ui）

## @yuanjing/* 内部包（UniStack）

团队维护的内部包，功能匹配时**必须优先使用**，禁止引入功能重叠的第三方替代。

| 包名 | 用途 |
|---|---|
| `@yuanjing/passport-client` | Passport REST 客户端（登录、注册、找回密码等） |
| `@yuanjing/gateway-http-client` | Passport 网关 HTTP 客户端与签名 |
| `@yuanjing/pino-logger` | 基于 Pino 的日志（含 server/client 子路径） |
| `@yuanjing/alicloud-sls` | 阿里云 SLS 日志上报（含 `/client` 子入口） |
| `@yuanjing/alicloud-oss` | 阿里云 OSS 签名上传、图片处理（含 `/image` 子入口） |
| `@yuanjing/alicloud-sts` | 阿里云 STS 临时凭证 |
| `@yuanjing/next-api-logger` | Next.js API 路由日志、追踪、SLS 上报 |
| `@yuanjing/fetch-api-client` | 浏览器侧 Fetch API 客户端（类型、错误、重试） |
| `@yuanjing/result-struct` | Go 风格 `[error, data]` 类型化错误处理 |

## 已定技术栈

引入以下范围外的技术前，必须先与团队讨论。

### 前端（Next.js 生态）

| 领域 | 选型 | 说明 |
|---|---|---|
| 框架 | Next.js 14+（App Router） | 禁止 Remix / Nuxt / Vite SPA |
| 样式 | Tailwind CSS v3+ | 禁止 styled-components / CSS Modules / Emotion；启用 `@tailwindcss/typography`、`@tailwindcss/forms` |
| UI 组件库 | **shadcn/ui**（默认） | 禁止 Ant Design / Element 等重型库（特殊业务需审批） |
| 数据获取 | TanStack Query v5+ | 禁止裸 `useEffect` + `fetch` 管理异步数据 |
| 状态管理 | React 内置 + Zustand（UI 状态） | Zustand 仅限 UI 状态（模态框、主题、侧边栏）；禁止 Redux / MobX |
| 表单 | React Hook Form + Zod | 禁止 Formik |
| 用户认证（ToC） | **NextAuth v5** + `@yuanjing/passport-client` | NextAuth CredentialsProvider 对接 Passport REST；ToB 走官网登录链路 |
| 国际化 | next-intl（如需） | — |

### 后端（按场景选型）

**场景 A：常规业务 API / 全栈应用（默认路径）**

| 领域 | 选型 | 说明 |
|---|---|---|
| 语言 | TypeScript（Node.js 20+） | 禁止 CoffeeScript / Flow |
| 框架 | Next.js Server Actions（全栈一体）或 NestJS（独立微服务） | API Route 仅用于第三方 webhook / 兼容旧系统 |
| ORM | **Prisma**（默认）| Serverless FC / Edge Runtime / Bundle 敏感场景可用 **Drizzle**；单项目禁止混用 |
| 队列 | BullMQ + Redis | 禁止 RabbitMQ / Kafka（当前规模不需要） |
| HTTP 客户端 | axios | 禁止 got / node-fetch / undici |
| 校验（NestJS） | class-validator + class-transformer | NestJS 项目禁止 zod / joi / yup |
| 日志 | @yuanjing/pino-logger + @yuanjing/alicloud-sls | 禁止 winston / bunyan |
| 测试 | Jest | 禁止 Vitest / Mocha |

**场景 B：高并发 / 微服务系统（QPS > 5k 或强事务一致性）**

| 领域 | 选型 |
|---|---|
| 语言 | Java 17+ |
| 框架 | Spring Boot 3.x + Spring Cloud Alibaba |
| 消息队列 | RocketMQ（阿里云版） |
| 数据库 | RDS MySQL |

> 仅当 QPS > 5k 或强事务一致性要求时启用，否则优先走 Node.js 全栈。

**场景 C：AI Agent / 数据处理 / 异步任务**

| 领域 | 选型 |
|---|---|
| 语言 | Python 3.10+ |
| 框架 | FastAPI（API）+ LangChain / LlamaIndex（Agent） |
| 部署 | FC Custom Runtime 或 ACK 容器（长时任务） |

### 通用

| 领域 | 选型 |
|---|---|
| 包管理 | npm（使用 package-lock.json） |
| 代码格式化 | Prettier |
| 静态检查 | ESLint |
| 版本控制 | Git |
| 数据库 | RDS MySQL / RDS Serverless MySQL（低频项目） |
| 缓存 | Tair（兼容 Redis） |

## 引入新依赖的评估标准

1. **必要性**：现有依赖是否已能解决？标准库是否够用？
2. **维护活跃度**：最近 6 个月有更新吗？issue 响应速度如何？
3. **社区规模**：npm 周下载量、GitHub stars（参考，非决定因素）
4. **包体积**：对前端项目尤其重要，评估 bundle 影响
5. **许可证**：MIT / Apache 2.0 优先，避免 GPL 类传染许可
6. **类型支持**：必须有 TypeScript 类型定义（内置或 @types）

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "用 zod 做 NestJS 校验更现代" | NestJS 已用 class-validator，不引入功能重叠的库；Zod 用于 Next.js 表单和 Server Actions |
| "Drizzle 比 Prisma 性能好" | 默认 Prisma，仅 Serverless/Edge/Bundle 敏感场景才用 Drizzle |
| "装个小工具库很方便" | 先看标准库和已有依赖能否解决，10 行代码能搞定就不装包 |
| "这个库 GitHub 很火" | Stars 不是选型标准，评估必要性、维护、体积、许可证 |
| "前端用 styled-components 更灵活" | 样式统一 Tailwind，不混入 CSS-in-JS |
| "用 Ant Design 组件更全" | 默认 shadcn/ui，重型 UI 库需特殊审批 |
| "用 Redux 状态管理更成熟" | React 内置 + Zustand 足够，不引入 Redux 全家桶 |
| "用 winston 日志库更通用" | 日志统一 `@yuanjing/pino-logger` + `@yuanjing/alicloud-sls`，不引入第三方日志库 |
| "自己封装一个 OSS 上传" | 已有 `@yuanjing/alicloud-oss`，不重复造轮子 |
| "用 NextAuth 的 PrismaAdapter" | 团队实践用自定义 JWT encode/decode + DB Session，不用官方 adapter |

## 验证关卡

- [ ] 新增依赖不与已有依赖功能重叠
- [ ] 新增核心依赖（框架/ORM/队列级别）已经团队讨论
- [ ] 依赖许可证为 MIT / Apache 2.0
- [ ] 依赖有 TypeScript 类型支持
- [ ] `package.json` 中无重复功能的库
- [ ] ORM 选型符合部署场景（Prisma 默认，Drizzle 仅限特定场景）
- [ ] 前端组件来自 shadcn/ui 或项目自定义组件，未引入未审批的第三方 UI 库
- [ ] 功能被 `@yuanjing/*` 内部包覆盖时，未引入第三方替代
