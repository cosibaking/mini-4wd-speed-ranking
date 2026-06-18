# API 接口总览

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06-18 | 初版 |

> Base URL: `https://api.example.com/api/v1`  
> 模块细节见 [modules/](./modules/) 目录。

---

## 1. 通用约定

### 1.1 请求头

| Header | 必填 | 说明 |
|--------|------|------|
| `Authorization` | 视接口 | `Bearer {jwt}`，需登录接口必填 |
| `Content-Type` | POST/PATCH | `application/json` |
| `X-Request-Id` | 否 | 客户端 UUID，便于追踪 |

### 1.2 统一响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

| code | 含义 |
|------|------|
| `0` | 成功 |
| `40001` | 参数校验失败 |
| `40100` | 未登录或 token 失效 |
| `40300` | 无权限 |
| `40400` | 资源不存在 |
| `40900` | 冲突（如赛道名重复） |
| `42900` | 频率限制 |
| `50000` | 服务器错误 |

### 1.3 分页参数

Query: `page=1&pageSize=20`

响应 `data` 结构：

```json
{
  "list": [],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

---

## 2. 认证与用户 `/auth` `/users`

| 方法 | 路径 | 登录 | 说明 |
|------|------|------|------|
| POST | `/auth/login` | 否 | 微信 code 登录 |
| POST | `/auth/refresh` | 是 | 续期 token |
| GET | `/users/me` | 是 | 当前用户资料 |
| PATCH | `/users/me` | 是 | 更新昵称/头像 |

详见 [用户认证模块](./modules/用户认证模块.md)。

---

## 3. 赛道 `/tracks`

| 方法 | 路径 | 登录 | 说明 |
|------|------|------|------|
| GET | `/tracks` | 否 | 赛道列表（可传 lat/lng 排序） |
| GET | `/tracks/recent` | 是 | 最近访问（最多 3） |
| GET | `/tracks/:id` | 否 | 赛道详情 |
| POST | `/tracks` | 是 | 创建赛道 |
| PATCH | `/tracks/:id` | 是 | 编辑（仅创建者） |
| GET | `/tracks/mine` | 是 | 我管理的赛道 |

---

## 4. 圈速与榜单 `/records` `/leaderboards`

| 方法 | 路径 | 登录 | 说明 |
|------|------|------|------|
| POST | `/records` | 是 | 提交成绩 |
| GET | `/records/:id` | 否 | 成绩详情 |
| GET | `/records/mine` | 是 | 我的成绩历史 |
| GET | `/tracks/:trackId/records` | 是 | 主理人查看赛道全部成绩 |
| GET | `/leaderboards/:trackId` | 否 | 圈速榜 |
| GET | `/leaderboards/:trackId/me` | 是 | 我的排名（可合并到榜单接口） |

---

## 5. 社区 `/boards` `/posts` `/social`

| 方法 | 路径 | 登录 | 说明 |
|------|------|------|------|
| GET | `/boards` | 否 | 板块列表 |
| GET | `/posts` | 否 | 帖子列表（boardId, sort） |
| GET | `/posts/following` | 是 | 关注的人发的帖 |
| GET | `/posts/:id` | 否 | 帖子详情 |
| POST | `/posts` | 是 | 发帖 |
| GET | `/posts/:id/comments` | 否 | 评论列表 |
| POST | `/posts/:id/comments` | 是 | 发表评论 |
| POST | `/social/like` | 是 | 点赞/取消 |
| POST | `/social/follow` | 是 | 关注/取消 |
| GET | `/social/following` | 是 | 我的关注列表 |

---

## 6. 媒体 `/media`

| 方法 | 路径 | 登录 | 说明 |
|------|------|------|------|
| POST | `/media/upload-credential` | 是 | 获取 COS 预签名 |
| POST | `/media/confirm` | 是 | 确认上传完成 |

---

## 7. 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |

---

## 8. 模块间 vs 对外 API

| 层级 | 消费者 | 形式 |
|------|--------|------|
| HTTP API | 微信小程序 | REST JSON |
| Service Interface | 服务端模块间 | TypeScript 接口，见 [架构设计](./架构设计.md) §5 |

**原则**：客户端 **不得** 跨模块拼装未暴露的组合接口；组合逻辑在服务端完成（如赛道详情含 `leaderboardSummary`）。

---

## 9. 组合接口（BFF 式扩展字段）

以下字段由 API 层聚合，非单表直出：

| 接口 | 扩展字段 | 来源模块 |
|------|----------|----------|
| `GET /tracks/:id` | `leaderboardSummary` | M03 |
| `GET /tracks` 列表项 | `distance`, `topRecord`, `participantCount` | M02 + M03 + 地理计算 |
| `GET /posts` | `author`, `liked`（登录时） | M01 + M04 |
| `GET /leaderboards/:trackId` | `myRank`（登录时） | M03 |

---

*各接口 Request/Response Schema 见对应模块文档。*
