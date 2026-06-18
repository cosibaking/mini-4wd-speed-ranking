# Prisma 与数据库约定

适用于所有使用 Prisma ORM 的项目。

## Schema 规范

- 每个服务拥有**独立完整的数据库定义**（`prisma/schema.prisma`）
- Schema 中只保留本服务自身业务所需的表
- 所有表使用 `@map("snake_case")` 映射到数据库字段名
- 数据库字段命名统一 snake_case：`model_key`、`api_key`
- 软删除标准字段：`deleted: Boolean @default(false)` + `deletedAt: DateTime? @map("deleted_at")`
- 查询时**始终**加 `deleted: false` 条件
- 生成命令：`npm run db:generate`（即 `prisma generate`）

## Migration 规范

每次新增表或修改字段时，**必须同时**完成：

1. 修改 `prisma/schema.prisma`
2. 创建对应的 Migration 文件

### 目录命名

格式：`YYYYMMDDHHMM_<简要描述>`

- 精确到年月日时分，从目录名即可判断先后顺序
- 描述使用 snake_case 英文
- 示例：`202605121030_add_pricing_rules`、`202605150945_alter_provider_keys_add_weight`

```
prisma/migrations/
├── 202605091430_init_ai_tables/
│   └── migration.sql
├── 202605110900_add_call_records/
│   └── migration.sql
└── migration_lock.toml
```

### 开发流程

```bash
# 1. 修改 prisma/schema.prisma
# 2. 生成 migration（本地开发库自动应用）
npx prisma migrate dev --name <YYYYMMDDHHMM_描述>

# 3. 本地验证 migration 可正确执行
npx prisma migrate deploy
```

### 部署流程

- 预发 / 生产环境的 migration 执行走 **AppStack 流水线**
- 本地 `npx prisma migrate deploy` 仅用于验证

### 关键约束

- **禁止**手动执行 DDL——所有变更通过 Migration
- **禁止**修改已提交的 Migration 文件——如需修正，创建新 Migration
- Migration SQL 必须可在空库上顺序执行（从零构建完整 schema）
- 破坏性变更（删列、改类型）需在 SQL 中处理数据迁移
- 新增字段如有默认值，在 SQL 中用 `DEFAULT` 或 `UPDATE` 补填历史数据

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "这个小改动不需要 migration" | 所有 schema 变更必须有 migration，无例外 |
| "我直接改已有的 migration 文件修个 bug" | 已提交的 migration 不可修改，创建新的来修正 |
| "忘了加 deleted: false 条件" | 软删除是全局约定，漏掉会查出已删除数据 |
| "字段名用 camelCase 就行" | DB 字段统一 snake_case，Prisma 用 @map 映射 |

## 验证关卡

- [ ] `prisma/schema.prisma` 已更新
- [ ] `prisma/migrations/YYYYMMDDHHMM_xxx/migration.sql` 已创建
- [ ] `npx prisma migrate dev` 本地执行成功
- [ ] 新增字段有默认值或 migration 中包含历史数据补填
- [ ] 查询代码中已加 `deleted: false` 条件
- [ ] 新表有 `deleted` + `deletedAt` 软删除字段
