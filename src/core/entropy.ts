/** Shannon entropy in bits per character. */
export function shannonEntropy(input: string): number {
  if (!input) {
    return 0;
  }
  const freq = new Map<string, number>();
  for (const ch of input) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  let entropy = 0;
  const len = input.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /your[_-]?(api|secret|token|key|password)/i,
  /example|sample|dummy|placeholder|changeme|change[_-]?me|replace[_-]?me|redacted|xxxxx/i,
  /^<.*>$/,
  /^\$?\{.*\}$/,
  /process\.env/i,
  /^(null|none|true|false|undefined)$/i,
];

/** Heuristic: is this value an obvious placeholder rather than a real secret? */
export function isLikelyPlaceholder(value: string): boolean {
  const v = value.trim();
  if (v.length === 0) {
    return true;
  }
  if (/^(.)\1+$/.test(v)) {
    return true; // all identical characters, e.g. "xxxxxxxx"
  }
  return PLACEHOLDER_PATTERNS.some((re) => re.test(v));
}
