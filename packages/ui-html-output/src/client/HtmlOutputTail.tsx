/**
 * The turn-tail preview card: renders the closing assistant message's HTML
 * delivery in a sandboxed iframe, with source/copy/open-in-tab actions.
 */

import { memo, useMemo, useState } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: declares the `conversation.chat.turnTail` SlotMap row this props
// type indexes into.
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type { HtmlOutputMatch } from './extract.js'
import { copyText, wrapHtmlDocument } from './html.js'

/** Full props of the turn-tail entry: the framework standard kit plus the chain match. */
export type HtmlOutputTailProps = PropsRuntime<'conversation.chat.turnTail'> & {
  matched: HtmlOutputMatch
}

/** Preview viewport height in px; the iframe scrolls internally. */
export const PREVIEW_HEIGHT = 420

const cardStyle: React.CSSProperties = {
  margin: '12px 0',
  border: '1px solid var(--dsw-border, rgba(128,128,128,0.35))',
  borderRadius: '8px',
  overflow: 'hidden',
  background: 'var(--dsw-surface, rgba(128,128,128,0.06))',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '6px 10px',
  borderBottom: '1px solid var(--dsw-border, rgba(128,128,128,0.25))',
}

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '12px',
  color: 'inherit',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexShrink: 0,
}

const buttonStyle: React.CSSProperties = {
  border: '1px solid var(--dsw-border, rgba(128,128,128,0.45))',
  background: 'transparent',
  color: 'inherit',
  borderRadius: '6px',
  padding: '2px 8px',
  fontSize: '12px',
  cursor: 'pointer',
}

const frameStyle: React.CSSProperties = {
  width: '100%',
  height: `${PREVIEW_HEIGHT}px`,
  border: '0',
  display: 'block',
  background: '#fff',
}

const sourceStyle: React.CSSProperties = {
  margin: '0',
  padding: '12px',
  maxHeight: `${PREVIEW_HEIGHT}px`,
  overflow: 'auto',
  fontSize: '12px',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  color: 'inherit',
}

/**
 * Render one HTML delivery below its assistant message. The iframe is
 * sandboxed with `allow-scripts` only — interactive HTML runs, but the
 * document keeps an opaque origin and cannot touch the shell page.
 */
export const HtmlOutputTail = memo(function HtmlOutputTail({ matched }: HtmlOutputTailProps) {
  const [mode, setMode] = useState<'preview' | 'source'>('preview')
  const [copied, setCopied] = useState(false)
  const { html, title } = matched
  const documentSource = useMemo(() => wrapHtmlDocument(html), [html])

  const openInNewTab = (): void => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    window.open(url, '_blank', 'noopener')
    // The blob URL is only reachable from this page; revoke after a grace
    // period so the opened tab finishes loading it.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const copy = (): void => {
    void copyText(html).then((ok) => {
      if (!ok) return
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>{title ?? 'HTML 输出'}</span>
        <div style={toolbarStyle}>
          <button type="button" style={buttonStyle} onClick={() => setMode(mode === 'preview' ? 'source' : 'preview')}>
            {mode === 'preview' ? '查看源码' : '渲染预览'}
          </button>
          <button type="button" style={buttonStyle} onClick={openInNewTab}>在新标签打开</button>
          <button type="button" style={buttonStyle} onClick={copy}>{copied ? '已复制' : '复制 HTML'}</button>
        </div>
      </div>
      {mode === 'preview'
        ? (
          <iframe
            title={title ?? 'HTML 输出预览'}
            sandbox="allow-scripts"
            srcDoc={documentSource}
            style={frameStyle}
          />
        )
        : <pre style={sourceStyle}><code>{html}</code></pre>}
    </div>
  )
})
