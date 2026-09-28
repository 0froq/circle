# circle · 朋友圈星图

froQ 的朋友圈同心圆星图站点（paper-landing 模板 + 纸感 kit）。当前使用 **mock** 的 `data/people.json` 与 `public/avatars/` 占位头像，不接 Notion / X。

参考视觉：[cut-noodle.com/x-circle](https://cut-noodle.com/x-circle)

## 本地运行

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm generate   # 静态导出到 .output/public
pnpm test       # 圈层算法单测
pnpm lint
pnpm typecheck
```

## 内容在哪里

| 路径 | 作用 |
| --- | --- |
| `data/people.json` | 成员数据（构建时读取） |
| `data/README.md` | JSON 字段说明 |
| `public/avatars/` | 头像文件 |
| `shared/circle/` | 圈层算法、布局、类型 |
| `app/components/circle/` | 星图、卡片、无障碍列表 |
| `app/pages/index.vue` | 首页（英文默认路由 `/`） |
| `app/pages/zh/index.vue` | 中文路由 `/zh` |

重新生成假数据：

```bash
node scripts/generate-mock-circle.mjs
```

## 占位项

- 公众号链接、收益分享文案为明确标注的占位
- 成员姓名 / handle / 印象均为虚构 mock
- `product.install.href` 指向 `/`，避免模板「安装」遮罩

## 许可

手写字体 EMS Allure（SIL OFL 1.1），见 `app/kit/hand-font.ts`。
