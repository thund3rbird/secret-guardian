import * as vscode from 'vscode';
import { Finding, Severity } from '../core/types';

const SOURCE = 'Secret Guardian';

export class DiagnosticsManager {
  private collection: vscode.DiagnosticCollection;

  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection('secretGuardian');
  }

  update(uri: vscode.Uri, findings: Finding[]): void {
    const diags = findings.map((f) => {
      const range = new vscode.Range(f.line, f.startCol, f.line, f.endCol);
      const d = new vscode.Diagnostic(range, f.message, toSeverity(f.severity));
      d.source = SOURCE;
      d.code = f.ruleId;
      return d;
    });
    this.collection.set(uri, diags);
  }

  clear(uri: vscode.Uri): void {
    this.collection.delete(uri);
  }

  dispose(): void {
    this.collection.dispose();
  }
}

function toSeverity(s: Severity): vscode.DiagnosticSeverity {
  switch (s) {
    case 'critical':
    case 'high':
      return vscode.DiagnosticSeverity.Error;
    case 'medium':
      return vscode.DiagnosticSeverity.Warning;
    default:
      return vscode.DiagnosticSeverity.Information;
  }
}
