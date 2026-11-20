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

async function shorten(base: string, url: string): Promise<string> {
  const res = await fetch(`${base}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return (await res.json()).code;
}

async function links(base: string): Promise<{ code: string; clicks: number }[]> {
  return (await fetch(`${base}/api/links`)).json();
}

test('counts each time a link is followed', async (t) => {
  const { base } = await start(t);
  const code = await shorten(base, 'https://example.com/counted');

  await fetch(`${base}/${code}`, { redirect: 'manual' });
  await fetch(`${base}/${code}`, { redirect: 'manual' });

  assert.equal((await links(base)).find((link) => link.code === code)?.clicks, 2);
});

test('an unknown code counts nothing', async (t) => {
  const { base } = await start(t);
  const code = await shorten(base, 'https://example.com/untouched');

  await fetch(`${base}/nope42`, { redirect: 'manual' });

  assert.equal((await links(base))[0].code, code);
  assert.equal((await links(base))[0].clicks, 0);
});

test('lists the most clicked link first', async (t) => {
  const { base } = await start(t);
  const quiet = await shorten(base, 'https://example.com/quiet');
  const popular = await shorten(base, 'https://example.com/popular');
  await shorten(base, 'https://example.com/newest');

  await fetch(`${base}/${popular}`, { redirect: 'manual' });
  await fetch(`${base}/${popular}`, { redirect: 'manual' });
  await fetch(`${base}/${quiet}`, { redirect: 'manual' });

  assert.deepEqual(
    (await links(base)).map((link) => link.code).slice(0, 2),
    [popular, quiet],
  );
});

test('the home page shows each link\'s clicks', async (t) => {
  const { base } = await start(t);
  const code = await shorten(base, 'https://example.com/shown');
  await fetch(`${base}/${code}`, { redirect: 'manual' });

  assert.match(await (await fetch(`${base}/`)).text(), /1 click</);
});
