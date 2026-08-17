/**
 * The model-facing `html_render` tool: declare or validate an HTML delivery
 * before the agent emits the fenced block. Pure validation — no IO, no shared
 * state — so calls are concurrency-safe and need no timeout budget.
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'

/** Tool name the agent calls to declare or validate an HTML delivery. */
export const HTML_RENDER_TOOL = 'html_render'

/** Default cap on one validated delivery (512 KiB). */
export const DEFAULT_MAX_HTML_BYTES = 512 * 1024

/** Default cap on the delivery title. */
export const MAX_TITLE_LENGTH = 120

/** Model-facing arguments of `html_render`. */
export interface HtmlRenderArgs {
  /** Optional delivery title shown on the rendered preview card. */
  title?: string
  /** Optional HTML body to validate; omit to only declare a delivery. */
  html?: string
}

/** Canonical success value returned by `html_render`. */
export interface HtmlRenderValue {
  ok: true
  title?: string
  /** UTF-8 byte size, present when `html` was supplied. */
  bytes?: number
}

/**
 * Validate `html_render` arguments against the configured cap.
 * @param args - schema-validated arguments.
 * @param maxHtmlBytes - deployment cap on one validated delivery.
 * @returns the receipt fields (title and, when html was supplied, byte size).
 */
export function validateHtmlRender(args: HtmlRenderArgs, maxHtmlBytes: number): {
  title?: string
  bytes?: number
} {
  const title = args.title?.trim()
  if (title !== undefined) {
    if (title.length > MAX_TITLE_LENGTH) {
      throw new Error(
        `html_render: title must be at most ${MAX_TITLE_LENGTH} characters (received ${title.length})`,
      )
    }
    if (title.length === 0) throw new Error('html_render: title must not be blank when provided')
  }
  if (args.html === undefined) {
    return title === undefined ? {} : { title }
  }
  if (typeof args.html !== 'string' || args.html.trim().length === 0) {
    throw new Error('html_render: html must be a non-empty string')
  }
  const bytes = new TextEncoder().encode(args.html).length
  if (bytes > maxHtmlBytes) {
    throw new Error(
      `html_render: html exceeds the ${maxHtmlBytes}-byte cap (received ${bytes} bytes); write it to a file and mention the path instead`,
    )
  }
  return { ...title !== undefined ? { title } : {}, bytes }
}

/**
 * Format the model-facing tool result for a validated delivery.
 * @param value - the canonical success value.
 * @returns the receipt text that instructs the fenced-block emission.
 */
export function formatHtmlRenderResult(value: HtmlRenderValue): string {
  const size = value.bytes === undefined ? '' : ` (${value.bytes} bytes)`
  return `HTML output${value.title === undefined ? '' : ` "${value.title}"`} validated${size}. `
    + 'Now emit the HTML in your reply inside one fenced code block labeled html, preceded by at most one short sentence; '
    + 'the client renders it as a live preview. Do not describe the HTML in Markdown.'
}

/**
 * Register the `html_render` tool.
 * @param ctx - context whose `tools` registry receives the registration.
 * @param maxHtmlBytes - deployment cap applied to validated deliveries.
 */
export function applyHtmlRenderTool(ctx: Context, maxHtmlBytes: number): void {
  ctx.tools.register(defineTool({
    name: HTML_RENDER_TOOL,
    description: 'Declare or validate an HTML delivery. Call it before emitting a fenced html block in your reply, '
      + 'optionally passing the html body for size validation; the web UI renders the emitted block as a live preview.',
    parameters: {
      title: {
        type: 'string',
        description: 'Optional short delivery title (at most 120 characters), shown on the preview card.',
      },
      html: {
        type: 'string',
        description: 'Optional HTML body to validate against the deployment size cap. Omit to only declare the delivery.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          title: { type: 'string' },
          bytes: { type: 'number' },
        },
      },
      render: (_args, value) => [{ type: 'text', text: formatHtmlRenderResult(value as HtmlRenderValue) }],
    },
    isConcurrencySafe: () => true,
    async execute(args: HtmlRenderArgs) {
      return { ok: true as const, ...validateHtmlRender(args, maxHtmlBytes) }
    },
  }))
}
