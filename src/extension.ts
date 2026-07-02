import * as vscode from 'vscode';
import { scanText } from './core/scanner';
import { builtInRules } from './core/rules';
import { Finding, SecretRule } from './core/types';
import { parseActivationKey } from './core/activationLink';
import { DiagnosticsManager } from './features/diagnostics';
import { MaskController } from './features/masking';
import { StatusBar } from './features/statusBar';
import { readConfig, toScanOptions, SgConfig } from './config';
import {
  LicenseManager,
  loadCustomRules,
  sampleCustomRulesJson,
  buildReportHtml,
  ciExportFiles,
  PRO_TIERS,
  ProTier,
  resolveCheckoutUrl,
  PRODUCT_LANDING_URL,
} from './pro';

let diagnostics: DiagnosticsManager;
let mask: MaskController;
let statusBar: StatusBar;
let license: LicenseManager;
let config: SgConfig;
let debounceTimer: NodeJS.Timeout | undefined;

const SCANNABLE_SCHEMES = new Set(['file', 'untitled']);

export function activate(context: vscode.ExtensionContext): void {
  config = readConfig();
  diagnostics = new DiagnosticsManager();
  mask = new MaskController(config.maskSecrets);
  statusBar = new StatusBar();
  license = new LicenseManager(context);
  statusBar.setPro(license.isPro());

  context.subscriptions.push(diagnostics, mask, statusBar, license);

  // React to async license changes (startup validation, activation, expiry).
  context.subscriptions.push(
    license.onDidChange((pro) => {
      statusBar.setPro(pro);
      rescanActive();
    }),
  );
  void license.init();

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!config.enable) {
        return;
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => scanDocument(e.document), config.scanDelayMs);
    }),
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (config.enable) {
        scanDocument(doc);
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((ed) => {
      if (ed && config.enable) {
        scanDocument(ed.document);
      }
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('secretGuardian')) {
        config = readConfig();
        mask.setEnabled(config.maskSecrets);
        rescanActive();
      }
    }),
  );

  registerCommands(context);
  registerUriHandler(context);
  rescanActive();
}

export function deactivate(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
}

function rescanActive(): void {
  const editor = vscode.window.activeTextEditor;
  if (editor && config.enable) {
    scanDocument(editor.document);
  }
}

function activeRules(): SecretRule[] {
  if (license.isPro() && config.customRulesPath) {
    const { rules, errors } = loadCustomRules(config.customRulesPath);
    if (errors.length > 0) {
      vscode.window.showWarningMessage(
        `Secret Guardian: ${errors.length} custom rule issue(s) — ${errors[0]}`,
      );
    }
    return [...builtInRules, ...rules];
  }
  return builtInRules;
}

function scanDocument(doc: vscode.TextDocument): Finding[] {
  if (!config.enable || !SCANNABLE_SCHEMES.has(doc.uri.scheme)) {
    return [];
  }
  const findings = scanText(doc.getText(), toScanOptions(config), activeRules());
  diagnostics.update(doc.uri, findings);

  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.uri.toString() === doc.uri.toString()) {
    mask.apply(editor, findings);
    statusBar.render(findings.length);
  }
  return findings;
}

async function scanWorkspaceCommand(silent = false): Promise<Map<string, Finding[]>> {
  const results = new Map<string, Finding[]>();
  const exclude =
    config.ignoreGlobs.length > 0 ? `{${config.ignoreGlobs.join(',')}}` : undefined;
  const files = await vscode.workspace.findFiles('**/*', exclude, 5000);
  let totalSecrets = 0;

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Secret Guardian: scanning workspace…' },
    async (progress) => {
      let processed = 0;
      for (const uri of files) {
        processed++;
        try {
          const bytes = await vscode.workspace.fs.readFile(uri);
          if (bytes.length > 1_000_000) {
            continue;
          }
          const text = Buffer.from(bytes).toString('utf8');
          if (text.includes('\u0000')) {
            continue; // skip binary files
          }
          const findings = scanText(text, toScanOptions(config), activeRules());
          if (findings.length > 0) {
            results.set(vscode.workspace.asRelativePath(uri), findings);
            totalSecrets += findings.length;
            diagnostics.update(uri, findings);
          }
        } catch {
          // ignore unreadable files
        }
        if (processed % 50 === 0) {
          progress.report({ message: `${processed}/${files.length} files` });
        }
      }
    },
  );

  if (!silent) {
    vscode.window.showInformationMessage(
      `Secret Guardian: scanned ${files.length} file(s); found ${totalSecrets} potential secret(s) in ${results.size} file(s).`,
    );
  }
  return results;
}

