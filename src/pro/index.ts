/**
 * FREE-build Pro stub — self-contained, contains no paid logic.
 *
 * This is the ONLY Pro module shipped in the open-source (public) repository.
 * `scripts/export-core.mjs` renames this file to `index.ts` and deletes the real
 * Pro implementation, so the free core still compiles and runs with every Pro
 * feature gated behind an upgrade prompt that points at the Marketplace.
 *
 * Pricing metadata (`pricing.ts`) and the key-format check (`licenseFormat.ts`)
 * are intentionally kept in the public build: they describe the plans and let the
 * free build show accurate upgrade info + open checkout, and they reveal nothing
 * that would help bypass licensing.
 */
import * as vscode from 'vscode';
import type { Finding, SecretRule } from '../core/types';
import { PRODUCT_LANDING_URL } from './pricing';

export {
  PRO_TIERS,
  resolveCheckoutUrl,
  isCheckoutConfigured,
  PRODUCT_LANDING_URL,
  LEMONSQUEEZY_STORE_BASE,
} from './pricing';
export type { ProTier, ProTierId } from './pricing';

// ── Custom rules (Pro) ───────────────────────────────────────────────────────

export interface CustomRulesResult {
  rules: SecretRule[];
  errors: string[];
}

export function loadCustomRules(_filePath: string): CustomRulesResult {
  return { rules: [], errors: [] };
}

export function sampleCustomRulesJson(): string {
  return '[]\n';
}

// ── Audit report (Pro) ───────────────────────────────────────────────────────

export function buildReportHtml(_results: Map<string, Finding[]>): string {
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<title>Secret Guardian Audit Report</title></head><body>' +
    '<h1>Secret Guardian — Audit Report (Pro)</h1>' +
    '<p>Exporting an audit report is a Secret Guardian Pro feature. ' +
    `Get Pro from the <a href="${PRODUCT_LANDING_URL}">VS Code Marketplace</a>.</p>` +
    '</body></html>'
  );
}

// ── CI / pre-commit export (Pro) ─────────────────────────────────────────────

export interface CiExportFile {
  label: string;
  fileName: string;
  language: string;
  content: string;
}

export function ciExportFiles(): CiExportFile[] {
  return [];
}

// ── Licensing (Pro) ──────────────────────────────────────────────────────────

export interface LicenseStatusSummary {
  pro: boolean;
  keyPresent: boolean;
  status?: string;
  expiresAt?: string | null;
  instanceId?: string;
  lastValidated?: string;
  inGrace: boolean;
}

export interface ActivationResult {
  ok: boolean;
  message: string;
}

const UPSELL =
  'This is the open-source Free build of Secret Guardian. Install “Secret Guardian” ' +
  'from the VS Code Marketplace to unlock Pro features.';

/**
 * Free-build license gate: Pro is always locked. It never contacts a licensing
 * server; it simply guides users to the Marketplace listing.
 */
export class LicenseManager {
  private readonly emitter = new vscode.EventEmitter<boolean>();
  readonly onDidChange = this.emitter.event;

  constructor(_ctx: vscode.ExtensionContext) {
    /* no stored state in the free build */
  }

  isPro(): boolean {
    return false;
  }

  async init(): Promise<void> {
    /* nothing to validate in the free build */
  }

  async activate(_rawKey: string): Promise<ActivationResult> {
    return { ok: false, message: UPSELL };
  }

  async refresh(): Promise<void> {
    /* no-op */
  }

  async deactivate(): Promise<void> {
    /* no-op */
  }

  async requirePro(feature: string): Promise<boolean> {
    const pick = await vscode.window.showInformationMessage(
      `${feature} is a Secret Guardian Pro feature.`,
      'Get Secret Guardian Pro',
    );
    if (pick) {
      await vscode.env.openExternal(vscode.Uri.parse(PRODUCT_LANDING_URL));
    }
    return false;
  }

  getStatusSummary(): LicenseStatusSummary {
    return { pro: false, keyPresent: false, inGrace: false };
  }

  dispose(): void {
    this.emitter.dispose();
  }
}
