# circle

一张纸上的朋友画板（paper-landing 模板），排成 GitHub Sponsors 那种圆打包。头像大小只为构图：按 `userId` 的稳定散列，大的靠近中间。不按互动、早晚或关注状态分等级。画板上没有 froQ 自己的头像。点头像看纸条。`data/people.json` 与 `public/avatars/` 是 Notion Circle 的 2026-09-28 快照。

## 本地运行

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm generate   # 静态导出到 .output/public
pnpm test       # 摆放：位置与分数无关
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
- 互动数全是 0：Notion 的「互动数」还没填，X 接口额度用尽，这次不能按互动改尺寸
- `product.install.href` 指向 `/`，避免模板「安装」遮罩

## 许可

手写字体 EMS Allure（SIL OFL 1.1），见 `app/kit/hand-font.ts`。