function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('secretGuardian.scanActiveFile', () => {
      const ed = vscode.window.activeTextEditor;
      if (!ed) {
        vscode.window.showInformationMessage('Secret Guardian: no active file.');
        return;
      }
      const findings = scanDocument(ed.document);
      vscode.window.showInformationMessage(
        `Secret Guardian: ${findings.length} potential secret(s) in this file.`,
      );
    }),

    vscode.commands.registerCommand('secretGuardian.scanWorkspace', async () => {
      await scanWorkspaceCommand();
    }),

    vscode.commands.registerCommand('secretGuardian.toggleMasking', () => {
      const next = !mask.isEnabled();
      mask.setEnabled(next);
      rescanActive();
      vscode.window.setStatusBarMessage(`Secret Guardian: masking ${next ? 'ON' : 'OFF'}`, 2000);
    }),

    vscode.commands.registerCommand('secretGuardian.enterLicense', enterLicenseCommand),
    vscode.commands.registerCommand('secretGuardian.upgrade', upgradeCommand),
    vscode.commands.registerCommand('secretGuardian.showLicenseStatus', showLicenseStatusCommand),
    vscode.commands.registerCommand('secretGuardian.deactivateLicense', deactivateLicenseCommand),
    vscode.commands.registerCommand(
      'secretGuardian.createCustomRulesTemplate',
      createCustomRulesTemplateCommand,
    ),
    vscode.commands.registerCommand('secretGuardian.exportReport', exportReportCommand),
    vscode.commands.registerCommand('secretGuardian.generateCiConfig', generateCiConfigCommand),
  );
}

// ── License commands ──────────────────────────────────────────────────────────

async function activateKey(key: string): Promise<void> {
  const res = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Secret Guardian: activating license…' },
    () => license.activate(key),
  );
  if (res.ok) {
    vscode.window.showInformationMessage(res.message);
  } else {
    vscode.window.showWarningMessage(`Secret Guardian: ${res.message}`);
  }
}

async function enterLicenseCommand(): Promise<void> {
  const key = await vscode.window.showInputBox({
    prompt: 'Enter your Secret Guardian Pro license key',
    placeHolder: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    ignoreFocusOut: true,
  });
  if (key == null || key.trim() === '') {
    return;
  }
  await activateKey(key.trim());
}

/**
 * One-click activation deep link:
 *   vscode://thund3rbird.secret-guardian/activate?key=<LICENSE_KEY>
 * Opened from the post-purchase page/email so Pro unlocks without copy-paste.
 * Harmless in the free build: activation there just shows the upgrade prompt.
 */
function registerUriHandler(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: async (uri: vscode.Uri): Promise<void> => {
        const key = parseActivationKey(uri.path, uri.query);
        if (!key) {
          return;
        }
        await activateKey(key);
      },
    }),
  );
}

interface TierPick extends vscode.QuickPickItem {
  tier?: ProTier;
  enterKey?: boolean;
}

async function upgradeCommand(): Promise<void> {
  const items: TierPick[] = PRO_TIERS.map((t) => ({
    label: t.label,
    description: t.priceLabel,
    detail: t.description,
    tier: t,
  }));
  items.push({
    label: '$(key) I already have a license key',
    detail: 'Activate Pro on this device with an existing key.',
    enterKey: true,
  });

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: 'Choose a Secret Guardian Pro plan',
    matchOnDetail: true,
  });
  if (!pick) {
    return;
  }
  if (pick.enterKey) {
    await enterLicenseCommand();
    return;
  }
  if (!pick.tier) {
    return;
  }

  const url = resolveCheckoutUrl(pick.tier, config.proCheckoutBaseUrl);
  if (url) {
    await vscode.env.openExternal(vscode.Uri.parse(url));
    vscode.window.showInformationMessage(
      'Opening secure checkout in your browser. After purchase, run “Secret Guardian: Enter Pro License Key”.',
    );
    return;
  }

  const choice = await vscode.window.showInformationMessage(
    'Online checkout isn’t configured for this build yet. Opening the Secret Guardian page instead.',
    'Open Page',
    'Enter License Key',
  );
  if (choice === 'Enter License Key') {
    await enterLicenseCommand();
  } else {
    await vscode.env.openExternal(vscode.Uri.parse(PRODUCT_LANDING_URL));
  }
}

