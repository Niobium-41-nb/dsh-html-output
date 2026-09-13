# dsh-client-html-output

[`dsh-html-output`](https://www.npmjs.com/package/dsh-html-output) 的 **浏览器半边**：在 DSH Web GUI
的聊天界面里，把助手消息中的 `html` 代码围栏渲染成沙箱实时预览卡片。

> **通常你不需要单独装这个包** —— 装 `dsh-html-output` 时它的 bundle patch 已经带了这一行。
> 只有手动挂载、或单独升级客户端半边时才需要直接依赖它。

## 它做什么

收尾助手消息里检测到 `html` 围栏（或 `<!--dsh-html-->` 标记）时，在这条消息下方渲染：

- **沙箱 iframe 实时渲染**：`sandbox="allow-scripts"`，**不开放** `allow-same-origin` ——
  交互 HTML 可以运行，但内容无法访问宿主页面；
- **工具栏**：渲染预览 / 查看源码、在新标签打开（blob URL）、复制 HTML；
- **标题**自动取自 `<title>` 或首个 `<h1>`。

注册在 `conversation.chat.turnTail` 链式插槽上（纯增量，不遮挡官方 UI）。没有 HTML 围栏的消息
不渲染任何东西，聊天照常。

## 安装

```sh
dsh plugin --profile web add dsh-html-output   # 推荐：Host + Client 一起装
```

单独手动挂载时，在 web-app bundle 的 `cordis.patch.yml` 中加一行：

```yaml
- id: ui-html-output
  name: dsh-client-html-output
```

并在该 bundle 的 `package.json` 依赖里加上 `dsh-client-html-output`，然后重启 `dsh web`。

## 依赖与打包

- 平台模块（`react`、`@deepseek-ai/cordis`、`dsh-client-ui-*`）保持 **external**，由 DSH 模块表提供；
  对 DSH 的依赖全部以 type-only import 引入，bundle 内不复制任何 DSH 运行时实例。
- 客户端产物是 `lib/client.js`（`window.__ModuleLoader__.load` 交接格式），由 tsdown 打成一个文件，
  入口 `./client` 由宿主解析。

## License

MIT。完整文档（架构、开发、验证）见 [仓库 README](https://github.com/Niobium-41-nb/dsh-html-output)。
