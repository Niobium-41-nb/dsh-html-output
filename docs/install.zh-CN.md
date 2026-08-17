# dsh-html-output 安装指南（中文）

让 DeepSeek Harness 的 Agent 用 HTML 输出富文本、并在 DSH Web GUI 里实时渲染预览。插件分两半，需要分别挂载：

| 半 | npm 包 | 作用 | 挂载位置 |
| --- | --- | --- | --- |
| Host | `dsh-html-output` | 提示词小节 + `html_render` 工具（教 Agent 输出 ````html```` 围栏） | cordis 组合（cordis.yml / patch 行） |
| Client | `dsh-client-html-output` | 聊天里检测围栏并渲染沙箱预览卡片 | web-app bundle 的浏览器行 + 依赖声明 |

## 0. 前置条件

- DeepSeek Harness **≥ 0.1.0-rc.6**（含 Web GUI；两个包针对该 API 发布）
- Node ≥ 22、pnpm（推荐 11.x）
- 插件包已发布到 npm：`dsh-html-output`（Host + bundle）、`dsh-client-html-output`（Client）

## 0.5 一键安装（推荐）

`dsh-html-output` 声明了 `dsh.bundle` manifest，安装会自动插入 Host 与浏览器两行：

```powershell
dsh plugin --profile web add dsh-html-output
```

重启 `dsh web` 即可。验证：设置 → 插件市场/清单中应出现 `dsh-html-output`；会话里让 Agent 输出带样式的 HTML 报告，消息下方会出现「HTML 渲染输出」预览卡片。下面的手动步骤仅在需要精细控制配置时使用。

## 1. 安装包

### 方案 A：从 npm 安装（推荐）

在 DSH 实例的 profile 目录（例如 `E:\dsh\profiles\desktop`）或源码 checkout 的 workspace 根目录执行：

```powershell
pnpm add dsh-html-output dsh-client-html-output
```

### 方案 B：本地源码构建（开发/联调）

```powershell
git clone https://github.com/Niobium-41-nb/dsh-html-output.git
cd dsh-html-output
pnpm install
pnpm build            # 产出 packages/html-output/lib 与 packages/ui-html-output/lib
pnpm test             # 可选：跑单元测试（29 项）
```

源码接入时，把 `packages/html-output` 与 `packages/ui-html-output` 用 `pnpm add file:<路径>`（或 `pnpm link`）装进目标 workspace。

## 2. 挂载 Host 半（Agent 学会输出 HTML）

在运行组合的 `cordis.yml`（顶层数组）中加一行：

```yaml
- name: dsh-html-output
  config:
    enabled: true
    promptOrder: 150
    maxHtmlBytes: 524288
```

| 配置项 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 是否注册提示词小节与 `html_render` 工具 |
| `promptOrder` | `150` | 系统提示词小节顺序（工具指导带 100–199） |
| `maxHtmlBytes` | `524288` | `html_render` 单次校验的 HTML 大小上限（超限建议写文件） |

> 使用 profile 的 patch 层（`cordis.patch.yml`）时用 insert 语法：`- insert:\n  - name: dsh-html-output`，并在行内带 `config`。

## 3. 挂载 Client 半（GUI 渲染 HTML 预览）

### 3.1 源码 checkout 方式（推荐，机制已验证）

**第 1 步**：在 `packages/bundle/web-app/cordis.patch.yml` 的 `- insert:` 浏览器行列表里，仿照 `ui-trajectory` 加一行：

```yaml
    - id: ui-html-output
      name: dsh-client-html-output
```

**第 2 步**：在 `packages/bundle/web-app/package.json` 的 `dependencies` 里声明该包（bundle 行名必须能被依赖树解析）：

```json
"dependencies": {
  "dsh-client-html-output": "^0.1.0"
}
```

**第 3 步**：重装并构建：

```powershell
pnpm install
pnpm build:web        # 或按你的流程重新构建 web 产物
```

### 3.2 已安装 profile 方式（npm 版 bundle）

profile 的 `cordis.patch.yml` 在 bundle 层之后应用，可以插入浏览器行：

```yaml
- insert:
    - id: ui-html-output
      name: dsh-client-html-output
```

同时确保 `dsh-client-html-output` 在 bundle/profile 的依赖树里（`pnpm add dsh-client-html-output`），因为浏览器行名通过依赖树解析。装好后重启 `dsh` 并刷新页面。

> 说明：若你的部署用 `@deepseek-ai/dsh-web-app` 之类的 npm bundle 且其内置 `cordis.patch.yml` 不含该行，优先用 profile patch 插入；行名解析依赖包被实际安装，验证见第 4 节。

## 4. 重启与验证

重启 `dsh`（web 服务），然后逐项确认：

1. **Host 生效**：在会话里让 Agent「输出一个带样式的 HTML 报告」，它应产出 ````html```` 围栏（而不是把 HTML 当代码展示）；或检查工具清单里出现 `html_render`。
2. **Client bundle 被加载**：浏览器开发者工具 → Network，应看到请求 `/plugins/dsh-client-html-output/client.js`。
3. **预览卡片出现**：收尾助手消息含 ````html```` 围栏（或 `<!--dsh-html-->` 标记）时，消息下方出现「HTML 渲染输出」卡片：沙箱 iframe 预览、查看源码、在新标签打开、复制 HTML。
4. **插件清单**（可选）：Web 设置 → 插件清单页面应列出 `dsh-client-html-output`。

## 5. 常见问题

| 现象 | 排查 |
| --- | --- |
| 预览卡片不出现 | 确认围栏语言是 `html`（` ```html `）且位于**收尾**助手消息；预览只对已结束的 turn 渲染；确认第 3 步的 bundle 行 + 依赖都完成并重启 |
| client.js 未被加载 | bundle 行名必须能通过依赖树解析到包；检查 `pnpm install` 后包是否在 node_modules |
| 预览空白/脚本不执行 | 预览 iframe 只开放 `allow-scripts`（安全隔离）；需要读取本地文件、外部网络资源、`localStorage` 的 HTML 会受限——这是设计行为 |
| `html_render` 不可见 | 确认 `enabled: true`；确认组合里 `systemPrompt` / `tools` 服务就绪（插件 `inject` 依赖它们） |
| 大小超限报错 | `html_render` 对超 `maxHtmlBytes` 的交付报错，提示改为写文件再引用 |

## 6. 卸载

- 删除第 2 节的 host 行、第 3 节的 bundle 行与依赖声明；
- 重新 `pnpm install`（视部署形态）并重启；
- 移除 npm 包：`pnpm remove dsh-html-output dsh-client-html-output`。

## 附：使用示例

````markdown
统计报表如下。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>销售报表</title>
<style>table{border-collapse:collapse}td,th{border:1px solid #999;padding:6px}</style>
</head>
<body><table>…</table></body>
</html>
```
````
