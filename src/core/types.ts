export type Severity = 'critical' | 'high' | 'medium';
export type Tier = 'free' | 'pro';

export interface LineContext {
  line: string;
  lineNumber: number; // 0-based
}

export interface ScanOptions {
  disabledRuleIds?: string[];
  entropyThreshold?: number;
}

export interface SecretRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  tier: Tier;
  /** Detection pattern. The scanner forces the `g` and `d` flags on. */
  pattern: RegExp;
  /** If set, the capture group whose span is the actual secret (for masking). */
  group?: number;
  /** Optional secondary check to reduce false positives. Return true to keep. */
  validate?: (matchText: string, ctx: LineContext, options: ScanOptions) => boolean;
}

export interface Finding {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  line: number; // 0-based
  startCol: number; // 0-based, inclusive
  endCol: number; // 0-based, exclusive
  matchText: string;
  message: string;
}
