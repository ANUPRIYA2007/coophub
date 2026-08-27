const fs = require('fs');
const dotenv = require('dotenv');

let envConfig = {};
if (fs.existsSync('.env')) Object.assign(envConfig, dotenv.parse(fs.readFileSync('.env')));
if (fs.existsSync('.env.local')) Object.assign(envConfig, dotenv.parse(fs.readFileSync('.env.local')));

const url = envConfig.VITE_SUPABASE_URL;
const key = envConfig.VITE_SUPABASE_ANON_KEY;

async function testSignup() {
    console.log('--- TESTING REAL SIGNUP ---');
    console.log('Email: ranu.it2024+test3@rmd.ac.in');

    // Perform standard signup using raw fetch to avoid ws dependency
    const res = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
            'apikey': key,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'ranu.it2024+test3@rmd.ac.in',
            password: 'Password2026!',
            data: { full_name: 'E2E Test User', role: 'customer' }
        })
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('SIGNUP ERROR:', res.status, data.msg || data.error_description || data);
        console.log('--- CHECK YOUR SUPABASE OR PROVIDER LIMITS ---');
    } else {
        console.log('SIGNUP SUCCESS!', res.status);
        if (data?.user?.identities?.length === 0) {
            console.log('NOTE: User already exists but login attempted (Fake Signup behavior).');
        } else {
            console.log('A real confirmation email should have been delivered to ranu.it2024@rmd.ac.in (or your inbox).');
            console.log('User UUID:', data.user ? data.user.id : 'N/A');
        }
    }
}
testSignup();
