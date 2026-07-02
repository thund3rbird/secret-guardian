import { Finding, ScanOptions, SecretRule, LineContext } from './types';
import { builtInRules } from './rules';

const IGNORE_MARKERS = [
  'secret-guardian-ignore',
  'secret-guardian:allow',
  'gitleaks:allow',
  'pragma: allowlist secret',
];

export function lineHasIgnoreMarker(line: string): boolean {
  const lower = line.toLowerCase();
  return IGNORE_MARKERS.some((m) => lower.includes(m));
}

function withScanFlags(flags: string): string {
  let f = flags;
  if (!f.includes('g')) {
    f += 'g';
  }
  if (!f.includes('d')) {
    f += 'd';
  }
  return f;
}

/**
 * Scan raw text and return findings. Pure and free of any editor dependency so
 * it can be unit-tested and reused (CLI, CI) without VS Code.
 */
export function scanText(
  text: string,
  options: ScanOptions = {},
  rules: SecretRule[] = builtInRules,
): Finding[] {
  const disabled = new Set(options.disabledRuleIds ?? []);
  const activeRules = rules.filter((r) => !disabled.has(r.id));
  const lines = text.split(/\r\n|\r|\n/);
  const findings: Finding[] = [];

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    if (lineHasIgnoreMarker(line)) {
      continue;
    }
    const ctx: LineContext = { line, lineNumber };

    for (const rule of activeRules) {
      const re = new RegExp(rule.pattern.source, withScanFlags(rule.pattern.flags));
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        if (m[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        let start = m.index;
        let end = m.index + m[0].length;
        let matchText = m[0];

        if (rule.group != null && m[rule.group] != null) {
          if (m.indices && m.indices[rule.group]) {
            [start, end] = m.indices[rule.group];
          } else {
            const idx = m[0].indexOf(m[rule.group]);
            if (idx >= 0) {
              start = m.index + idx;
              end = start + m[rule.group].length;
            }
          }
          matchText = m[rule.group];
        }

        if (rule.validate && !rule.validate(matchText, ctx, options)) {
          continue;
        }

        findings.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          line: lineNumber,
          startCol: start,
          endCol: end,
          matchText,
          message: `${rule.name}: possible ${rule.severity} secret detected (${rule.id}).`,
        });
      }
    }
  }

  return dedupe(findings);
}

/** Remove exact duplicates and generic findings that overlap a specific one. */
function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const unique: Finding[] = [];
  for (const f of findings) {
    const key = `${f.line}:${f.startCol}:${f.endCol}:${f.ruleId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(f);
  }

  const specific = unique.filter((f) => f.ruleId !== 'generic-high-entropy');
  return unique.filter((f) => {
    if (f.ruleId !== 'generic-high-entropy') {
      return true;
    }
    const overlapsSpecific = specific.some(
      (s) => s.line === f.line && f.startCol < s.endCol && s.startCol < f.endCol,
    );
    return !overlapsSpecific;
  });
}
