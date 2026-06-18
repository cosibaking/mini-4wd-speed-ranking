# Python 服务约定

适用于 Python 后端服务（AI Agent / 数据处理 / 异步任务）。

## 技术栈

| 领域 | 选型 |
|---|---|
| 语言 | Python 3.10+ |
| API 框架 | FastAPI |
| AI Agent | LangChain / LlamaIndex |
| 依赖管理 | pyproject.toml（推荐）或 requirements.txt |
| 测试 | pytest |
| 类型 | 全部使用 Type Hints |

## 部署

- **FC Custom Runtime**：适合事件驱动、低频调用、弹性伸缩场景
- **ACK 容器**：适合长时任务、常驻服务、需持久连接场景
- 必须无状态、幂等、可重试——FC 可能随时销毁实例

## 存储

| 领域 | 选型 |
|---|---|
| 向量库 | Milvus（自维护）或阿里云 OpenSearch（向量检索）或 PolarDB + pgvector |
| 文件存储 | OSS（对象存储） |
| 关系数据库 | RDS MySQL（如需） |

## 调度

| 领域 | 选型 |
|---|---|
| 定时任务 | SchedulerX（阿里云） |
| 异步队列 | RocketMQ |

## 集成方式

- 与主站解耦，通过 API 或事件驱动集成
- 提供 OpenAPI 文档，便于其他服务和 AI 理解接口
- 敏感配置从环境变量读取，禁止硬编码

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "用 Flask 更简单" | 统一用 FastAPI，自带类型校验和 OpenAPI 文档 |
| "不需要 Type Hints" | 全部使用 Type Hints，AI 工具依赖类型信息生成代码 |
| "在本地文件系统存临时文件" | FC 实例随时销毁，文件存 OSS |
| "这个任务不需要幂等" | FC/队列都可能重试，所有处理逻辑必须幂等 |

## 验证关卡

- [ ] 服务无状态，不依赖本地文件系统或进程内存持久数据
- [ ] 所有函数有 Type Hints
- [ ] 配置从环境变量读取，无硬编码密钥
- [ ] 有 pytest 测试覆盖核心逻辑
- [ ] 提供 OpenAPI 文档
