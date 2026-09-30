# `data/people.json`

站点构建时只读此文件（与 `public/avatars/` 中的头像路径）。画板只显示 `status` 为 `mutual` 且未隐藏的人。当前文件里还留着 2026-09-28 的快照，其中有关注了 froQ 但 froQ 没有回关的人；这些人不会画出来。每周一 04:20 UTC，`.github/workflows/refresh-circle.yml` 用 SocialData 重拉关注者与正在关注的人，只保留两边都有的互关，写回这个文件。仓库需要 secret `SOCIALDATA_API_KEY`。余额不足时这次跳过，不把任务标成失败。

第一次跑只记下时间，不回头重扫互动，文件里已有的 `interactions` 留着。之后每次只搜上次记下的时间之后、froQ 发出的和提到 froQ 的帖，把回复、引用、@ 加到对应互关的 `interactions` 上。已经计过的帖子 id 写在 `data/sync.json`，同一条不会再加一次。头像不下载进仓库，只把 X 的图片地址写进 `avatar`，页面打开时由浏览器去取。这次快照里已经缓存的 `public/avatars/` 仍给当前文件用，下次任务跑完就会换成远程地址。

`data/hidden.json` 是一串 user id。出现在里面的人不会被每周任务加回来，也不会上墙。

`scripts/generate-mock-circle.mjs` 会用虚构名单覆盖 `people.json`。不要在这份真名单上跑它。备注没有写入。

## 顶层结构

| 字段      | 类型   | 说明                                                   |
| --------- | ------ | ------------------------------------------------------ |
| `version` | `1`    | 格式版本                                               |
| `center`  | object | froQ 的名字和 handle，仅作数据归属。画板不渲染这张头像 |
| `people`  | array  | 成员列表                                               |

## `people[]` 字段

| 字段           | 类型                                                 | 说明                                                         |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `name`         | string                                               | 显示名                                                       |
| `handle`       | string                                               | X handle，不带 `@`                                           |
| `userId`       | string                                               | X user id，改名后对齐同一人                                  |
| `avatar`       | string                                               | 头像地址。远程 URL，或快照里的 `/avatars/{userId}.jpg`       |
| `status`       | `mutual` \| `followsMe` \| `iFollow` \| `unfollowed` | 关注状态                                                     |
| `firstSeen`    | string (ISO date)                                    | 首次出现在快照的日期                                         |
| `unfollowedAt` | string \| null                                       | 取关日                                                       |
| `hidden`       | boolean                                              | `true` 则不上墙、不参与渲染                                  |
| `ring`         | `auto` \| `1` \| `2` \| `3` \| `4`                   | 数据管线可保留。站点不读取、不展示、不参与摆放               |
| `platforms`    | `{ name, url }[]`                                    | 其他平台链接                                                 |
| `impression`   | string                                               | 我对这个人写下的句子。空着时笔记用按 userId 固定的等候句     |
| `aboutMe`      | string，可省略                                       | 这个人写给我的句子。空着或没有该字段时，对应标签不可点       |
| `timeline`     | `{ date, text }[]`                                   | 时间线                                                       |
| `pinnedPosts`  | `{ url, text, date, images? }[]`                     | 精选帖子静态引用                                             |
| `interactions` | number                                               | 回复、引用、@ 的合计，从 2026-08-21 的快照累加。决定头像大小 |

TypeScript 类型见 `shared/circle/types.ts`。每周合并逻辑见 `shared/circle/sync.ts`。
