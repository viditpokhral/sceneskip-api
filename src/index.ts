import 'node:process';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timestampsRouter } from './routes/timestamps.js';
import { submissionsRouter } from './routes/submissions.js';
import { adminRouter } from './routes/admin.js';
import { rateLimit } from './middleware/rateLimit.js';

if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv').catch(() => ({ config: () => {} }));
  (config as () => void)();
}

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) =>
      origin.startsWith('chrome-extension://') || origin === 'http://localhost:3000'
        ? origin
        : '',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.get('/health', (c) => c.json({ ok: true }));

app.route('/timestamps', timestampsRouter);

app.use('/submissions/*', rateLimit({ limit: 10, windowMs: 60_000 }));
app.route('/submissions', submissionsRouter);

app.route('/admin', adminRouter);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
  console.log(`SceneSkip API running on http://localhost:${port}`);
});
