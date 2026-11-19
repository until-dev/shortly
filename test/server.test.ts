import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/server.ts';
import { Store } from '../src/store.ts';

async function start(t: import('node:test').TestContext) {
  const store = new Store();
  const server = createApp(store, 'http://short.test/');
  await new Promise<void>((resolve) => server.listen(0, resolve));
  t.after(() => {
    server.close();
    store.close();
  });
  const { port } = server.address() as AddressInfo;
  return { store, base: `http://127.0.0.1:${port}` };
}

test('creates a link and redirects to it', async (t) => {
  const { base } = await start(t);

  const created = await fetch(`${base}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com/long' }),
  });
  assert.equal(created.status, 201);
  const link = await created.json();
  assert.equal(link.shortUrl, `http://short.test/${link.code}`);

  const visit = await fetch(`${base}/${link.code}`, { redirect: 'manual' });
  assert.equal(visit.status, 302);
  assert.equal(visit.headers.get('location'), 'https://example.com/long');
});

test('creates a link from the form', async (t) => {
  const { base, store } = await start(t);

  const res = await fetch(`${base}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'url=https%3A%2F%2Fexample.com',
    redirect: 'manual',
  });
  assert.equal(res.status, 303);
  assert.equal(store.list().length, 1);
});

test('refuses a link that is not http or https', async (t) => {
  const { base } = await start(t);

  const res = await fetch(`${base}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'javascript:alert(1)' }),
  });
  assert.equal(res.status, 400);
});

test('returns 404 for an unknown code', async (t) => {
  const { base } = await start(t);

  const res = await fetch(`${base}/nope42`, { redirect: 'manual' });
  assert.equal(res.status, 404);
});
