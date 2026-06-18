# 安全实践

适用于所有项目。

## 密钥管理

- API Key、数据库密码等**禁止**硬编码在代码中，必须从环境变量读取
- **禁止**提交 `.env`、`credentials.json` 等含密钥的文件到 Git
- 密钥需要持久化时，使用 AES-256-GCM 等强加密算法加密落库
- 加密主密钥从环境变量加载（后续可接入 KMS）

## 脱敏

- API 响应中**永远**脱敏返回密钥（如只显示前 8 位 + `***`）
- 日志中不打印完整密钥、Token、密码

## 认证鉴权

- 对外 API 使用 API Key 认证（`Authorization: Bearer` / `X-API-Key`）
- 管理端 API 使用独立的 Admin Token
- 服务间调用走内网（K8s Service），辅以 Token 认证

## 数据隔离

- 服务间**不直连**对方的 DB / Redis——双向隔离
- 回调链路单向：服务 → 业务方 webhook，业务方不反向直连

## 客户端安全

- **XSS 防护**：使用框架内置转义（React JSX 自动转义），禁止 `dangerouslySetInnerHTML` 除非内容已净化
- **CSRF 防护**：API 调用使用 Token 认证而非 Cookie 自动携带；如用 Cookie 需加 CSRF Token
- **Token 存储**：优先 httpOnly Cookie；如用 localStorage 需评估 XSS 风险
- **CSP**：配置 Content-Security-Policy，限制脚本/样式来源
- **敏感数据**：客户端代码和构建产物中**禁止**嵌入密钥、内部 API 地址（Next.js 环境变量规则见 [nextjs.md](nextjs.md)）

## 反合理化

| Agent 常见借口 | 为什么不行 |
|---|---|
| "开发环境先硬编码 Key，上线再改" | 硬编码一旦提交到 Git 就是泄露，从一开始就用环境变量 |
| "日志里打个完整 Key 方便调试" | 日志可能被多人访问，完整密钥必须脱敏 |

## 验证关卡

- [ ] 代码中无硬编码的密钥、Token、密码
- [ ] API 响应中密钥已脱敏
- [ ] `.gitignore` 已覆盖敏感文件
