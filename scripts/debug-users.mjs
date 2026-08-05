import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf-8").split("\n").filter(l=>l.includes("=")).map(l=>{const[k,...v]=l.split("=");return[k,v.join("=")];}));
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{ autoRefreshToken:false, persistSession:false }});
const { data } = await s.auth.admin.listUsers({ perPage:100 });
for (const u of data.users) {
  const { data: us } = await s.from("user_studios").select("studio_id").eq("user_id", u.id);
  console.log(u.email, "| role:", JSON.stringify(u.app_metadata?.role), "| user_studios:", us?.length ?? 0);
}
