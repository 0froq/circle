# `data/people.json`

站点构建时只读此文件（与 `public/avatars/` 中的头像路径）。真数据日后由 Scout 导出脚本写入；当前为 mock。

## 顶层结构

| 字段      | 类型   | 说明                                                     |
| --------- | ------ | -------------------------------------------------------- |
| `version` | `1`    | 格式版本                                                 |
| `center`  | object | 星图中心（froQ）：`name`, `handle`, `avatar`（站内路径） |
| `people`  | array  | 成员列表                                                 |

## `people[]` 字段

| 字段           | 类型                                                 | 说明                                           |
| -------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `name`         | string                                               | 显示名                                         |
| `handle`       | string                                               | X handle，不带 `@`                             |
| `userId`       | string                                               | X user id，改名后对齐同一人                    |
| `avatar`       | string                                               | 头像路径，如 `/avatars/mock_001.svg`           |
| `status`       | `mutual` \| `followsMe` \| `iFollow` \| `unfollowed` | 关注状态                                       |
| `firstSeen`    | string (ISO date)                                    | 首次出现在快照的日期                           |
| `unfollowedAt` | string \| null                                       | 取关日                                         |
| `hidden`       | boolean                                              | `true` 则不上墙、不参与渲染                    |
| `ring`         | `auto` \| `1` \| `2` \| `3` \| `4`                   | 数据管线可保留。站点不读取、不展示、不参与摆放 |
| `platforms`    | `{ name, url }[]`                                    | 其他平台链接                                   |
| `impression`   | string                                               | 手写印象（卡片内用手写体风格展示）             |
| `timeline`     | `{ date, text }[]`                                   | 时间线                                         |
| `pinnedPosts`  | `{ url, text, date, images? }[]`                     | 精选帖子静态引用                               |
| `interactions` | number                                               | 互动计数。不参与摆放或大小                     |

TypeScript 类型见 `shared/circle/types.ts`。

重新生成 mock 数据与占位头像：

```bash
node scripts/generate-mock-circle.mjs
```
