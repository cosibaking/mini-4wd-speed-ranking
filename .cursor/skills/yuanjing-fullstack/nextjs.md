# Next.js 前端约定

适用于 Next.js 前端项目。

## App Router

- 使用 App Router（`app/` 目录），不使用 Pages Router
- 后端逻辑优先写在 **Server Action** 或 **Route Handler**，避免客户端直调外部 API
- API Route 仅用于第三方 webhook 或兼容旧系统
- 页面组件默认 Server Component，仅在需要交互时加 `'use client'`

## 样式

- **必须使用 Tailwind CSS**，禁止生成全局 CSS（除 `globals.css` 中的 Tailwind 指令）
- 启用 `@tailwindcss/typography`、`@tailwindcss/forms` 插件
- 组件样式通过 Tailwind class 组合，不写 CSS/SCSS 文件
- 复杂组件可提取 Tailwind 变体或使用 `cn()` 工具合并 class

## 组件库

- 默认使用 **shadcn/ui** 作为基础组件库（按需安装，可定制）
- 禁止引入 Ant Design / Element 等重型 UI 库（特殊业务需审批）
- 自定义组件基于 shadcn/ui 原子组件组合

## 数据获取

- 使用 **TanStack Query (React Query) v5+** 统一数据获取、缓存、同步
- Server Components 优先在服务端获取数据
- 客户端仅处理交互状态，禁止裸 `useEffect` + `fetch` 管理异步数据
- 所有异步操作必须处理 **loading / error** 状态（Suspense 或 useQuery）

## 表单

- 表单使用 **React Hook Form + Zod**
- 表单状态由 RHF 管理，校验 Schema 使用 Zod 定义
- Zod Schema 可在 Client Component 和 Server Action 间共用
- 禁止手写 `onChange` 管理表单状态
- 禁止引入 Formik

## 状态管理

- 简单状态用 React 内置（useState / useReducer / useContext）
- UI 全局状态（模态框、主题、侧边栏）使用 **Zustand**
- 服务端数据缓存走 TanStack Query，不放状态库
- 禁止引入 Redux / MobX

## 环境变量

- 客户端可见变量使用 `NEXT_PUBLIC_*` 前缀
- **密钥禁止**放 `NEXT_PUBLIC_*`——构建产物是公开的
- 服务端变量仅在 Server Component / Route Handler / Server Action 中使用

## 组件设计

- 单一职责：一个组件做一件事
- 优先受控组件，状态提升到合理层级
- 复用组件放 `components/`，页面专用组件就近放

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "写个全局 CSS 文件更快" | 禁止全局 CSS，全部用 Tailwind class |
| "直接在客户端调外部 API" | 外部 API 调用放 Server Action / Route Handler，避免暴露密钥和跨域问题 |
| "loading 状态后面再加" | 异步操作必须同时处理 loading/error，不接受只有 happy path |
| "全部用 'use client' 省事" | 默认 Server Component，仅在需要浏览器 API / 交互时才用 client |
| "用 Ant Design 组件更全" | 默认 shadcn/ui，重型 UI 库需审批 |
| "手写 onChange 管理表单就行" | 表单必须用 React Hook Form + Zod |
| "用 useEffect + fetch 获取数据" | 客户端数据获取统一走 TanStack Query |

## 验证关卡

- [ ] 页面组件默认 Server Component，`'use client'` 仅在必要处使用
- [ ] 无全局 CSS 文件，样式全部 Tailwind class
- [ ] 异步操作有 loading 和 error 状态处理
- [ ] 环境变量中密钥未使用 `NEXT_PUBLIC_*` 前缀
- [ ] 外部 API 调用在服务端执行（Server Action / Route Handler）
- [ ] UI 组件来自 shadcn/ui 或项目自定义组件
- [ ] 表单使用 React Hook Form + Zod，无手写 onChange
- [ ] 数据获取使用 TanStack Query，无裸 useEffect + fetch
