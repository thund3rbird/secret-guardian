import * as vscode from 'vscode';

export class StatusBar {
  private item: vscode.StatusBarItem;
  private lastCount = 0;
  private pro = false;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'secretGuardian.toggleMasking';
    this.item.show();
    this.render(0);
  }

  setPro(pro: boolean): void {
    this.pro = pro;
    this.render(this.lastCount);
  }

  render(count: number): void {
    this.lastCount = count;
    const tier = this.pro ? 'Pro' : 'Free';
    if (count === 0) {
      this.item.text = '$(shield) No secrets';
      this.item.tooltip = `Secret Guardian (${tier}): no secrets detected in this file. Click to toggle masking.`;
      this.item.backgroundColor = undefined;
    } else {
      this.item.text = `$(warning) ${count} secret${count === 1 ? '' : 's'}`;
      this.item.tooltip = `Secret Guardian (${tier}): ${count} potential secret(s) detected. Click to toggle masking.`;
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  dispose(): void {
    this.item.dispose();
  }
}
