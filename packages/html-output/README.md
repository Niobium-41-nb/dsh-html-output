# dsh-html-output

让 DeepSeek Harness 的 Agent **用 HTML 输出富文本、而不是 Markdown** —— 这是它的 **Host 半边**：
一段系统提示词小节 + 一个 `html_render` 工具。浏览器半边是同仓库的
`dsh-client-html-output`（在聊天里把围栏渲染成沙箱预览），已由本包的 bundle patch 一并挂载。

```
Agent 回复 (html 围栏)
        │  dsh-client-html-output 检测到围栏
        ▼
┌──────────────────────────────────┐
│  🖥 HTML 渲染输出 [查看源码][新标签][复制] │
│  ┌────────────────────────────┐  │
│  │  沙箱 iframe 实时渲染        │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

## 它做什么

- **系统提示词小节**（order 150）：指导 Agent 在需要富文本 / 结构化 / 交互内容时改用 HTML，
  并固定输出契约 —— 一句说明在前、一个 `html` 代码围栏、不在围栏外复述 HTML。
- **`html_render` 工具**：Agent 可在落笔前声明并校验一次 HTML 交付（大小上限、标题长度）；
  校验通过后仍按契约以围栏输出，内容随会话日志持久化，回放 / 复制链接 / 分支天然一致。

## 安装

```sh
dsh plugin --profile web add dsh-html-output
```

本包声明了 `dsh.bundle` manifest，安装时会自动把 Host 行（`html-output`）与浏览器行
（`ui-html-output` → `dsh-client-html-output`）插入 profile 并带上默认配置。重启 `dsh web` 生效。

手动挂载时，在 cordis 组合里加一行：

```yaml
- name: dsh-html-output
  config:
    enabled: true
    promptOrder: 150
    maxHtmlBytes: 524288
```

## 配置

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 是否注册提示词小节与工具 |
| `promptOrder` | `150` | 系统提示词小节的顺序（工具指导带 100–199） |
| `maxHtmlBytes` | `524288` | `html_render` 单次校验的 HTML 大小上限（超限建议写文件） |

## 包结构

- `lib/index.js` — 插件入口（提示词小节 + 工具注册）。
- `lib/section.js` — 输出契约文本。
- `lib/tool.js` — `html_render` 的校验与回执（纯函数）。
- `cordis.patch.yml` — bundle patch：同时插入 Host 行与浏览器行。

## License

MIT。完整文档（架构、开发、验证）见 [仓库 README](https://github.com/Niobium-41-nb/dsh-html-output)。
