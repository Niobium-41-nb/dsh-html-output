# dsh-html-output

A DeepSeek Harness plugin that lets the agent output rich content as **HTML instead of Markdown** and renders it as a live, sandboxed preview right in the DSH web chat.

## What it does

- **Host half** (`dsh-html-output`): a system-prompt section (order 150) teaching the agent the output contract — one short sentence, then the whole HTML document in a single ````html```` fenced block, no Markdown around it — plus the `html_render` tool to declare or validate a delivery (size cap, title length).
- **Client half** (`dsh-client-html-output`): registers into the `conversation.chat.turnTail` slot (purely additive, no shipped-UI shadowing). When the closing assistant message carries an ````html```` fence (or an `<!--dsh-html-->` marker), a preview card appears below it:
  - sandboxed iframe (`sandbox="allow-scripts"`, no same-origin) rendering the HTML live;
  - toolbar: preview / source toggle, open in new tab (blob URL), copy HTML;
  - title auto-derived from `<title>` or the first `<h1>`.

The HTML lives in the assistant message itself, so replay, link-sharing, and forking stay consistent — no extra storage or events.

## Install

```sh
dsh plugin --profile web add dsh-html-output
```

Restart `dsh web`. Manual mounting steps and a full Chinese guide: [docs/install.zh-CN.md](docs/install.zh-CN.md).

## Configuration

| Field | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | register the prompt section and the `html_render` tool |
| `promptOrder` | `150` | system-prompt section order (tool-guidance band 100–199) |
| `maxHtmlBytes` | `524288` | per-delivery validation cap for `html_render` |

## Layout

```
packages/
  html-output/        # Host: prompt section + html_render tool (also the dsh.bundle)
  ui-html-output/     # Client: turn-tail HTML preview card
examples/             # sample HTML document the agent is taught to emit
```

## Development

```sh
pnpm install
pnpm typecheck
pnpm test        # 36 unit tests
pnpm build
```

The client bundle (`lib/client.js`) is emitted in the `__ModuleLoader__.load` handoff format; platform modules stay external and are served by the DSH module table. All DSH imports are type-only.

## Publish to npm

```sh
cd packages/html-output && npm publish      # host + bundle
cd ../ui-html-output && npm publish         # client
```

## License

MIT
