import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Simple password protection
  const { pass } = req.query;
  if (pass !== 'batata123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }

  return res.status(200).json({ tickets: data });
}
