import { Hono } from 'hono';
import { db } from '../db.js';

export const showsRouter = new Hono();

// ----------------------------------------------------------------
// GET /shows
// Returns all shows that have at least one approved timestamp,
// with a count of how many episodes are covered.
// ----------------------------------------------------------------
showsRouter.get('/', async (c) => {
  const { data, error } = await db
    .from('timestamps')
    .select('keyword, title, category')
    .order('keyword');

  if (error) {
    console.error('Failed to fetch shows:', error);
    return c.json({ error: 'Database error' }, 500);
  }

  // Group by base show name (strip episode suffix like "S1E1")
  const showMap = new Map<string, {
    title: string;
    episodeCount: number;
    categories: Set<string>;
    episodes: Set<string>;
  }>();

  for (const row of data ?? []) {
    // "game of thrones s1e1" → "game of thrones"
    const baseKeyword = row.keyword.replace(/\s+s\d+e\d+$/i, '').trim();
    const baseTitle = row.title.replace(/\s+S\d+E\d+$/i, '').trim();

    if (!showMap.has(baseKeyword)) {
      showMap.set(baseKeyword, {
        title: baseTitle,
        episodeCount: 0,
        categories: new Set(),
        episodes: new Set(),
      });
    }

    const entry = showMap.get(baseKeyword)!;
    entry.categories.add(row.category);
    entry.episodes.add(row.keyword);
    entry.episodeCount = entry.episodes.size;
  }

  const shows = Array.from(showMap.entries()).map(([keyword, s]) => ({
    keyword,
    title: s.title,
    episodeCount: s.episodeCount,
    categories: [...s.categories].sort(),
  }));

  return c.json({ shows });
});

// ----------------------------------------------------------------
// GET /shows/:keyword/coverage
// Returns which episodes have timestamps for a given show.
// :keyword is the base show keyword e.g. "game-of-thrones"
// ----------------------------------------------------------------
showsRouter.get('/:keyword/coverage', async (c) => {
  // Accept both "game-of-thrones" (URL-friendly) and "game of thrones"
  const raw = c.req.param('keyword').replace(/-/g, ' ').toLowerCase().trim();

  const { data, error } = await db
    .from('timestamps')
    .select('keyword, title, category, start_time, end_time')
    .ilike('keyword', `${raw}%`)
    .order('keyword');

  if (error) {
    console.error('Failed to fetch coverage:', error);
    return c.json({ error: 'Database error' }, 500);
  }

  if (!data || data.length === 0) {
    return c.json({ error: 'Show not found' }, 404);
  }

  // Group by episode keyword
  const episodeMap = new Map<string, {
    title: string;
    categories: Set<string>;
    timestampCount: number;
  }>();

  for (const row of data) {
    if (!episodeMap.has(row.keyword)) {
      episodeMap.set(row.keyword, {
        title: row.title,
        categories: new Set(),
        timestampCount: 0,
      });
    }
    const ep = episodeMap.get(row.keyword)!;
    ep.categories.add(row.category);
    ep.timestampCount++;
  }

  const episodes = Array.from(episodeMap.entries()).map(([keyword, ep]) => ({
    keyword,
    title: ep.title,
    categories: [...ep.categories].sort(),
    timestampCount: ep.timestampCount,
  }));

  const baseTitle = episodes[0].title.replace(/\s+S\d+E\d+$/i, '').trim();

  return c.json({
    show: baseTitle,
    episodeCount: episodes.length,
    episodes,
  });
});