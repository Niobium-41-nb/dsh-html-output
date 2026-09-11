/**
 * Pure extraction of the HTML delivery from a closed turn's closing assistant
 * message. No React, no ctx — unit-testable and replayable.
 */

// TurnLocation moved out of the removed @deepseek-ai/dsh-client-runtime: the
// conversation contract now lives in the ui-conversation client entry.
import type { TurnLocation } from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: the `assistant-step` conversation data scope is declared by the
// chat client entry (its ConversationStepDataMap merge), so this import is what
// types the `data.get('assistant-step')` reads below.
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'

/** Match carrier delivered to the turn-tail renderer. */
export interface HtmlOutputMatch {
  /** The extracted HTML body (a full document or a fragment). */
  html: string
  /** Optional title derived from <title> or the first <h1>. */
  title?: string
  /** UTF-8 byte size of the extracted HTML. */
  bytes: number
}

/** Owner currency of the `conversation.chat.turnTail` chain (structural mirror). */
export interface HtmlOutputOwner {
  turn: TurnLocation
  seq: number
  openFile: (path: string) => void
}

/**
 * Fenced html block: ````html` (with optional attributes), then any text until
 * a closing fence that ends its own line. Requiring the closing fence to sit
 * at end-of-line keeps nested ```` ``` ```` literals inside the html body (e.g.
 * a `<pre>` showing code) from truncating the extraction.
 */
const HTML_FENCE_RE = /```html[^\r\n]*\r?\n([\s\S]*?)\r?\n```(?=[ \t]*(?:\r?\n|$))/g

/** Explicit marker: everything after the first occurrence is raw HTML. */
const HTML_MARKER = '<!--dsh-html-->'

const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i
const H1_RE = /<h1[^>]*>([\s\S]*?)<\/h1>/i
const TAG_RE = /<[^>]*>/g

/**
 * Extract the HTML delivery from assistant text. The marker form wins over the
 * fence form; within fences, the LAST non-empty fenced html block wins.
 * @param text - the combined text blocks of the closing assistant message.
 * @returns the extracted html and its mode, or null when no delivery exists.
 */
export function extractHtmlFromText(text: string): { html: string; mode: 'fence' | 'marker' } | null {
  const trimmed = text.trim()
  const markerAt = trimmed.indexOf(HTML_MARKER)
  if (markerAt >= 0) {
    const html = trimmed.slice(markerAt + HTML_MARKER.length).trim()
    if (html.length > 0) return { html, mode: 'marker' }
  }
  let best: string | null = null
  HTML_FENCE_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = HTML_FENCE_RE.exec(text)) !== null) {
    const html = (match[1] ?? '').trim()
    if (html.length > 0) best = html
  }
  return best === null ? null : { html: best, mode: 'fence' }
}

/**
 * Collect the text blocks of every assistant step in the turn, in order. The
 * closing message's fences are the last ones in the combined text.
 * @param turn - the engine-owned closing turn.
 * @returns the combined assistant text.
 */
export function closingAssistantText(turn: TurnLocation): string {
  const parts: string[] = []
  for (const step of turn.steps) {
    const data = step.data.get('assistant-step')
    if (data === undefined) continue
    for (const block of data.blocks) {
      if (block.kind === 'text') parts.push(block.text)
    }
  }
  return parts.join('\n')
}

/**
 * Derive a short display title from the HTML document itself.
 * @param html - the extracted HTML body.
 * @returns the <title> (or first <h1>) text with tags stripped, capped at 80
 *   characters, or undefined when neither exists.
 */
export function extractTitle(html: string): string | undefined {
  const raw = TITLE_RE.exec(html)?.[1] ?? H1_RE.exec(html)?.[1]
  if (raw === undefined) return undefined
  const cleaned = raw.replace(TAG_RE, '').replace(/\s+/g, ' ').trim()
  if (cleaned.length === 0) return undefined
  return cleaned.length > 80 ? `${cleaned.slice(0, 80)}…` : cleaned
}

/**
 * The turn-tail chain selector: match turns whose closing assistant message
 * carries an HTML delivery, and carry the extracted html to the renderer.
 * Pure and side-effect-free; an all-declined chain renders nothing.
 * @param owner - the turn-tail owner currency.
 * @returns the HTML match, or null to decline.
 */
export function selectHtmlOutput(owner: HtmlOutputOwner): HtmlOutputMatch | null {
  const found = extractHtmlFromText(closingAssistantText(owner.turn))
  if (found === null) return null
  const title = extractTitle(found.html)
  return {
    html: found.html,
    ...title !== undefined ? { title } : {},
    bytes: new TextEncoder().encode(found.html).length,
  }
}
