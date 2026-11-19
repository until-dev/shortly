import { DatabaseSync } from 'node:sqlite';
import { newCode } from './codes.ts';

export type Link = {
  code: string;
  url: string;
  createdAt: string;
};

export class Store {
  private db: DatabaseSync;

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        code       TEXT PRIMARY KEY,
        url        TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }

  create(url: string, now = new Date()): Link {
    const link = { code: newCode(), url, createdAt: now.toISOString() };
    this.db
      .prepare('INSERT INTO links (code, url, created_at) VALUES (?, ?, ?)')
      .run(link.code, link.url, link.createdAt);
    return link;
  }

  find(code: string): Link | undefined {
    const row = this.db
      .prepare('SELECT code, url, created_at FROM links WHERE code = ?')
      .get(code);
    return row ? toLink(row) : undefined;
  }

  list(): Link[] {
    return this.db
      .prepare('SELECT code, url, created_at FROM links ORDER BY created_at DESC')
      .all()
      .map(toLink);
  }

  close(): void {
    this.db.close();
  }
}

function toLink(row: Record<string, unknown>): Link {
  return {
    code: String(row.code),
    url: String(row.url),
    createdAt: String(row.created_at),
  };
}