async function showLicenseStatusCommand(): Promise<void> {
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Secret Guardian: checking license…' },
    () => license.refresh(),
  );
  const s = license.getStatusSummary();
  const lines = [
    `Pro: ${s.pro ? 'ACTIVE ✅' : 'not active'}`,
    `License key stored: ${s.keyPresent ? 'yes' : 'no'}`,
    s.status ? `Server status: ${s.status}` : undefined,
    s.expiresAt ? `Expires: ${s.expiresAt}` : undefined,
    s.lastValidated ? `Last checked: ${s.lastValidated}` : undefined,
    s.pro && s.inGrace ? '(offline grace active — will re-check when online)' : undefined,
  ].filter(Boolean) as string[];

  const actions = s.pro
    ? ['Deactivate on this device']
    : ['Upgrade to Pro', 'Enter License Key'];
  const pick = await vscode.window.showInformationMessage(
    `Secret Guardian license\n\n${lines.join('\n')}`,
    { modal: true },
    ...actions,
  );
  if (pick === 'Upgrade to Pro') {
    await upgradeCommand();
  } else if (pick === 'Enter License Key') {
    await enterLicenseCommand();
  } else if (pick === 'Deactivate on this device') {
    await deactivateLicenseCommand();
  }
}

async function deactivateLicenseCommand(): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    'Deactivate Secret Guardian Pro on this device? You can re-activate any time with your key.',
    { modal: true },
    'Deactivate',
  );
  if (confirm !== 'Deactivate') {
    return;
  }
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Secret Guardian: deactivating…' },
    () => license.deactivate(),
  );
  vscode.window.showInformationMessage('Secret Guardian Pro deactivated on this device.');
}

// ── Pro feature commands ────────────────────────────────────────────────────────

async function createCustomRulesTemplateCommand(): Promise<void> {
  if (!(await license.requirePro('Custom rule packs'))) {
    return;
  }
  const folder = vscode.workspace.workspaceFolders?.[0];
  const defaultUri = folder
    ? vscode.Uri.joinPath(folder.uri, 'secret-guardian.rules.json')
    : undefined;
  const target = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { JSON: ['json'] },
    saveLabel: 'Create custom rules file',
  });
  if (!target) {
    return;
  }
  await vscode.workspace.fs.writeFile(target, Buffer.from(sampleCustomRulesJson(), 'utf8'));
  const doc = await vscode.workspace.openTextDocument(target);
  await vscode.window.showTextDocument(doc);
  const set = await vscode.window.showInformationMessage(
    'Custom rules file created. Point Secret Guardian at it now?',
    'Set as active rules',
  );
  if (set === 'Set as active rules') {
    await vscode.workspace
      .getConfiguration('secretGuardian')
      .update('customRulesPath', target.fsPath, vscode.ConfigurationTarget.Global);
  }
}

async function exportReportCommand(): Promise<void> {
  if (!(await license.requirePro('Audit report export'))) {
    return;
  }
  const results = await scanWorkspaceCommand(true);
  const html = buildReportHtml(results);
  const folder = vscode.workspace.workspaceFolders?.[0];

  if (folder) {
    const uri = vscode.Uri.joinPath(folder.uri, 'secret-guardian-report.html');
    await vscode.workspace.fs.writeFile(uri, Buffer.from(html, 'utf8'));
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
    const open = await vscode.window.showInformationMessage(
      'Audit report saved as secret-guardian-report.html (no secret values included).',
      'Open in Browser',
    );
    if (open === 'Open in Browser') {
      await vscode.env.openExternal(uri);
    }
  } else {
    const doc = await vscode.workspace.openTextDocument({ language: 'html', content: html });
    await vscode.window.showTextDocument(doc);
  }
}

async function generateCiConfigCommand(): Promise<void> {
  if (!(await license.requirePro('CI / pre-commit config generation'))) {
    return;
  }
  const files = ciExportFiles();
  const pick = await vscode.window.showQuickPick(
    files.map((f) => ({ label: f.label, description: f.fileName, file: f })),
    { placeHolder: 'Which CI config do you want to generate?' },
  );
  if (!pick) {
    return;
  }
  const f = pick.file;
  const folder = vscode.workspace.workspaceFolders?.[0];

  if (!folder) {
    const doc = await vscode.workspace.openTextDocument({
      language: f.language,
      content: f.content,
    });
    await vscode.window.showTextDocument(doc);
    return;
  }

  const uri = vscode.Uri.joinPath(folder.uri, ...f.fileName.split('/'));
  let exists = false;
  try {
    await vscode.workspace.fs.stat(uri);
    exists = true;
  } catch {
    exists = false;
  }
  if (exists) {
    const ow = await vscode.window.showWarningMessage(
      `${f.fileName} already exists. Overwrite it?`,
      'Overwrite',
      'Open generated (unsaved)',
    );
    if (ow !== 'Overwrite') {
      const doc = await vscode.workspace.openTextDocument({
        language: f.language,
        content: f.content,
      });
      await vscode.window.showTextDocument(doc);
      return;
    }
  }
  await vscode.workspace.fs.writeFile(uri, Buffer.from(f.content, 'utf8'));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
  vscode.window.showInformationMessage(`Secret Guardian: generated ${f.fileName}.`);
}
