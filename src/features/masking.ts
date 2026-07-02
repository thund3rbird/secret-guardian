import * as vscode from 'vscode';
import { Finding } from '../core/types';

/**
 * Visually masks detected secrets by rendering the matched text transparent and
 * overlaying a lock label, so secrets do not appear in screenshots / screen-shares.
 */
export class MaskController {
  private decoration: vscode.TextEditorDecorationType;
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
    this.decoration = vscode.window.createTextEditorDecorationType({
      color: 'transparent',
      borderRadius: '3px',
      backgroundColor: new vscode.ThemeColor('inputValidation.warningBackground'),
      before: {
        contentText: '🔒 secret hidden',
        color: new vscode.ThemeColor('editorWarning.foreground'),
        fontStyle: 'italic',
        margin: '0 4px 0 0',
      },
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  apply(editor: vscode.TextEditor | undefined, findings: Finding[]): void {
    if (!editor) {
      return;
    }
    const ranges = this.enabled
      ? findings.map((f) => new vscode.Range(f.line, f.startCol, f.line, f.endCol))
      : [];
    editor.setDecorations(this.decoration, ranges);
  }

  dispose(): void {
    this.decoration.dispose();
  }
}
