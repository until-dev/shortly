import { DatabaseSync } from 'node:sqlite';
import { newCode } from './codes.ts';

export type Link = {
  code: string;
  url: string;
  createdAt: string;
  clicks: number;
};

export class Store {
  private db: DatabaseSync;

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        code       TEXT PRIMARY KEY,
        url        TEXT NOT NULL,
        created_at TEXT NOT NULL,
        clicks     INTEGER NOT NULL DEFAULT 0
      )
    `);
    this.addClicksToOldDatabase();
  }

  // Databases made before links counted clicks have no clicks column, and
  // CREATE TABLE IF NOT EXISTS leaves them as they are. Add it, starting at 0.
  private addClicksToOldDatabase(): void {
    const columns = this.db.prepare('PRAGMA table_info(links)').all();
    if (!columns.some((column) => column.name === 'clicks')) {
      this.db.exec('ALTER TABLE links ADD COLUMN clicks INTEGER NOT NULL DEFAULT 0');
    }
  }

  create(url: string, now = new Date()): Link {
    const link = { code: newCode(), url, createdAt: now.toISOString(), clicks: 0 };
    this.db
      .prepare('INSERT INTO links (code, url, created_at) VALUES (?, ?, ?)')
      .run(link.code, link.url, link.createdAt);
    return link;
  }

  find(code: string): Link | undefined {
    const row = this.db
      .prepare('SELECT code, url, created_at, clicks FROM links WHERE code = ?')
      .get(code);
    return row ? toLink(row) : undefined;
  }

  recordClick(code: string): void {
    this.db.prepare('UPDATE links SET clicks = clicks + 1 WHERE code = ?').run(code);
  }

  list(): Link[] {
    return this.db
      .prepare('SELECT code, url, created_at, clicks FROM links ORDER BY clicks DESC, created_at DESC')
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
    clicks: Number(row.clicks),
  };
}
