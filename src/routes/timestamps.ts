import { Hono } from 'hono';
import { db } from '../db.js';

export const timestampsRouter = new Hono();

// Normalise the incoming title the same way the extension builds keywords:
// lowercase, collapse whitespace. e.g. "Game of Thrones S1E1" → "game of thrones s1e1"
function normalise(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

// GET /timestamps?title=Game+of+Thrones+S1E1
timestampsRouter.get('/', async (c) => {
  const raw = c.req.query('title');

  if (!raw || raw.trim().length < 2) {
    return c.json({ error: 'Missing or too-short title query param' }, 400);
  }

  const keyword = normalise(raw);

  // Exact match first — fastest and most reliable for known titles
  const { data: exact, error: exactErr } = await db
    .from('timestamps')
    .select('id, start_time, end_time, category, title')
    .eq('keyword', keyword)
    .order('start_time');

  if (exactErr) {
    console.error('Exact match query failed:', exactErr);
    return c.json({ error: 'Database error' }, 500);
  }

  if (exact && exact.length > 0) {
    return c.json({ timestamps: exact.map(toTimestamp) });
  }

  // Fuzzy fallback — catches slight title variations (e.g. missing year suffix)
  // Uses Postgres ILIKE, safe because we don't interpolate user input into SQL
  const { data: fuzzy, error: fuzzyErr } = await db
    .from('timestamps')
    .select('id, start_time, end_time, category, title')
    .ilike('keyword', `%${keyword}%`)
    .order('start_time')
    .limit(50);

  if (fuzzyErr) {
    console.error('Fuzzy match query failed:', fuzzyErr);
    return c.json({ error: 'Database error' }, 500);
  }

  return c.json({ timestamps: (fuzzy ?? []).map(toTimestamp) });
});

// Map DB row to the SkipTimestamp shape the extension expects
function toTimestamp(row: {
  id: string;
  start_time: number;
  end_time: number;
  category: string;
  title: string;
}) {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category,
    title: row.title,
  };
}
