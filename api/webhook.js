import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body;
  const event = payload.event;
  
  if (!event) {
    return res.status(400).json({ error: 'No event provided' });
  }

  // We only care about payments received/confirmed
  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const paymentId = payload.payment?.id;

    if (!paymentId) {
      return res.status(400).json({ error: 'No payment id in payload' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    // For updating via API, it's safer to use service role key to bypass RLS, but ANON key works if RLS is disabled.
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Server configuration missing' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { error } = await supabase
      .from('tickets')
      .update({ status: 'PAID' })
      .eq('asaas_payment_id', paymentId);

    if (error) {
      console.error('Webhook DB Update Error:', error);
      return res.status(500).json({ error: 'Database update failed' });
    }
  }

  // Return 200 OK so Asaas knows we received it
  return res.status(200).json({ received: true });
}
