import { handle } from '@hono/node-server/vercel';
import app from '../app.js';

export const config = {
    runtime: 'nodejs20.x',
};

export default handle(app);