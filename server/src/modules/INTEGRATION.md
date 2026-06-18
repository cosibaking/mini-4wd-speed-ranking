# M02/M03 模块集成说明（Agent 2 → Agent 1）

## 路由挂载

`routes/index.ts` 已包含：

```typescript
router.use(trackRoutes.routes(), trackRoutes.allowedMethods());
router.use(recordRoutes.routes(), recordRoutes.allowedMethods());
```

## 鉴权约定

- `authMiddleware()`：可选登录
- `authMiddleware({ required: true })`：必须登录

## 模块间依赖

| 调用方 | 被调用方 | 方法 |
|--------|----------|------|
| `track.service` | `leaderboard.service` | `getRanking`（榜单摘要） |
| `record.service` | `track.service` | `exists`（提交前校验） |
| `track.controller` | `record.service` | `listByTrack`（主理人全部成绩） |
| `community/post.service` | `track.service` | `exists`（发帖关联赛道） |

## Redis 缓存

榜单缓存 key：`lb:{trackId}:v{version}:p{page}:s{pageSize}`，TTL 60s。  
版本号 key：`lb:ver:{trackId}`，best 更新时递增，无 Redis 时降级直查 DB。

## 错误码

模块专属错误见 `modules/track/errors.ts`、`modules/record/errors.ts`。
