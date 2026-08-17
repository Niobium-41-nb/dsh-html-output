/**
 * Node half of dsh-client-html-output: browser-only plugin, never loaded by
 * the host; the package exists for the web GUI's client bundle route.
 */

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-client-html-output'

/** No-op node half. */
export function apply(): void {}
