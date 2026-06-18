# TypeScript 编码约定

适用于所有 TypeScript 项目。

## 严格模式

- `strictNullChecks: true`
- `noImplicitAny: true`
- `forceConsistentCasingInFileNames: true`
- 优先使用 `readonly`、`const`；禁止 `var`
- 所有公开函数必须有显式参数和返回值类型

## 命名约定

| 类型 | 规则 | 示例 |
|---|---|---|
| 文件名 | kebab-case | `channel-router.ts` |
| 类名 | PascalCase | `ChannelRouter` |
| 接口名 | PascalCase（无 I 前缀） | `AIProvider`、`TaskResult` |
| 变量/函数 | camelCase | `selectChannel()` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_BASE_URL` |
| 枚举 | PascalCase 名 + PascalCase 值 | `enum TaskType { Video, Image }` |

## 代码风格

遵循项目 `.prettierrc` + `eslint.config.mjs`：

- 单引号 `singleQuote: true`
- 尾逗号 `trailingComma: "all"`
- ESLint：`@typescript-eslint/no-floating-promises: warn`——异步调用不能忽略 Promise

## 偏好

- 函数式风格：显式参数、偏好不可变性、声明式优于命令式
- 最小化状态，短函数，不过度设计
- 禁止发明未知的 API——不确定时查文档或询问

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "用 any 更方便" | `noImplicitAny` 已开启，any 会隐藏类型错误 |
| "这个函数返回值类型很明显，不用写" | 公开函数必须显式标注，IDE 推断不等于文档 |
| "这里用 var 也没问题" | 统一用 const/let，var 的作用域行为容易出 bug |

## 验证关卡

- [ ] 代码通过 `npm run lint` 无错误
- [ ] 代码通过 `npm run format` 格式化
- [ ] 公开函数有显式返回值类型
- [ ] 没有新增的 `any` 类型（除非有充分理由）
