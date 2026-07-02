import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseActivationKey } from '../src/core/activationLink';

test('parseActivationKey extracts the key from an activate link', () => {
  assert.equal(
    parseActivationKey('/activate', 'key=ABCD1234-ab12-CD34-ef56-1234567890ab'),
    'ABCD1234-ab12-CD34-ef56-1234567890ab',
  );
});

test('parseActivationKey tolerates leading slashes and route casing', () => {
  assert.equal(parseActivationKey('//Activate', 'key=abc'), 'abc');
});

test('parseActivationKey url-decodes and trims the key', () => {
  assert.equal(parseActivationKey('/activate', 'key=%20abc%20'), 'abc');
});

test('parseActivationKey returns null for the wrong route', () => {
  assert.equal(parseActivationKey('/deactivate', 'key=abc'), null);
  assert.equal(parseActivationKey('/', 'key=abc'), null);
});

test('parseActivationKey returns null when the key is missing or empty', () => {
  assert.equal(parseActivationKey('/activate', ''), null);
  assert.equal(parseActivationKey('/activate', 'key='), null);
  assert.equal(parseActivationKey('/activate', 'foo=bar'), null);
});
