import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const email = process.argv[2];
const role = process.argv[3] ?? 'admin';
const { data: { users } } = await supabase.auth.admin.listUsers();
const user = users.find(u => u.email === email);
if (!user) { console.error('User not found:', email); process.exit(1); }
const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: { ...user.app_metadata, role },
});
if (error) { console.error('ERR', error); process.exit(1); }
console.log('OK', data.user.email, '->', data.user.app_metadata.role);
