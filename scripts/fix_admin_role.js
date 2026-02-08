
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', supabaseServiceKey ? supabaseServiceKey.length : 'undefined');
console.log('Key start:', supabaseServiceKey ? supabaseServiceKey.substring(0, 10) : 'undefined');
// console.log('Key end:', supabaseServiceKey ? supabaseServiceKey.substring(supabaseServiceKey.length - 10) : 'undefined');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixAdminRole() {
    const email = 'admin@test.com';
    console.log(`Fixing role for user: ${email}...`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error fetching users:', userError);
        // return; 
        // CONTINUE EVEN IF ERROR to try direct profile update?
        // No, if listUsers fails, direct profile update via service role MIGHT work if profiles is not protected by auth.admin?
        // But usually RLS for profiles might allow service role.
    }

    let userId = null;
    if (users) {
        const user = users.find(u => u.email === email);
        if (user) userId = user.id;
    }

    if (!userId) {
        console.log("Could not find user via auth.admin.listUsers(). Trying to find via profiles lookup (if possible)...");
        const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
        if (profile) userId = profile.id;
    }

    if (!userId) {
        console.error(`User ${email} not found.`);
        return;
    }

    console.log(`Found User ID: ${userId}`);

    // 2. Update Profile
    const { data, error } = await supabase
        .from('profiles')
        .update({
            role: 'admin',
            client_code: 'perezoso_cafe'
        })
        .eq('id', userId)
        .select();

    if (error) {
        console.error('Error updating profile:', error);
    } else {
        console.log('Success! Profile updated:', data);
    }

    // 3. Verify Auth Metadata
    const { data: authUpdate, error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { role: 'admin', client_code: 'perezoso_cafe' } }
    );

    if (authError) {
        console.error('Error updating auth metadata:', authError);
    } else {
        console.log('Auth metadata updated.');
    }
}

fixAdminRole();
