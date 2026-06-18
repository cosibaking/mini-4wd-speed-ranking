# Java 服务约定

适用于 Java 后端服务（高并发 / 微服务系统）。

> 仅当 QPS > 5k 或强事务一致性要求时采用此路径，否则优先走 Node.js 全栈。

## 技术栈

| 领域 | 选型 |
|---|---|
| 语言 | Java 17+ |
| 框架 | Spring Boot 3.x + Spring Cloud Alibaba |
| 消息队列 | RocketMQ（阿里云版） |
| 数据库 | RDS MySQL |
| 缓存 | Tair（兼容 Redis） |

参考：[《服务端开发概述》](https://alidocs.dingtalk.com/i/nodes/l6Pm2Db8D4Nd214kTERXBdMm8xLq0Ee4)

## 部署

- 打包为 JAR → 构建 Docker 镜像 → 推送 ACR → 部署到 ACK
- 标准 CI/CD 流水线（云效）

## 核心约束

- 必须提供 **OpenAPI 文档**，便于前端 Mock 和 AI 理解接口
- 遵循 Spring Boot 分层架构：Controller → Service → Repository
- 配置走 Nacos / 环境变量，禁止硬编码
- 日志接入 SLS，使用结构化日志格式

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "这个新项目用 Java 更稳" | 非高并发/强事务场景，优先 Node.js 全栈，降低技术栈碎片化 |
| "不需要 OpenAPI 文档" | Java 服务必须提供 OpenAPI，前端和 AI 依赖接口文档 |
| "用 Java 8 兼容性更好" | 新项目统一 Java 17+，Spring Boot 3.x 最低要求 Java 17 |

## 验证关卡

- [ ] 项目确实属于高并发 / 强事务场景（QPS > 5k）
- [ ] 提供完整 OpenAPI 文档
- [ ] 部署走标准 CI/CD 流水线
- [ ] 配置从 Nacos / 环境变量读取，无硬编码
