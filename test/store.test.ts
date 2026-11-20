import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Store } from '../src/store.ts';

test('a new link starts at 0 clicks', () => {
  const store = new Store();
  assert.equal(store.create('https://example.com').clicks, 0);
  assert.equal(store.list()[0].clicks, 0);
  store.close();
});

test('links with the same clicks keep the newest first', () => {
  const store = new Store();
  const older = store.create('https://example.com/older', new Date('2026-01-01'));
  const newer = store.create('https://example.com/newer', new Date('2026-01-02'));
  assert.deepEqual(store.list().map((link) => link.code), [newer.code, older.code]);
  store.close();
});

test('opens a database made before links counted clicks', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'shortly-'));
  t.after(() => rmSync(dir, { recursive: true }));
  const path = join(dir, 'old.db');
  const old = new DatabaseSync(path);
  old.exec('CREATE TABLE links (code TEXT PRIMARY KEY, url TEXT NOT NULL, created_at TEXT NOT NULL)');
  old.prepare('INSERT INTO links VALUES (?, ?, ?)').run('abc234', 'https://example.com', '2026-01-01T00:00:00.000Z');
  old.close();

  const store = new Store(path);
  store.recordClick('abc234');
  assert.equal(store.find('abc234')?.clicks, 1);
  store.close();
});
