import 'node:process';
import { serve } from '@hono/node-server';
import app from './app.js';

if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv').catch(() => ({ config: () => { } }));
  (config as () => void)();
}

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
  console.log(`SceneSkip API running on http://localhost:${port}`);
});