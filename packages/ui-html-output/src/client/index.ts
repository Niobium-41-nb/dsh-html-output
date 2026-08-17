/**
 * Browser half of dsh-client-html-output: register the turn-tail preview that
 * renders fenced html blocks in assistant messages as sandboxed live previews.
 */

import type { Context } from '@deepseek-ai/cordis'
// Type-only: pulls the SlotMap row and owner currency the register calls need.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { HtmlOutputOwner } from './extract.js'
import { selectHtmlOutput } from './extract.js'
import { HtmlOutputTail } from './HtmlOutputTail.js'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-client-html-output'

/** Required services: the slot registry. */
export const inject = ['slots']

/**
 * Register the turn-tail chain entry. The registration rides
 * `ctx.slots.inject` so it waits on the ui-conversation declaration, removes
 * the contribution when that declaration collapses, and reruns after
 * redeclaration; the entry's select declines every turn without an HTML
 * delivery, so untouched conversations render nothing extra.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register(
    {
      name: 'conversation.chat.turnTail',
      select: (owner: HtmlOutputOwner) => selectHtmlOutput(owner),
    },
    HtmlOutputTail,
  ))
}
