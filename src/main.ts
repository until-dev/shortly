import { createApp } from './server.ts';
import { Store } from './store.ts';

const port = Number(process.env.PORT ?? 3000);
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}/`;
const store = new Store(process.env.DATABASE ?? 'shortly.db');

createApp(store, baseUrl).listen(port, () => {
  console.log(`Shortly is running at ${baseUrl}`);
});
