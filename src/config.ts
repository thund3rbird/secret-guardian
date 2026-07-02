import * as vscode from 'vscode';
import { ScanOptions } from './core/types';

export interface SgConfig {
  enable: boolean;
  maskSecrets: boolean;
  scanDelayMs: number;
  disabledRules: string[];
  ignoreGlobs: string[];
  entropyThreshold: number;
  customRulesPath: string;
  /** Optional Lemon Squeezy store base URL override for the Upgrade flow. */
  proCheckoutBaseUrl: string;
}

export function readConfig(): SgConfig {
  const c = vscode.workspace.getConfiguration('secretGuardian');
  return {
    enable: c.get<boolean>('enable', true),
    maskSecrets: c.get<boolean>('maskSecrets', true),
    scanDelayMs: c.get<number>('scanDelayMs', 400),
    disabledRules: c.get<string[]>('disabledRules', []),
    ignoreGlobs: c.get<string[]>('ignoreGlobs', []),
    entropyThreshold: c.get<number>('entropyThreshold', 3.5),
    customRulesPath: c.get<string>('customRulesPath', ''),
    proCheckoutBaseUrl: c.get<string>('pro.checkoutBaseUrl', ''),
  };
}

export function toScanOptions(c: SgConfig): ScanOptions {
  return { disabledRuleIds: c.disabledRules, entropyThreshold: c.entropyThreshold };
}
