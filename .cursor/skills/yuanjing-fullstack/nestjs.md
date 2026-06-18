# NestJS 框架约定

适用于所有 NestJS 后端项目。

## 模块化

- 按关注点模块化，每个模块一个 `*.module.ts`
- 使用 DI 注入服务，**禁止**手动 `new` 服务实例
- Controller 只做请求解析和响应包装，业务逻辑放 Service
- 跨模块依赖通过 `exports` + `imports`，避免循环依赖（必要时用 `forwardRef`）

## 配置管理

- 所有配置集中在 `src/config/configuration.ts`，类型安全
- 环境变量通过 `.env.{envType}` 加载
- 运行时通过 `ENV_TYPE` 区分：`local` / `pre` / `prod`
- 新增配置项流程：先在 Config 接口定义类型 → 在 config 对象中赋默认值 → 更新 README
- 密钥类配置：**禁止**硬编码，必须从环境变量读取

## 日志

- 使用 `LoggerService`（DI 注入），**禁止** `console.log`（`main.ts` 启动阶段除外）
- 远端日志（如 SLS）：分为业务日志和技术日志
- 所有日志必须带 `requestId`
- 错误日志必须包含 stack trace
- 远端日志 `catch` 后不再抛出——日志故障不应阻断业务

## BullMQ 队列

- 队列配置集中管理，不散落在各处
- Job 数据结构定义在共享类型文件中
- Processor 必须幂等（Job 可能因 stalled 被重投）
- 变更 Job 数据结构时确保旧格式 Job 仍可处理

## 验证管道

- 全局 `ValidationPipe`：`transform: true`、`whitelist: true`
- 使用 `class-validator` + `class-transformer` 做 DTO 校验

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "直接 new 这个 Service 更快" | 破坏 DI 链，Mock 测试无法注入，生命周期钩子失效 |
| "console.log 调试完再改" | 提交的代码必须用 LoggerService，console.log 不带结构化上下文 |
| "配置直接写在代码里，就这一处用" | 所有配置走 configuration.ts，环境差异通过 env 文件管理 |

## 验证关卡

- [ ] 新 Service 通过 DI 注入，未手动 new
- [ ] 新增配置项已在 Config 接口中定义类型
- [ ] 日志使用 LoggerService，无 console.log
- [ ] Controller 中无业务逻辑（仅请求解析 + 响应包装）
