<!-- Open core: this repository is the free, open-source core of Secret Guardian (MIT).
     Pro features (custom rule packs, audit-report export, CI/pre-commit generators, and
     licensing) are a paid add-on shipped only in the published Marketplace build. In this
     repo the Pro commands are present but gated behind an upgrade prompt. -->

> **Open core.** This repo is the free, MIT-licensed core. **Secret Guardian Pro** is a paid
> add-on available on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=thund3rbird.secret-guardian).
# Secret Guardian

**Catch leaked API keys, tokens, and secrets *as you type* — before they hit your commits, screenshots, or screen-shares.**

Most secret scanners run in CI, *after* the leak is already in your git history. Secret Guardian runs **live, in your editor**, so you see and hide secrets the moment they appear.

---

## Features (Free)

- 🔍 **Live detection** of 17+ secret types as you type — AWS, GitHub, GitLab, Google, Slack, Stripe, OpenAI, SendGrid, Twilio, npm, private keys, JWTs, credentials-in-URLs, and a generic high-entropy catch-all.
- 🙈 **One-click masking** — detected secrets are rendered transparent with a `🔒 secret hidden` overlay, so they never show up in screenshots or live demos.
- 🟡 **Problems panel integration** — every finding appears as a diagnostic with severity (critical / high / medium) and rule id.
- 📁 **Workspace scan** — sweep the whole project on demand.
- 🤫 **False-positive control** — inline ignore comments (`// secret-guardian-ignore`, `gitleaks:allow`, `pragma: allowlist secret`), per-rule disabling, and entropy tuning.
- 🛡️ **100% local** — scanning happens entirely on your machine. No code, no secrets, nothing ever leaves your editor.

## Features (Pro)

- 🧩 **Custom rule packs** — add your own org-specific detection rules from a JSON file (`Secret Guardian: Create Custom Rules Template` scaffolds one for you).
- 📊 **Audit reports** — export a shareable HTML report of every finding across the workspace (location + rule only, **never** the secret value).
- ⚙️ **CI / pre-commit generators** — write ready-to-use GitHub Actions and pre-commit configs straight into your repo to enforce scanning in your pipeline.

### Get Pro

| Plan | Price |
|---|---|
| **Monthly** | $5 / month |
| **Yearly** | $39 / year (best value) |
| **Lifetime** | $59 once (launch offer) |

Run **Secret Guardian: Upgrade to Pro…** from the Command Palette to open secure
checkout (payments handled by [Lemon Squeezy](https://www.lemonsqueezy.com/), the
merchant of record — global tax included). After purchase you'll receive a
license key by email. Click the **“Activate in VS Code”** link in the receipt to
unlock Pro in one click, or paste the key via **Secret Guardian: Enter Pro
License Key**.

- Your key is stored in VS Code **Secret Storage** (never in `settings.json`).
- Activation binds the key to your device; manage devices with
  **Secret Guardian: Deactivate Pro License**.
- Pro keeps working **offline** within a grace window; it re-validates when you're
  back online. If a license is refunded or expires, Pro locks automatically.

> We never treat an unverified key as paid — Pro stays locked until the license
> server confirms it.

---

## Usage

- Just start typing — secrets are flagged and masked automatically.
- Command Palette (`Ctrl/Cmd+Shift+P`):
  - **Secret Guardian: Scan Active File**
  - **Secret Guardian: Scan Workspace for Secrets**
  - **Secret Guardian: Toggle Secret Masking**
  - **Secret Guardian: Upgrade to Pro…**
  - **Secret Guardian: Enter Pro License Key**
  - **Secret Guardian: Show License Status**
  - **Secret Guardian: Deactivate Pro License (this device)**
  - **Secret Guardian: Create Custom Rules Template (Pro)**
  - **Secret Guardian: Export Audit Report (Pro)**
  - **Secret Guardian: Generate CI / Pre-commit Config (Pro)**
- The status bar shows a live count; click it to toggle masking.

## Settings

| Setting | Default | Description |
|---|---|---|
| `secretGuardian.enable` | `true` | Enable live scanning. |
| `secretGuardian.maskSecrets` | `true` | Visually mask detected secrets. |
| `secretGuardian.scanDelayMs` | `400` | Debounce delay after edits. |
| `secretGuardian.disabledRules` | `[]` | Rule IDs to disable. |
| `secretGuardian.ignoreGlobs` | node_modules, dist, … | Paths skipped in workspace scans. |
| `secretGuardian.entropyThreshold` | `3.5` | Sensitivity of the generic high-entropy rule. |
| `secretGuardian.customRulesPath` | `""` | (Pro) Path to a JSON file of custom detection rules. |
| `secretGuardian.pro.checkoutBaseUrl` | `""` | (Optional) Override the Lemon Squeezy store base URL used by the Upgrade flow. |

## Privacy

Secret Guardian performs **all** analysis locally inside VS Code. It makes no network calls with your code or secrets. (License validation, when enabled, sends only the license key — never your code.)

## License

MIT. See [LICENSE](./LICENSE).
