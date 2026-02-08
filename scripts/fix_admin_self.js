
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    console.error('Missing URL or Anon Key');
    process.exit(1);
}

const supabase = createClient(url, anonKey);

async function attemptSelfElevation() {
    const email = 'admin@test.com';
    const password = '123456';

    console.log(`Logging in as ${email}...`);
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login failed:', loginError.message);
        return;
    }

    console.log('Login successful. Attempting to update profile...');
    console.log('User ID:', session.user.id);

    // Update Profile
    const { data, error } = await supabase
        .from('profiles')
        .update({
            role: 'admin',
            client_code: 'perezoso_cafe'
        })
        .eq('id', session.user.id)
        .select();

    if (error) {
        console.error('Update failed (likely RLS):', error.message);
        console.log('Hint: The "role" column is usually protected. You need the Service Role Key to bypass this.');
    } else {
        console.log('Success! Profile updated:', data);
    }
}

attemptSelfElevation();
