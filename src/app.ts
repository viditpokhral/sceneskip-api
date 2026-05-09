import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timestampsRouter } from './routes/timestamps.js';
import { submissionsRouter } from './routes/submissions.js';
import { adminRouter } from './routes/admin.js';
import { rateLimit } from './middleware/rateLimit.js';
import { showsRouter } from './routes/shows.js';

const app = new Hono();

app.use('*', logger());
app.use(
    '*',
    cors({
        origin: (origin) =>
            origin.startsWith('chrome-extension://') ||
                origin.startsWith('moz-extension://') ||
                origin === 'http://localhost:3000'
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
app.route('/shows', showsRouter);

export default app;