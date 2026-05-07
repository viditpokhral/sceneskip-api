import { Hono } from 'hono';
import { db } from '../db.js';

export const submissionsRouter = new Hono();

export const VALID_CATEGORIES = [
  'sex_nudity',
  'violence_gore',
  'filler',
  'others',
] as const;

type Category = typeof VALID_CATEGORIES[number];

const VALID_CATEGORY_SET = new Set<string>(VALID_CATEGORIES);

// POST /submissions
submissionsRouter.post('/', async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { title, startTime, endTime, category, note } = body as Record<string, unknown>;

  const errors: string[] = [];

  if (typeof title !== 'string' || title.trim().length < 2) {
    errors.push('title must be a non-empty string');
  }

  if (typeof startTime !== 'number' || startTime < 0) {
    errors.push('startTime must be a non-negative number (seconds)');
  }

  if (typeof endTime !== 'number' || endTime <= 0) {
    errors.push('endTime must be a positive number (seconds)');
  }

  if (
    typeof startTime === 'number' &&
    typeof endTime === 'number' &&
    endTime <= startTime
  ) {
    errors.push('endTime must be greater than startTime');
  }

  if (
    typeof startTime === 'number' &&
    typeof endTime === 'number' &&
    endTime - startTime > 600
  ) {
    errors.push('Segment is suspiciously long (> 10 min)');
  }

  if (typeof category !== 'string' || !VALID_CATEGORY_SET.has(category)) {
    errors.push(
      `category must be one of: ${VALID_CATEGORIES.join(', ')}`
    );
  }

  if (note !== undefined && (typeof note !== 'string' || note.length > 500)) {
    errors.push('note must be a string under 500 characters');
  }

  if (errors.length > 0) {
    return c.json({ error: 'Validation failed', details: errors }, 422);
  }

  const keyword = (title as string).trim().toLowerCase().replace(/\s+/g, ' ');

  const { data, error } = await db
    .from('submissions')
    .insert({
      title: (title as string).trim(),
      keyword,
      start_time: startTime,
      end_time: endTime,
      category: category as Category,
      note: note ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error);
    return c.json({ error: 'Database error' }, 500);
  }

  return c.json({ submission: data });
});