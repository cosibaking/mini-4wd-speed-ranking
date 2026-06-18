# 基础设施约定

云厂商：**阿里云（唯一指定）**。禁止未经审批引入其他云厂商服务。

## 服务清单

| 功能 | 服务 | 说明 |
|---|---|---|
| 容器编排 | **ACK**（Alibaba Cloud Kubernetes） | 所有常驻服务容器化部署 |
| Serverless | **FC**（函数计算） | 低频/事件驱动/AI Agent，支持 Custom Runtime |
| CI/CD | **云效**（Apsara DevOps） | 统一流水线：代码扫描 → 构建镜像 → 推送 ACR → 部署 |
| 镜像仓库 | **ACR** | 私有 Docker 镜像托管 |
| 数据库 | **RDS MySQL** / **RDS Serverless MySQL** | Serverless 适合低频项目，接受冷启动延迟 |
| 缓存 | **Tair**（兼容 Redis） | 热点数据、会话存储、分布式锁 |
| 对象存储 | **OSS** | 图片、文件、备份 |
| 日志监控 | **SLS** + **ARMS** | 统一日志收集、APM、告警 |
| 网关 | **MSE 网关** | 流量入口、灰度发布 |
| 安全 | **WAF** + **RAM** | Web 防护 + 权限最小化 |
| 消息队列 | **RocketMQ** | 仅 Java / Python 场景使用（Node.js 用 BullMQ + Redis） |
| 向量检索 | **OpenSearch** / **PolarDB + pgvector** / Milvus | AI 场景按需选型 |
| 定时任务 | **SchedulerX** | 分布式定时调度 |

## 部署方式选型

| 项目类型 | 推荐部署 | 数据库 |
|---|---|---|
| 常驻业务服务（高可用） | ACK（Docker 镜像） | RDS MySQL |
| Next.js 全栈应用（常规） | ACK（Docker 镜像） | RDS MySQL |
| 低频工具/内部系统 | FC | RDS Serverless MySQL |
| AI Agent / 数据处理 | FC Custom Runtime 或 ACK 容器 | 按需 |
| Java 微服务 | ACK（JAR → Docker） | RDS MySQL |

## CI/CD 流水线

- 标准流程：代码提交 → 自动构建 Docker 镜像 → 推送 ACR → 滚动更新 ACK
- FC 部署：通过云效流水线或 Serverless Devs 工具链
- 所有环境（dev / pre / prod）使用**同一镜像**，通过环境变量区分配置

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "用 AWS / GCP 的某个服务更好" | 统一阿里云，混用多云增加运维复杂度 |
| "自建 Redis 更灵活" | 用 Tair 托管服务，不自建中间件 |
| "直接在服务器上跑，不需要容器" | 所有服务容器化，确保环境一致性和可移植性 |

## 验证关卡

- [ ] 新增基础设施服务来自阿里云服务清单
- [ ] 部署方式与项目类型匹配
- [ ] CI/CD 走云效标准流水线
- [ ] 不同环境使用同一镜像 + 环境变量区分
