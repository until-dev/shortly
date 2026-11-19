# Shortly

A tiny link shortener. Paste a long link, get a short one.

It needs Node 24 or later and has no dependencies: Node runs the TypeScript directly and stores links with its built-in SQLite.

```bash
npm start   # http://localhost:3000
npm test
```

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Port to listen on |
| `BASE_URL` | `http://localhost:$PORT/` | Start of every short link |
| `DATABASE` | `shortly.db` | SQLite file |

## API

- `POST /links` with `{"url": "https://…"}` creates a link and returns it with its `shortUrl`.
- `GET /api/links` lists every link, newest first.
- `GET /:code` redirects to the link's URL.
