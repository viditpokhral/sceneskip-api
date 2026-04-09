import { Hono } from 'hono';
import { db } from '../db.js';
import { adminAuth } from '../middleware/adminAuth.js';

export const adminRouter = new Hono();

// All admin routes require a valid Bearer token
adminRouter.use('*', adminAuth);

// ----------------------------------------------------------------
// GET /admin/submissions?status=pending&limit=50&offset=0
// List submissions, defaulting to pending ones
// ----------------------------------------------------------------
adminRouter.get('/submissions', async (c) => {
  const status = c.req.query('status') ?? 'pending';
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
  const offset = Number(c.req.query('offset') ?? 0);

  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return c.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, 400);
  }

  const { data, error, count } = await db
    .from('submissions')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to list submissions:', error);
    return c.json({ error: 'Database error' }, 500);
  }

  return c.json({ submissions: data ?? [], total: count ?? 0, limit, offset });
});

// ----------------------------------------------------------------
// PATCH /admin/submissions/:id
// Body: { action: "approve" | "reject", note?: string }
//
// approve → copies row into timestamps table, marks submission approved
// reject  → marks submission rejected (stays in submissions, not promoted)
// ----------------------------------------------------------------
adminRouter.patch('/submissions/:id', async (c) => {
  const { id } = c.req.param();

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { action, note } = body as Record<string, unknown>;

  if (action !== 'approve' && action !== 'reject') {
    return c.json({ error: 'action must be "approve" or "reject"' }, 422);
  }

  // Fetch the submission
  const { data: submission, error: fetchErr } = await db
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !submission) {
    return c.json({ error: 'Submission not found' }, 404);
  }

  if (submission.status !== 'pending') {
    return c.json(
      { error: `Submission is already ${submission.status}` },
      409,
    );
  }

  if (action === 'approve') {
    // Generate a deterministic ID so re-approving the same submission is idempotent
    const timestampId = `sub-${id.slice(0, 8)}`;

    const { error: insertErr } = await db.from('timestamps').upsert({
      id: timestampId,
      keyword: submission.keyword,
      start_time: submission.start_time,
      end_time: submission.end_time,
      category: submission.category,
      title: submission.title,
    });

    if (insertErr) {
      console.error('Failed to promote submission to timestamps:', insertErr);
      return c.json({ error: 'Database error during promotion' }, 500);
    }
  }

  // Update submission status
  const { error: updateErr } = await db
    .from('submissions')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_at: new Date().toISOString(),
      ...(note ? { admin_note: String(note) } : {}),
    })
    .eq('id', id);

  if (updateErr) {
    console.error('Failed to update submission status:', updateErr);
    return c.json({ error: 'Database error during status update' }, 500);
  }

  return c.json({
    id,
    action,
    promoted: action === 'approve',
  });
});

// ----------------------------------------------------------------
// DELETE /admin/timestamps/:id
// Remove a timestamp from production (mistakes happen)
// ----------------------------------------------------------------
adminRouter.delete('/timestamps/:id', async (c) => {
  const { id } = c.req.param();

  const { error } = await db.from('timestamps').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete timestamp:', error);
    return c.json({ error: 'Database error' }, 500);
  }

  return c.json({ id, deleted: true });
});

// ----------------------------------------------------------------
// POST /admin/timestamps
// Directly insert a verified timestamp (for manual curation)
// ----------------------------------------------------------------
adminRouter.post('/timestamps', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { id, title, startTime, endTime, category } = body as Record<string, unknown>;

  const VALID_CATEGORIES = new Set(['nudity', 'violence', 'gore', 'drug_use', 'profanity']);
  const errors: string[] = [];

  if (typeof id !== 'string' || id.trim().length < 2) errors.push('id required');
  if (typeof title !== 'string' || title.trim().length < 2) errors.push('title required');
  if (typeof startTime !== 'number' || startTime < 0) errors.push('startTime must be >= 0');
  if (typeof endTime !== 'number' || endTime <= 0) errors.push('endTime must be > 0');
  if (typeof startTime === 'number' && typeof endTime === 'number' && endTime <= startTime) {
    errors.push('endTime must be greater than startTime');
  }
  if (typeof category !== 'string' || !VALID_CATEGORIES.has(category)) {
    errors.push(`category must be one of: ${[...VALID_CATEGORIES].join(', ')}`);
  }

  if (errors.length > 0) {
    return c.json({ error: 'Validation failed', details: errors }, 422);
  }

  const keyword = (title as string).trim().toLowerCase().replace(/\s+/g, ' ');

  const { error } = await db.from('timestamps').upsert({
    id: (id as string).trim(),
    keyword,
    start_time: startTime,
    end_time: endTime,
    category,
    title: (title as string).trim(),
  });

  if (error) {
    console.error('Failed to insert timestamp:', error);
    return c.json({ error: 'Database error' }, 500);
  }

  return c.json({ id, status: 'created' }, 201);
});
