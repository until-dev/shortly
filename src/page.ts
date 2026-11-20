import type { Link } from './store.ts';

export function renderHome(links: Link[], baseUrl: string, error?: string): string {
  const rows = links
    .map((link) => {
      const short = new URL(link.code, baseUrl).toString();
      return `<li>
        <a class="short" href="/${escape(link.code)}">${escape(short)}</a>
        <span class="target">${escape(link.url)}</span>
        <span class="clicks">${clickLabel(link.clicks)}</span>
      </li>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shortly</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 64px auto; padding: 0 16px; color: #1c1917; background: #fafaf9; }
    h1 { font-size: 40px; margin-bottom: 8px; }
    p.lede { color: #57534e; margin-top: 0; }
    form { display: flex; gap: 8px; margin: 32px 0 8px; }
    input { flex: 1; font-size: 18px; padding: 10px 12px; border: 1px solid #d6d3d1; border-radius: 8px; }
    button { font-size: 18px; padding: 10px 18px; border: 0; border-radius: 8px; background: #ea580c; color: white; cursor: pointer; }
    .error { color: #b91c1c; }
    ul { list-style: none; padding: 0; margin-top: 32px; }
    li { display: flex; flex-direction: column; padding: 12px 0; border-top: 1px solid #e7e5e4; }
    .short { font-weight: 600; color: #c2410c; }
    .clicks { color: #57534e; font-size: 14px; }
    .target { color: #78716c; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  </style>
</head>
<body>
  <h1>Shortly</h1>
  <p class="lede">Make long links short.</p>
  <form method="post" action="/links">
    <input name="url" type="text" placeholder="https://example.com/a/very/long/link" autofocus>
    <button type="submit">Shorten</button>
  </form>
  ${error ? `<p class="error">${escape(error)}</p>` : ''}
  <ul>${rows}</ul>
</body>
</html>`;
}

function clickLabel(clicks: number): string {
  return clicks === 1 ? '1 click' : `${clicks} clicks`;
}

function escape(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
