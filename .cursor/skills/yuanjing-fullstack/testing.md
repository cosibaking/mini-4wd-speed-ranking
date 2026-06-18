# 测试规范

适用于所有项目。

## 分层策略

| 层 | 工具 | 位置 | 运行环境 |
|---|---|---|---|
| 单元测试 | Jest + ts-jest | 与源文件同目录 `*.spec.ts` | CI + 本地 |
| 集成测试（手工） | ts-node 脚本 | `*-real-test.ts` | 仅本地（依赖真实 API Key） |
| E2E 测试 | Jest + supertest | `test/` 目录 | CI + 本地 |

## 单元测试

- 测试文件与源文件同目录：`xxx.spec.ts`
- Mock 策略：对外部依赖（如 axios）做整体 mock，不发起真实请求
- 每个模块至少覆盖：构造 / 主流程成功 / 主流程失败 / 边界情况
- 运行命令：`npm test`

## 集成测试

- `*-real-test.ts` 脚本连接真实外部 API
- **禁止**在 CI 中运行——依赖真实 API Key
- 用于外部接口变更后的冒烟验证

## E2E 测试

- 目录：`test/`，配置 `test/jest-e2e.json`
- 运行：`npm run test:e2e`

## 前端测试

| 层 | 工具 | 关注点 |
|---|---|---|
| 组件测试 | React Testing Library + Jest | 组件渲染、交互行为、Props 变化 |
| E2E 测试 | Playwright / Cypress | 完整用户流程、跨页面交互 |
| 可访问性 | axe-core / Lighthouse | WCAG 2.1 AA 合规 |

- 组件测试关注**用户行为**而非实现细节（query by role/text，不 query by class）
- E2E 测试覆盖核心用户路径，不追求全覆盖
- 可访问性检查集成到 CI（至少 Lighthouse 评分不回退）

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "这个改动很简单，不需要测试" | 任何行为变更都需要测试证明正确性 |
| "我后面再补测试" | 测试和代码同时提交，不接受 TODO 式测试 |
| "Mock 太麻烦，直接调真实 API" | 单元测试必须 Mock，真实 API 调用放到集成测试 |

## 验证关卡

- [ ] `npm test` 全部通过
- [ ] 新增/修改的模块有对应的 spec 文件
- [ ] Mock 覆盖了外部依赖，测试不依赖网络
