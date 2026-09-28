# `data/people.json`

站点构建时只读此文件（与 `public/avatars/` 中的头像路径）。当前是 2026-09-28 从 Notion「Circle」导出的快照：85 人，头像已缓存到站内，不热链 X。`interactions` 是 2026-08-21 到 2026-09-28 的回复、引用和 @。备注没有写入。隐藏行不会出现（这次快照里没有隐藏行）。

## 顶层结构

| 字段      | 类型   | 说明                                                   |
| --------- | ------ | ------------------------------------------------------ |
| `version` | `1`    | 格式版本                                               |
| `center`  | object | froQ 的名字和 handle，仅作数据归属。画板不渲染这张头像 |
| `people`  | array  | 成员列表                                               |

## `people[]` 字段

| 字段           | 类型                                                 | 说明                                           |
| -------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `name`         | string                                               | 显示名                                         |
| `handle`       | string                                               | X handle，不带 `@`                             |
| `userId`       | string                                               | X user id，改名后对齐同一人                    |
| `avatar`       | string                                               | 站内头像路径，如 `/avatars/{userId}.jpg`       |
| `status`       | `mutual` \| `followsMe` \| `iFollow` \| `unfollowed` | 关注状态                                       |
| `firstSeen`    | string (ISO date)                                    | 首次出现在快照的日期                           |
| `unfollowedAt` | string \| null                                       | 取关日                                         |
| `hidden`       | boolean                                              | `true` 则不上墙、不参与渲染                    |
| `ring`         | `auto` \| `1` \| `2` \| `3` \| `4`                   | 数据管线可保留。站点不读取、不展示、不参与摆放 |
| `platforms`    | `{ name, url }[]`                                    | 其他平台链接                                   |
| `impression`   | string                                               | 手写印象（卡片内用手写体风格展示）             |
| `timeline`     | `{ date, text }[]`                                   | 时间线                                         |
| `pinnedPosts`  | `{ url, text, date, images? }[]`                     | 精选帖子静态引用                               |
| `interactions` | number                                               | 近 90 天回复、引用、@ 的合计。决定头像大小     |

TypeScript 类型见 `shared/circle/types.ts`。

`scripts/generate-mock-circle.mjs` 会用虚构名单覆盖这个文件。不要在这份真快照上跑它。
