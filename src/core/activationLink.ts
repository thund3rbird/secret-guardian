/**
 * Pure parsing for the Secret Guardian activation deep link (no `vscode`).
 *
 * The extension registers a URI handler for:
 *   vscode://thund3rbird.secret-guardian/activate?key=<LICENSE_KEY>
 * so a post-purchase link activates Pro in one click — no copy-paste of the key.
 *
 * Kept vscode-free so it can be unit-tested with the plain Node test runner.
 */
export function parseActivationKey(path: string, query: string): string | null {
  const route = path.replace(/^\/+/, '').toLowerCase();
  if (route !== 'activate') {
    return null;
  }
  const key = new URLSearchParams(query).get('key');
  const trimmed = (key ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}
