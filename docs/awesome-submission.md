# 提交到 awesome-dsh-plugin / dsh-market

让本插件出现在 [dsh-market](https://github.com/dsh-market/dsh-market) 的搜索与一键安装列表里的方式：向 **awesome-dsh-plugin** 的 curated 清单提交一个条目（dsh-market 本身不是目录，列表数据来自 awesome-dsh-plugin）。

## 门槛（自动检查）

1. 仓库的 `package.json`（根或 `packages/` · `plugins/` · `apps/` 子包）声明 `dsh.bundle` manifest。本仓库由 `packages/html-output` 承担：`dsh.bundle.patch → ./cordis.patch.yml`，patch 一次性插入 Host 行与浏览器行。
2. 仓库创建满 **1 天**、提交数 **≥ 10**。
3. 仓库打了 `dsh-plugin` topic（已完成）。
4. `awesome-lint` 与站点构建通过（双语描述、格式、截图校验）。

## 条目文件

在 awesome-dsh-plugin 的 `data/plugins/` 新增一个 YAML（monorepo 子包命名），文件：

```yaml
url: https://github.com/Niobium-41-nb/dsh-html-output/tree/main/packages/html-output
name: Niobium-41-nb/dsh-html-output#html-output
category: ui
description:
  en: 'Lets the agent output rich content as HTML instead of Markdown and renders the fenced html block as a sandboxed live preview in the web chat.'
  zh: '让 Agent 以 HTML 输出富文本，并在 Web 聊天中把 html 围栏渲染为沙箱实时预览。'
```

文件名：`data/plugins/Niobium-41-nb__dsh-html-output--packages-html-output.yml`。

提交步骤：

```sh
git clone git@github.com:<you>/awesome-dsh-plugin.git   # 先 fork 到自己的账号
cd awesome-dsh-plugin
git checkout -b add-dsh-html-output
# 写入上面的 YAML 文件
npm ci
node scripts/generate-readme.mjs     # 重新生成两个 README
git add -A && git commit -m "add: dsh-html-output"
git push -u origin add-dsh-html-output
# 在 GitHub 上对 awesome-dsh-plugin/awesome-dsh-plugin 开 PR
```

## 截图（可选，推荐）

在 awesome 仓库的 `data/screenshots.json` 里，以条目 URL 为 key 加入 1–8 张 GitHub 托管的图片。本仓库已提供 `assets/preview-card.svg`：

```jsonc
{
  "https://github.com/Niobium-41-nb/dsh-html-output/tree/main/packages/html-output": [
    "https://raw.githubusercontent.com/Niobium-41-nb/dsh-html-output/main/assets/preview-card.svg"
  ]
}
```

不提交截图也没关系：市场会从本仓库 README 自动抽取图片（README 已引用 `assets/preview-card.svg`）。

## 评审注意

- 描述会被维护者与代码核对，保持如实、无营销词。
- 分类选最贴合的即可（本插件为 `ui`）；维护者会微调，不会因分类打回。
- 只改自己的条目文件，不要手改生成的 README（由脚本生成）。

## 收录后

合并后 awesome-dsh-plugin.com 与 dsh-market 会在一天内自动更新，用户即可在 **设置 → 插件市场** 搜索到 `dsh-html-output` 并一键安装。
