---
name: yuanjing-fullstack
description: >-
  元境全栈研发规范库。跨项目、跨语言的工程标准与技术栈约定。
  包含技术选型约束、架构设计约束、TypeScript/NestJS/Prisma/Next.js 编码规范、测试、安全、Git 等子文档。
  Use when starting work on any yuanjing project, when the user mentions
  研发规范, 工程标准, 编码规范, coding standards, or engineering principles.
---

# 元境全栈研发规范库

本目录是团队共享的工程标准 hub。各项目根据自身技术栈，在项目级 SKILL.md 中引用所需的子文档。

## 子文档索引

| 文档 | 适用范围 | 内容 |
|---|---|---|
| [tech-choices.md](tech-choices.md) | 所有项目 | 技术选型约束、已定技术栈清单（前端/后端/通用）、新依赖评估标准 |
| [architecture.md](architecture.md) | 所有服务 | K8s/FC/全栈一体部署、无状态、幂等、优雅关停、健康检查、服务边界 |
| [infra.md](infra.md) | 所有项目 | 阿里云基础设施清单、部署方式选型、CI/CD 流水线 |
| [typescript.md](typescript.md) | 所有 TypeScript 项目 | 严格模式、命名约定、代码风格 |
| [nestjs.md](nestjs.md) | NestJS 后端项目 | 模块化、DI、Controller/Service 分层、配置管理、日志、BullMQ |
| [prisma.md](prisma.md) | 使用 Prisma 的项目 | Schema 规范、Migration 命名与流程、软删除 |
| [nextjs.md](nextjs.md) | Next.js 前端项目 | App Router、shadcn/ui、Tailwind、RHF+Zod、TanStack Query、Zustand |
| [testing.md](testing.md) | 所有项目 | Jest 单元测试、Mock 策略、集成测试、E2E、前端组件测试 |
| [security.md](security.md) | 所有项目 | 密钥管理、加密、脱敏、认证鉴权、客户端安全 |
| [git-and-docs.md](git-and-docs.md) | 所有项目 | Git 提交规范、文档规范 |
| [python.md](python.md) | Python 服务 | FastAPI、LangChain/LlamaIndex、FC/ACK 部署、向量库、调度 |
| [java.md](java.md) | Java 服务 | Java 17+、Spring Boot 3.x + SCA、RocketMQ、高并发场景 |

## 项目如何使用

在项目的 `.cursor/skills/<project>/SKILL.md` 中，按技术栈引用所需子文档：

```markdown
## 适用的通用规范

本项目遵循以下通用规范，修改代码前请先阅读：
- [架构约束](../../.cursor/skills/yuanjing-fullstack/architecture.md)
- [TypeScript](../../.cursor/skills/yuanjing-fullstack/typescript.md)
- ...（按需选择）

## 项目专属规范

（以下为本项目独有内容）
```

## 编写原则

- **精炼**：每个子文档 ≤120 行，只写 Agent 不已知的团队约定
- **反合理化**：关键约束处预设 Agent 常见借口的反驳
- **验证关卡**：每个子文档末尾列出具体的完成检查项
