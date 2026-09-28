# circle

一张纸上的朋友画板（paper-landing 模板）。头像一样大，按 `userId` 落在纸上，不按亲疏分圈。拖空白处移动纸面，滚轮缩放，点头像看纸条。光标不会把人推开。当前使用 **mock** 的 `data/people.json` 与 `public/avatars/`。

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
