import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf-8").split("\n").filter(l=>l.includes("=")).map(l=>{const[k,...v]=l.split("=");return[k,v.join("=")];}));
const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken:false, persistSession:false }});
const { data } = await service.auth.admin.listUsers({ page:1, perPage:100 });
for (const u of data.users) {
  console.log(u.email, "| role:", JSON.stringify(u.app_metadata?.role), "| created:", u.created_at);
}
