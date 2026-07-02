import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from '../src/core/scanner';
import { shannonEntropy, isLikelyPlaceholder } from '../src/core/entropy';

// Fake fixtures are assembled at runtime so no contiguous secret-shaped literal
// is ever committed (keeps GitHub push protection and other scanners quiet).
const FAKE_HIGH_ENTROPY = 'A1b2C3d4' + 'E5f6G7h8' + 'I9j0KqLw' + 'MxNyOz12';
const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIn0' +
  '.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

test('detects an AWS access key id', () => {
  // Fixture tokens are split so secret scanners don't flag them; rebuilt at runtime.
  const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
  const findings = scanText(`const k = "${key}";`);
  assert.ok(findings.some((f) => f.ruleId === 'aws-access-key-id'));
});

test('detects a GitHub token', () => {
  const token = 'ghp_' + '0123456789abcdefghijklmnopqrstuvwxyz';
  const findings = scanText(`token = "${token}"`);
  assert.ok(findings.some((f) => f.ruleId === 'github-token'));
});

test('detects a Stripe secret key', () => {
  const key = 'sk_' + 'live_' + '0123456789abcdefABCDEFgh';
  const findings = scanText(`STRIPE = "${key}"`);
  assert.ok(findings.some((f) => f.ruleId === 'stripe-secret-key'));
});

test('detects a private key block', () => {
  const header = '-----BEGIN ' + 'RSA PRIVATE KEY-----';
  const findings = scanText(header);
  assert.ok(findings.some((f) => f.ruleId === 'private-key-block'));
});

test('detects a JWT', () => {
  const findings = scanText(`const t = "${FAKE_JWT}";`);
  assert.ok(findings.some((f) => f.ruleId === 'jwt'));
});

test('detects a generic high-entropy secret and masks only the value', () => {
  const line = `const apiSecret = "${FAKE_HIGH_ENTROPY}";`;
  const findings = scanText(line);
  const hit = findings.find((f) => f.ruleId === 'generic-high-entropy');
  assert.ok(hit, 'expected a generic-high-entropy finding');
  assert.equal(hit!.matchText, FAKE_HIGH_ENTROPY);
  // The finding span should cover the value only, not the whole assignment.
  assert.equal(line.slice(hit!.startCol, hit!.endCol), hit!.matchText);
});

test('respects inline ignore markers', () => {
  const findings = scanText(
    `const apiSecret = "${FAKE_HIGH_ENTROPY}"; // secret-guardian-ignore`,
  );
  assert.equal(findings.length, 0);
});

test('ignores obvious placeholders', () => {
  const findings = scanText('const apiKey = "your_api_key_here";');
  assert.equal(findings.length, 0);
});

test('honors disabled rule ids', () => {
  const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
  const findings = scanText(`const k = "${key}";`, {
    disabledRuleIds: ['aws-access-key-id'],
  });
  assert.equal(findings.length, 0);
});

test('clean code produces no findings', () => {
  const findings = scanText('function add(a, b) { return a + b; }');
  assert.equal(findings.length, 0);
});

test('shannonEntropy is 0 for a single repeated character', () => {
  assert.equal(shannonEntropy('aaaaaa'), 0);
  assert.ok(shannonEntropy(FAKE_HIGH_ENTROPY.slice(0, 16)) > 3.5);
});

test('isLikelyPlaceholder flags filler values', () => {
  assert.equal(isLikelyPlaceholder('xxxxxxxx'), true);
  assert.equal(isLikelyPlaceholder('process.env.SECRET'), true);
  assert.equal(isLikelyPlaceholder(FAKE_HIGH_ENTROPY), false);
});
