/**
 * Browser helpers for the HTML preview: document wrapping and clipboard copy.
 */

/**
 * Wrap a fragment into a standalone document so it renders predictably inside
 * the preview iframe; full documents pass through untouched.
 * @param html - the extracted HTML body.
 * @returns a standalone HTML document source.
 */
export function wrapHtmlDocument(html: string): string {
  if (/<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html)) return html
  return '<!DOCTYPE html>'
    + '<html lang="zh-CN"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;line-height:1.5}</style>'
    + '</head><body>'
    + html
    + '</body></html>'
}

/**
 * Copy text to the clipboard. Prefers the async Clipboard API and falls back
 * to a hidden textarea + execCommand for older engines.
 * @param text - the text to copy.
 * @returns whether the copy is believed to have succeeded.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText !== undefined) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Clipboard API rejected (permission or unavailable); fall back below.
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    textarea.remove()
    return ok
  } catch {
    // execCommand unavailable in this engine; nothing else to try.
    return false
  }
}
