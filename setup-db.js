const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:SupabasePass!123_ExecWine123@db.znglrjaoqwfsotcurcrx.supabase.co:5432/postgres'
});

async function setup() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        quantity INTEGER NOT NULL,
        total_price NUMERIC(10,2) NOT NULL,
        asaas_payment_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "tickets" created successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

setup();
