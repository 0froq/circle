# circle

一张纸上的朋友画板。底是 paper-landing 的纸面，鼠标不着墨，圆不缩放也不移动。头像齐了才一起出现，也不能被选中。悬停时其余头像降低饱和度并变淡；当前头像小于 96px 才把图片放大到这个尺寸，热区仍是原来的圆。点头像，屏幕中间摊开一张纸条：「我想说的」和「TA 想说的」。还没写过的，按 id 固定显示一句等候的话。在纸条外滚动鼠标会收起，在纸条里滚动则翻笔记本身。暗色纸面只有斑点，没有横纹。圆排成 GitHub Sponsors 那种打包。头像大小按近 90 天的互动量：回复、引用和 @ 越多越大，最大的靠近中间。没有互动的头像一样小。画板上没有 froQ 自己的头像。点头像看纸条。画板只放互关。`data/people.json` 里 2026-09-28 的快照还留着单向关注，页面不画他们。每周一，GitHub Action 用 SocialData 重拉名单，只写入互关，并把这一周新的回复、引用和 @ 加进互动数。secret 是 `SOCIALDATA_API_KEY`。每周任务不把头像文件提交进仓库，只更新图片地址。现在这批头像还在 `public/avatars/`。

## 本地运行

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm generate   # 静态导出到 .output/public
pnpm test       # 摆放与头像大小
pnpm lint
pnpm typecheck
```

## 内容在哪里

| 路径 | 作用 |
| --- | --- |
| `data/people.json` | 成员数据（构建时读取，页面只画互关） |
| `data/hidden.json` | 不要再出现的 user id |
| `data/sync.json` | 每周任务写下的时间与已计帖子 id（第一次跑之后才有） |
| `data/README.md` | JSON 字段说明 |
| `public/avatars/` | 这一次快照的头像。之后的名单改用远程地址 |
| `shared/circle/` | 类型、互关合并与画板摆放 |
| `.github/workflows/refresh-circle.yml` | 每周一重拉互关 |
| `app/components/circle/` | 画板、纸条、名单 |
| `app/pages/index.vue` | 首页（英文默认路由 `/`） |
| `app/pages/zh/index.vue` | 中文路由 `/zh` |

## 占位项

- 「TA 想说的」还是空的，标签不可点。「我想说的」空着时，显示按 userId 固定的等候句
- 互动数从 2026-08-21 起累加。每周任务第一次跑不重扫更早的帖
- `product.install.href` 指向 `/`，避免模板「安装」遮罩

## 许可

手写字体 EMS Allure（SIL OFL 1.1），见 `app/kit/hand-font.ts`。
