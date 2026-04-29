const axios = require('axios');

const SUPABASE_TOKEN = 'sbp_ea03d740d3e32ae7995f0abadd0815e0c032dc5b';
const REF = 'znglrjaoqwfsotcurcrx';

async function getKeys() {
  try {
    const res = await axios.get(`https://api.supabase.com/v1/projects/${REF}/api-keys`, {
      headers: { Authorization: `Bearer ${SUPABASE_TOKEN}` }
    });
    console.log(res.data);
  } catch (error) {
    console.error('Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

getKeys();
