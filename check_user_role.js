
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service key to bypass RLS if anon can't read all

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function checkAndFixUser() {
    const email = 'admin@test.com';
    console.log(`Checking user: ${email}...`);

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.error('User profile not found!');
        return;
    }

    const profile = profiles[0];
    console.log('Current Profile:', profile);

    if (profile.role !== 'admin' || profile.client_code !== 'perezoso_cafe') {
        console.log('Updating user to Admin / Perezoso Cafe...');
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin', client_code: 'perezoso_cafe' })
            .eq('id', profile.id)
            .select();

        if (updateError) {
            console.error('Error updating profile:', updateError);
        } else {
            console.log('User updated successfully:', data);
        }
    } else {
        console.log('User is already verified as Admin.');
    }
}

checkAndFixUser();
