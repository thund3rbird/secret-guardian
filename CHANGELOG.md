# Changelog

All notable changes to **Secret Guardian** are documented here.

## [0.2.0]
### Added
- **Real Pro licensing** via the Lemon Squeezy License API — activate / validate /
  deactivate, device binding, and an offline grace window.
- **Upgrade to Pro** flow with three plans (Monthly $5, Yearly $39, Lifetime $59)
  that opens secure Lemon Squeezy checkout.
- **License management** commands: Enter License Key, Show License Status,
  Deactivate (this device), plus a status-bar Pro/Free indicator.
- **Create Custom Rules Template** command that scaffolds a ready-to-edit rules file.
- Audit reports and CI/pre-commit configs now **save to files** in your workspace
  (report as `secret-guardian-report.html`; CI configs at their conventional paths).

### Changed
- License keys are now stored in VS Code **Secret Storage** instead of settings;
  any existing `secretGuardian.licenseKey` value is migrated and then cleared.
- Custom-rule loading is resilient: one bad rule no longer discards the rest;
  problems are reported individually.

### Security
- Removed plaintext license key from `settings.json`.

## [0.1.0] — 2026-06-22 (MVP)
### Added
- Live, in-editor detection of 17+ secret types (AWS, GitHub, GitLab, Google, Slack, Stripe, OpenAI, SendGrid, Twilio, npm, private keys, JWT, credentials-in-URL) plus a generic high-entropy rule.
- Visual masking of detected secrets with a lock overlay.
- Problems-panel diagnostics with severity and rule id.
- On-demand active-file and workspace scans.
- Inline ignore markers, per-rule disabling, entropy threshold, and ignore globs.
- Status bar live secret count + masking toggle.
- Pro (license-gated) scaffolding: custom rule packs, HTML audit report, CI / pre-commit config generators.
