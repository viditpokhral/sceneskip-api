import { Hono } from 'hono';
import { db } from '../db.js';

export const submissionsRouter = new Hono();

const VALID_CATEGORIES = new Set(['nudity', 'violence', 'gore', 'drug_use', 'profanity']);

// POST /submissions
// Body: { title, startTime, endTime, category, note? }
submissionsRouter.post('/', async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { title, startTime, endTime, category, note } = body as Record<string, unknown>;

  // ---- Validation ----
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
  if (typeof startTime === 'number' && typeof endTime === 'number' && endTime <= startTime) {
    errors.push('endTime must be greater than startTime');
  }
  if (typeof endTime === 'number' && typeof startTime === 'number' && (endTime - startTime) > 600) {
    errors.push('Segment is suspiciously long (> 10 min). Double-check the timestamps.');
  }
  if (typeof category !== 'string' || !VALID_CATEGORIES.has(category)) {
    errors.push(`category must be one of: ${[...VALID_CATEGORIES].join(', ')}`);
  }
  if (note !== undefined && (typeof note !== 'string' || note.length > 500)) {
    errors.push('note must be a string under 500 characters');
  }

  if (errors.length > 0) {
    return c.json({ error: 'Validation failed', details: errors }, 422);
  }

  // ---- Persist ----
  const keyword = (title as string).trim().toLowerCase().replace(/\s+/g, ' ');

  const { data, error } = await db
    .from('submissions')
    .insert({
      keyword,
      start_time: startTime,
      end_time: endTime,
      category,
      title: (title as string).trim(),
      submitter_note: note ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Submission insert failed:', error);
    return c.json({ error: 'Database error' }, 500);
  }

  return c.json({ id: data.id, status: 'pending' }, 201);
});
