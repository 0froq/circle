# circle

一张纸上的朋友画板。底是 paper-landing 的纸面，鼠标不着墨，圆不缩放也不移动。头像齐了才一起出现，也不能被选中。悬停时其余头像降低饱和度并变淡；当前头像小于 96px 才把图片放大到这个尺寸，热区仍是原来的圆。点头像，屏幕中间摊开一张纸条。暗色纸面只有斑点，没有横纹。圆排成 GitHub Sponsors 那种打包。头像大小按近 90 天的互动量：回复、引用和 @ 越多越大，最大的靠近中间。没有互动的头像一样小。画板上没有 froQ 自己的头像。点头像看纸条。`data/people.json` 与 `public/avatars/` 是 Notion Circle 的 2026-09-28 快照，互动数来自 2026-08-21 到 2026-09-28 的 SocialData 搜索。

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
| `data/people.json` | 成员数据（构建时读取） |
| `data/README.md` | JSON 字段说明 |
| `public/avatars/` | 头像文件 |
| `shared/circle/` | 类型与画板摆放 |
| `app/components/circle/` | 画板、纸条、名单 |
| `app/pages/index.vue` | 首页（英文默认路由 `/`） |
| `app/pages/zh/index.vue` | 中文路由 `/zh` |

## 占位项

- 公众号链接、收益分享文案为明确标注的占位
- 印象、时间线、精选帖子在这次快照里是空的
- 互动数是这一次 SocialData 搜索的结果，还没写回 Notion
- `product.install.href` 指向 `/`，避免模板「安装」遮罩

## 许可

手写字体 EMS Allure（SIL OFL 1.1），见 `app/kit/hand-font.ts`。
