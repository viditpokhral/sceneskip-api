import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';


dotenv.config()

const url = process.env.SUPABASE_URL;

// Support both naming conventions in case your env uses the legacy name
const key =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error('Missing SUPABASE_URL in environment');
}
if (!key) {
  throw new Error(
    'Missing Supabase secret key — set SUPABASE_SECRET_KEY (the "Secret" key from the API settings page, NOT the Publishable key)',
  );
}

export const db = createClient(url, key, {
  auth: { persistSession: false },
});

console.log("SUPABASE KEY START:", key?.slice(0, 20));
console.log("URL:", process.env.SUPABASE_URL);
console.log("SERVICE ROLE:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);