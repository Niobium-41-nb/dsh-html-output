/**
 * Pure extraction tests: fence/marker detection, title derivation, and the
 * turn-tail selector over a synthetic turn. No React, no browser.
 */

import { describe, expect, it } from 'vitest'
import type { TurnLocation } from '@deepseek-ai/dsh-client-runtime/client'
import {
  closingAssistantText,
  extractHtmlFromText,
  extractTitle,
  selectHtmlOutput,
  type HtmlOutputOwner,
} from '../src/client/extract.js'

const FENCE_OPEN = '```html\n'
const FENCE_CLOSE = '\n```'

function step(blocks: ReadonlyArray<{ kind: 'text'; text: string }>): unknown {
  return {
    data: {
      get: (key: string) => (key === 'assistant-step' ? { blocks } : undefined),
    },
  }
}

function turn(steps: unknown[]): TurnLocation {
  return { turn: 0, start: undefined, end: undefined, status: 'closed', steps, data: { get: () => undefined } } as unknown as TurnLocation
}

describe('extractHtmlFromText', () => {
  it('extracts a fenced html block', () => {
    const result = extractHtmlFromText(`报告如下。\n\n${FENCE_OPEN}<h1>Hello</h1>${FENCE_CLOSE}`)
    expect(result).toEqual({ html: '<h1>Hello</h1>', mode: 'fence' })
  })

  it('takes the LAST non-empty fenced html block', () => {
    const text = `${FENCE_OPEN}<p>first</p>${FENCE_CLOSE}\n\n${FENCE_OPEN}<p>second</p>${FENCE_CLOSE}`
    expect(extractHtmlFromText(text)).toEqual({ html: '<p>second</p>', mode: 'fence' })
  })

  it('prefers the marker form and treats everything after it as html', () => {
    const text = `说明。\n\n${FENCE_OPEN}<p>example only</p>${FENCE_CLOSE}\n\n<!--dsh-html-->\n<h1>Real</h1>`
    expect(extractHtmlFromText(text)).toEqual({ html: '<h1>Real</h1>', mode: 'marker' })
  })

  it('ignores empty fences and returns null without a delivery', () => {
    expect(extractHtmlFromText(`${FENCE_OPEN}${FENCE_CLOSE}`)).toBeNull()
    expect(extractHtmlFromText('plain markdown, no html')).toBeNull()
    expect(extractHtmlFromText('')).toBeNull()
  })

  it('tolerates fence attributes and windows line endings', () => {
    const text = '```html title="报告"\r\n<div>ok</div>\r\n```'
    expect(extractHtmlFromText(text)).toEqual({ html: '<div>ok</div>', mode: 'fence' })
  })

  it('ignores example fences before a marker-form delivery', () => {
    const text = `模板示例：\n${FENCE_OPEN}<p>template</p>${FENCE_CLOSE}\n\n正式输出：\n<!--dsh-html-->\n<section>real</section>`
    expect(extractHtmlFromText(text)).toEqual({ html: '<section>real</section>', mode: 'marker' })
  })

  it('picks the last fence even when an earlier fence is empty', () => {
    const text = `${FENCE_OPEN}${FENCE_CLOSE}\n\n${FENCE_OPEN}<p>final</p>${FENCE_CLOSE}`
    expect(extractHtmlFromText(text)).toEqual({ html: '<p>final</p>', mode: 'fence' })
  })

  it('handles nested fences inside the html body', () => {
    const text = `${FENCE_OPEN}<pre>\`\`\`js\ncode\n\`\`\`</pre>${FENCE_CLOSE}`
    const result = extractHtmlFromText(text)
    expect(result?.html).toBe('<pre>```js\ncode\n```</pre>')
  })

  it('keeps doctype and inline scripts intact in the extraction', () => {
    const html = '<!DOCTYPE html><html><body><script>document.title = "a<b";</script></body></html>'
    expect(extractHtmlFromText(`${FENCE_OPEN}${html}${FENCE_CLOSE}`)?.html).toBe(html)
  })
})

describe('extractTitle', () => {
  it('derives the title from <title>', () => {
    expect(extractTitle('<html><head><title>  月度报告  </title></head></html>')).toBe('月度报告')
  })

  it('falls back to the first <h1> and strips nested tags', () => {
    expect(extractTitle('<body><h1>Hello <b>World</b></h1></body>')).toBe('Hello World')
  })

  it('returns undefined without title or h1, and caps long titles', () => {
    expect(extractTitle('<p>no heading</p>')).toBeUndefined()
    expect(extractTitle(`<title>${'x'.repeat(120)}</title>`)).toMatch(/…$/)
    expect(extractTitle('<title>x</title>')).toHaveLength(1)
  })
})

describe('closingAssistantText', () => {
  it('concatenates text blocks of every assistant step in order', () => {
    const t = turn([step([{ kind: 'text', text: 'a' }]), step([{ kind: 'text', text: 'b' }])])
    expect(closingAssistantText(t)).toBe('a\nb')
  })

  it('skips steps without assistant-step data', () => {
    const t = turn([step([{ kind: 'text', text: 'a' }]), { data: { get: () => undefined } }])
    expect(closingAssistantText(t)).toBe('a')
  })
})

describe('selectHtmlOutput', () => {
  it('carries the html, title, and byte size for a fenced delivery', () => {
    const t = turn([step([{ kind: 'text', text: `开始。\n${FENCE_OPEN}<title>T</title><h1>Hi</h1>${FENCE_CLOSE}` }])])
    const owner = { turn: t, seq: 5, openFile: () => undefined } as unknown as HtmlOutputOwner
    const match = selectHtmlOutput(owner)
    expect(match).not.toBeNull()
    expect(match?.html).toBe('<title>T</title><h1>Hi</h1>')
    expect(match?.title).toBe('T')
    expect(match?.bytes).toBe(new TextEncoder().encode(match!.html).length)
  })

  it('declines turns without a delivery', () => {
    const t = turn([step([{ kind: 'text', text: 'plain text only' }])])
    const owner = { turn: t, seq: 1, openFile: () => undefined } as unknown as HtmlOutputOwner
    expect(selectHtmlOutput(owner)).toBeNull()
  })
})
