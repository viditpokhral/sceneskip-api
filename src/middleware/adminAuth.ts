import dotenv from 'dotenv';
import { createMiddleware } from 'hono/factory';

dotenv.config();

export const adminAuth = createMiddleware(async (c, next) => {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    console.error('ADMIN_API_KEY is not set — admin routes are disabled');
    return c.json({ error: 'Admin access not configured' }, 503);
  }

  const authHeader = c.req.header('Authorization');
  const provided = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!provided || provided !== adminKey) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});
