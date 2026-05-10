/**
 * Idempotent seed loader for the `sources` table.
 * Run: npx tsx supabase/seed/load_sources.ts
 *
 * Requires env vars (from .env.local or environment):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const sources = JSON.parse(
  readFileSync(resolve(__dirname, 'sources.json'), 'utf-8'),
);

async function main() {
  console.log(`Upserting ${sources.length} sources…`);

  const { data, error } = await supabase
    .from('sources')
    .upsert(sources, { onConflict: 'id' })
    .select('id');

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(`Done — ${data?.length ?? 0} rows upserted.`);
}

main();
