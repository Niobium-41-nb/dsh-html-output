/**
 * Host-half tests: `html_render` validation, the receipt text, and the
 * system-prompt section contract. Pure functions only — no registry involved.
 */

import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { apply } from '../src/index.js'
import {
  DEFAULT_MAX_HTML_BYTES,
  MAX_TITLE_LENGTH,
  formatHtmlRenderResult,
  validateHtmlRender,
} from '../src/tool.js'
import { HTML_OUTPUT_SECTION } from '../src/section.js'

describe('validateHtmlRender', () => {
  it('accepts a declaration without html and returns no size', () => {
    expect(validateHtmlRender({}, DEFAULT_MAX_HTML_BYTES)).toEqual({})
    expect(validateHtmlRender({ title: '  Report  ' }, DEFAULT_MAX_HTML_BYTES)).toEqual({
      title: 'Report',
    })
  })

  it('accepts html within the cap and reports its UTF-8 byte size', () => {
    const html = '<h1>你好</h1>'
    const bytes = new TextEncoder().encode(html).length
    const receipt = validateHtmlRender({ title: 'T', html }, DEFAULT_MAX_HTML_BYTES)
    expect(receipt.bytes).toBe(bytes)
    expect(receipt.title).toBe('T')
  })

  it('rejects blank, empty, and oversized html', () => {
    expect(() => validateHtmlRender({ html: '' }, DEFAULT_MAX_HTML_BYTES)).toThrow(/non-empty string/)
    expect(() => validateHtmlRender({ html: '   ' }, DEFAULT_MAX_HTML_BYTES)).toThrow(/non-empty string/)
    expect(() => validateHtmlRender({ html: 'x'.repeat(10) }, 9)).toThrow(/9-byte cap/)
  })

  it('rejects blank and overlong titles', () => {
    expect(() => validateHtmlRender({ title: '  ' }, DEFAULT_MAX_HTML_BYTES)).toThrow(/must not be blank/)
    expect(() => validateHtmlRender(
      { title: 'x'.repeat(MAX_TITLE_LENGTH + 1) },
      DEFAULT_MAX_HTML_BYTES,
    )).toThrow(new RegExp(`at most ${MAX_TITLE_LENGTH} characters`))
  })
})

describe('formatHtmlRenderResult', () => {
  it('instructs fenced-block emission and never describes the HTML in Markdown', () => {
    const text = formatHtmlRenderResult({ ok: true, title: 'R', bytes: 42 })
    expect(text).toContain('"R"')
    expect(text).toContain('(42 bytes)')
    expect(text).toContain('fenced code block labeled html')
    expect(text).toContain('Do not describe the HTML in Markdown')
  })

  it('omits title and size when absent', () => {
    const text = formatHtmlRenderResult({ ok: true })
    expect(text).not.toContain('(')
    expect(text).not.toContain('"')
  })
})

describe('HTML_OUTPUT_SECTION', () => {
  it('teaches the fence contract and the tool', () => {
    expect(HTML_OUTPUT_SECTION).toContain('output HTML instead of Markdown')
    expect(HTML_OUTPUT_SECTION).toContain('```html')
    expect(HTML_OUTPUT_SECTION).toContain('live preview')
    expect(HTML_OUTPUT_SECTION).toContain('html_render')
    expect(HTML_OUTPUT_SECTION.length).toBeGreaterThan(400)
  })
})

describe('apply', () => {
  function makeCtx(): { ctx: Context; sections: unknown[]; tools: unknown[] } {
    const sections: unknown[] = []
    const tools: unknown[] = []
    const ctx = {
      systemPrompt: { section: (section: unknown) => { sections.push(section) } },
      tools: { register: (tool: unknown) => { tools.push(tool) } },
    } as unknown as Context
    return { ctx, sections, tools }
  }

  it('registers the prompt section and the html_render tool when enabled', () => {
    const { ctx, sections, tools } = makeCtx()
    apply(ctx, { enabled: true, promptOrder: 150, maxHtmlBytes: 4096 })
    expect(sections).toHaveLength(1)
    expect(sections[0]).toMatchObject({ name: 'html-output', order: 150 })
    expect(tools).toHaveLength(1)
    expect((tools[0] as { name?: string }).name).toBe('html_render')
  })

  it('registers nothing when disabled', () => {
    const { ctx, sections, tools } = makeCtx()
    apply(ctx, { enabled: false, promptOrder: 150, maxHtmlBytes: 4096 })
    expect(sections).toHaveLength(0)
    expect(tools).toHaveLength(0)
  })

  it('fails loud on invalid config', () => {
    const { ctx } = makeCtx()
    expect(() => apply(ctx, { enabled: true, promptOrder: -1, maxHtmlBytes: 4096 }))
      .toThrow(/promptOrder must be a non-negative integer/)
    expect(() => apply(ctx, { enabled: true, promptOrder: 150, maxHtmlBytes: 0 }))
      .toThrow(/maxHtmlBytes must be a positive integer/)
  })
})
