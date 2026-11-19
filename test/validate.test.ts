import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTarget } from '../src/validate.ts';

test('accepts http and https links', () => {
  assert.deepEqual(parseTarget(' https://example.com/a '), { url: 'https://example.com/a' });
  assert.deepEqual(parseTarget('http://example.com'), { url: 'http://example.com/' });
});

test('rejects empty input', () => {
  assert.ok('error' in parseTarget('   '));
});

test('rejects text that is not a link', () => {
  assert.ok('error' in parseTarget('not a link'));
});

test('rejects other protocols', () => {
  assert.ok('error' in parseTarget('javascript:alert(1)'));
  assert.ok('error' in parseTarget('ftp://example.com'));
});
