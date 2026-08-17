// @vitest-environment jsdom
/**
 * Component tests for the HTML preview card: sandboxed iframe rendering,
 * source/preview toggle, copy, and open-in-new-tab actions.
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HtmlOutputTail, PREVIEW_HEIGHT, type HtmlOutputTailProps } from '../src/client/HtmlOutputTail.js'
import { wrapHtmlDocument } from '../src/client/html.js'

const SAMPLE_HTML = '<!DOCTYPE html><html><head><title>报告</title></head><body><h1>你好</h1></body></html>'

function makeProps(html: string, title?: string): HtmlOutputTailProps {
  return {
    matched: { html, ...title !== undefined ? { title } : {}, bytes: html.length },
  } as unknown as HtmlOutputTailProps
}

describe('wrapHtmlDocument', () => {
  it('passes full documents through untouched', () => {
    expect(wrapHtmlDocument(SAMPLE_HTML)).toBe(SAMPLE_HTML)
  })

  it('wraps fragments into a standalone document', () => {
    const wrapped = wrapHtmlDocument('<h1>Hi</h1>')
    expect(wrapped).toMatch(/^<!DOCTYPE html>/)
    expect(wrapped).toContain('<h1>Hi</h1>')
    expect(wrapped).toContain('</html>')
  })
})

describe('HtmlOutputTail', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() })
    vi.stubGlobal('open', vi.fn())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('renders a sandboxed iframe preview with the wrapped document', () => {
    render(<HtmlOutputTail {...makeProps(SAMPLE_HTML, '报告')} />)
    const frame = screen.getByTitle('报告') as HTMLIFrameElement
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.getAttribute('srcdoc')).toBe(SAMPLE_HTML)
    expect(frame.style.height).toBe(`${PREVIEW_HEIGHT}px`)
  })

  it('falls back to a generic title without an extracted one', () => {
    render(<HtmlOutputTail {...makeProps(SAMPLE_HTML)} />)
    expect(screen.getByText('HTML 输出')).toBeTruthy()
  })

  it('toggles between the rendered preview and the raw source', () => {
    render(<HtmlOutputTail {...makeProps(SAMPLE_HTML)} />)
    fireEvent.click(screen.getByText('查看源码'))
    expect(screen.getByText(SAMPLE_HTML)).toBeTruthy()
    expect(screen.queryByTitle('HTML 输出预览')).toBeNull()
    fireEvent.click(screen.getByText('渲染预览'))
    expect(screen.getByTitle('HTML 输出预览')).toBeTruthy()
  })

  it('copies the html through the clipboard API and shows feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(<HtmlOutputTail {...makeProps(SAMPLE_HTML)} />)
    fireEvent.click(screen.getByText('复制 HTML'))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(writeText).toHaveBeenCalledWith(SAMPLE_HTML)
    expect(screen.getByText('已复制')).toBeTruthy()
    act(() => { vi.runAllTimers() })
    expect(screen.getByText('复制 HTML')).toBeTruthy()
  })

  it('opens the html in a new tab from a blob URL', () => {
    render(<HtmlOutputTail {...makeProps(SAMPLE_HTML)} />)
    fireEvent.click(screen.getByText('在新标签打开'))
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(window.open).toHaveBeenCalledWith('blob:preview', '_blank', 'noopener')
  })
})
