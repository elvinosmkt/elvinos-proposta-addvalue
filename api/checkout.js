import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, cpf, quantity } = req.body;
  
  if (!name || !email || !cpf || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const TICKET_PRICE = 310.00;
  const totalPrice = TICKET_PRICE * parseInt(quantity);
  
  // Use environment variables (fallback to hardcoded for local testing if needed, though they should be in Vercel)
  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Create or get customer in Asaas
    let customerId;
    try {
      const customerRes = await axios.post('https://api.asaas.com/v3/customers', {
        name,
        email,
        phone,
        cpfCnpj: cpf,
        notificationDisabled: true
      }, {
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      customerId = customerRes.data.id;
    } catch (err) {
      // If customer exists, we might need to search for it, but Asaas usually creates a new one or returns existing.
      // Assuming it succeeds. If fails, handle it.
      if (err.response && err.response.data && err.response.data.errors) {
        console.error('Asaas Customer Error:', err.response.data.errors);
        const errorMessage = err.response.data.errors[0]?.description || 'Failed to create customer in Asaas';
        return res.status(400).json({ error: errorMessage });
      }
      throw err;
    }

    // 2. Create Pix Payment
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow
    const dueDateString = dueDate.toISOString().split('T')[0];

    const paymentRes = await axios.post('https://api.asaas.com/v3/payments', {
      customer: customerId,
      billingType: 'PIX',
      value: totalPrice,
      dueDate: dueDateString,
      description: `Executive Wine Club - ${quantity} Ingresso(s)`
    }, {
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const paymentId = paymentRes.data.id;

    // 3. Get Pix QR Code
    const qrCodeRes = await axios.get(`https://api.asaas.com/v3/payments/${paymentId}/pixQrCode`, {
      headers: {
        'access_token': ASAAS_API_KEY
      }
    });

    const { encodedImage, payload } = qrCodeRes.data;

    // 4. Save to Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('tickets')
      .insert([
        {
          name,
          email,
          phone,
          quantity: parseInt(quantity),
          total_price: totalPrice,
          asaas_payment_id: paymentId,
          status: 'PENDING'
        }
      ]);

    if (dbError) {
      console.error('Supabase Error:', dbError);
    }

    // 5. Return success
    return res.status(200).json({
      success: true,
      paymentId,
      qrCodeImage: encodedImage,
      qrCodePayload: payload
    });

  } catch (error) {
    console.error('Checkout Error:', error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.errors?.[0]?.description || 'Internal server error processing checkout';
    return res.status(500).json({ error: errorMessage });
  }
}
