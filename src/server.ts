import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { Store } from './store.ts';
import { renderHome } from './page.ts';
import { parseTarget } from './validate.ts';

export function createApp(store: Store, baseUrl: string): Server {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', baseUrl);

    if (req.method === 'GET' && url.pathname === '/') {
      return html(res, 200, renderHome(store.list(), baseUrl));
    }

    if (req.method === 'POST' && url.pathname === '/links') {
      const body = await readBody(req);
      const input = isJson(req) ? jsonUrl(body) : new URLSearchParams(body).get('url') ?? '';
      const target = parseTarget(input);
      if ('error' in target) {
        return isJson(req)
          ? json(res, 400, { error: target.error })
          : html(res, 400, renderHome(store.list(), baseUrl, target.error));
      }
      const link = store.create(target.url);
      if (isJson(req)) {
        return json(res, 201, { ...link, shortUrl: new URL(link.code, baseUrl).toString() });
      }
      res.writeHead(303, { Location: '/' });
      return res.end();
    }

    if (req.method === 'GET' && url.pathname === '/api/links') {
      return json(res, 200, store.list());
    }

    if (req.method === 'GET') {
      const link = store.find(url.pathname.slice(1));
      if (link) {
        res.writeHead(302, { Location: link.url });
        return res.end();
      }
    }

    return html(res, 404, '<h1>Not found</h1>');
  });
}

function jsonUrl(body: string): string {
  try {
    return String(JSON.parse(body).url ?? '');
  } catch {
    return '';
  }
}

function isJson(req: IncomingMessage): boolean {
  return (req.headers['content-type'] ?? '').startsWith('application/json');
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function html(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}
