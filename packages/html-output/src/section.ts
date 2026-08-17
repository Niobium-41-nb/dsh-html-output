/**
 * HTML output mode: the system-prompt section that switches the agent from
 * Markdown to HTML for rich, structured, or interactive deliveries, and the
 * `html_render` tool that validates declared deliveries.
 */

/**
 * The HTML-output guidance contributed to every assembly at order 150.
 * Model-facing contract: rich output goes into one fenced `html` block, prose
 * stays at most one short sentence before it, and no Markdown describes the
 * HTML. The client half (`dsh-client-html-output`) renders that fence as a
 * live preview under the message.
 */
export const HTML_OUTPUT_SECTION = `# HTML output mode

When the user wants rich, structured, or interactive content — styled reports, dashboards, cards, tables, buttons, forms, charts — output HTML instead of Markdown. The web UI renders it as a live preview.

Output contract:
1. Keep any prose to at most one short sentence, placed BEFORE the HTML.
2. Emit the complete HTML document inside one fenced code block labeled html:
   \`\`\`html
   <!DOCTYPE html>
   <html lang="zh-CN"><head><meta charset="utf-8"><title>…</title>…</head><body>…</body></html>
   \`\`\`
   A full document is preferred; a self-contained fragment is acceptable.
3. Do not describe the HTML in Markdown, and do not wrap the fence in further Markdown.
4. Keep CSS and scripts inline; avoid external resources that cannot load offline.
5. For a large document (roughly over 32 KB), write it to a file and mention the path in one short sentence instead of dumping it into the chat.
6. Before emitting a delivery, you may call html_render to declare or validate it.`
