const fs = require('fs');
const dotenv = require('dotenv');

let envConfig = {};
if (fs.existsSync('.env')) Object.assign(envConfig, dotenv.parse(fs.readFileSync('.env')));
if (fs.existsSync('.env.local')) Object.assign(envConfig, dotenv.parse(fs.readFileSync('.env.local')));

const url = envConfig.VITE_SUPABASE_URL;
const key = envConfig.VITE_SUPABASE_ANON_KEY;

async function testSupabase() {
    console.log('Testing unauthorized profiles SELECT...');
    const pRes = await fetch(`${url}/rest/v1/profiles?select=*`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const pData = await pRes.json();
    console.log('Profiles RLS Empty Array (Blocked):', pData.length === 0 ? 'VERIFIED' : 'FAILED');

    console.log('Testing Auth system...');
    const authRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'fake@example.com', password: 'bad' })
    });
    const authData = await authRes.json();
    console.log('Auth Reject Message:', authData.error_description || authData.msg || authData);
}
testSupabase();
