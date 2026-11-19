# Shortly

A tiny link shortener: Node 24+, TypeScript run directly by Node, built-in `node:sqlite`, no dependencies.

- Do not add dependencies.
- `src/store.ts` owns the database. `src/server.ts` owns routing. `src/page.ts` renders the only page.
- Every change comes with tests under `test/`, using `node:test`. Run `npm test`.
