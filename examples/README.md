# 示例

`report.html` 是一个可供 Agent 输出的完整 HTML 文档示例：装上插件后，让 Agent「输出一份分渠道销售报表」，它就会以 ````html```` 围栏产出类似内容，聊天界面会在消息下方直接渲染。

````markdown
报表如下。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>销售报表</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }
    table { border-collapse: collapse; width: 100%; max-width: 480px; }
    th, td { border: 1px solid #d8dde6; padding: 8px 12px; text-align: left; }
    th { background: #eef1f6; }
    .total { font-weight: 700; }
  </style>
</head>
<body>
  <h1>销售报表</h1>
  <p>2026 年 8 月 · 分渠道汇总</p>
  <table>
    <tr><th>渠道</th><th>销售额</th><th>占比</th></tr>
    <tr><td>线上</td><td>¥ 128,400</td><td>62%</td></tr>
    <tr><td>门店</td><td>¥ 58,600</td><td>28%</td></tr>
    <tr><td>分销</td><td>¥ 20,700</td><td>10%</td></tr>
    <tr class="total"><td>合计</td><td>¥ 207,700</td><td>100%</td></tr>
  </table>
</body>
</html>
```
````
