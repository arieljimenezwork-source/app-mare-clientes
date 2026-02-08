
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', url);
console.log('Anon Key:', anonKey);
console.log('Service Key:', serviceKey ? serviceKey.substring(0, 20) + '...' : 'undefined');

// Decode JWT
function decodeJwt(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return 'Not a JWT';
    try {
        const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
        return JSON.parse(payload);
    } catch (e) {
        return 'Invalid JWT';
    }
}

console.log('--- Service Key Payload ---');
console.log(decodeJwt(serviceKey));

async function testConnection() {
    console.log('\n--- Testing Anon Key ---');
    const anonClient = createClient(url, anonKey);
    const { data: anonData, error: anonError } = await anonClient.from('profiles').select('count').limit(1);
    console.log('Anon Query Result:', anonError ? anonError.message : 'Success');

    console.log('\n--- Testing Service Key ---');
    const serviceClient = createClient(url, serviceKey);
    const { data: serviceData, error: serviceError } = await serviceClient.from('profiles').select('count', { count: 'exact', head: true });
    // Using head: true to just check access
    console.log('Service Query Result:', serviceError ? serviceError.message : 'Success');

    const { data: users, error: userError } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    console.log('Admin ListUsers Result:', userError ? userError.message : 'Success');
}

testConnection();
