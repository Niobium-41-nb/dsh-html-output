/**
 * dsh-html-output host half: the `html-output` cordis plugin.
 *
 * Contributes the HTML-output system-prompt section (order 150) and the
 * `html_render` tool. The browser half (`dsh-client-html-output`) renders the
 * fenced html blocks the agent emits as live previews; this half only shapes
 * and validates the model-facing contract.
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import { HTML_OUTPUT_SECTION } from './section.js'
import { applyHtmlRenderTool, DEFAULT_MAX_HTML_BYTES } from './tool.js'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'html-output'

/** Services required by the plugin. */
export const inject = ['systemPrompt', 'tools']

/** Plugin config: which HTML-output surfaces to register. */
export interface Config {
  /** Register the prompt section and the `html_render` tool. Defaults to true. */
  enabled?: boolean
  /** Order of the HTML-output system-prompt section. Defaults to 150 (tool-guidance band). */
  promptOrder?: number
  /** Cap on one validated `html_render` delivery. Defaults to 524288 (512 KiB). */
  maxHtmlBytes?: number
}

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  promptOrder: z.number().default(150),
  maxHtmlBytes: z.number().default(DEFAULT_MAX_HTML_BYTES),
})

/** Complete config after schemastery applies every field default. */
type ResolvedConfig = Required<Config>

/**
 * Register the HTML-output prompt section and tool. Both registrations ride
 * effect-scoped registries and unregister on plugin dispose.
 * @param ctx - context whose `systemPrompt` and `tools` registries receive the
 *   contributions.
 * @param config - resolved plugin config.
 */
export function apply(ctx: Context, config: Config): void {
  const resolved = config as ResolvedConfig
  if (resolved.promptOrder < 0 || !Number.isInteger(resolved.promptOrder)) {
    throw new Error('html-output: promptOrder must be a non-negative integer')
  }
  if (!Number.isInteger(resolved.maxHtmlBytes) || resolved.maxHtmlBytes < 1) {
    throw new Error('html-output: maxHtmlBytes must be a positive integer')
  }
  if (!resolved.enabled) return
  ctx.systemPrompt.section({
    name: 'html-output',
    order: resolved.promptOrder,
    text: HTML_OUTPUT_SECTION,
  })
  applyHtmlRenderTool(ctx, resolved.maxHtmlBytes)
}
