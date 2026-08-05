import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf-8").split("\n").filter(l=>l.includes("=")).map(l=>{const[k,...v]=l.split("=");return[k,v.join("=")];}));
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = createClient(URL, SERVICE, { auth: { autoRefreshToken:false, persistSession:false }});

const email = `debug-role-${Date.now().toString(36)}@quvex.test`;
await service.auth.admin.createUser({ email, password:"Debug123!", email_confirm:true });

// Simulate the browser: sign in, session persisted in this client
const user = createClient(URL, ANON, { auth: { autoRefreshToken:false, persistSession:true }});
await user.auth.signInWithPassword({ email, password:"Debug123!" });
const tokenBefore = (await user.auth.getSession()).data.session.access_token;
console.log("JWT role BEFORE promotion:", JSON.stringify(JSON.parse(Buffer.from(tokenBefore.split(".")[1],"base64url").toString()).app_metadata?.role));

// Promote in DB (what promote-admin did for amramrslnv@gmail.com)
await service.auth.admin.updateUserById((await service.auth.admin.listUsers()).data.users.find(u=>u.email===email).id, { app_metadata: { role: "admin" } });
console.log("role in DB AFTER promotion:", JSON.stringify((await service.auth.admin.listUsers()).data.users.find(u=>u.email===email).app_metadata));

// 1) getUser() no args (uses stored session)
const r1 = await user.auth.getUser();
console.log("1. getUser() stored session -> role:", JSON.stringify(r1.data.user?.app_metadata?.role), "| err:", r1.error?.message ?? "none");

// 2) getUser(staleJwt) directly
const r2 = await user.auth.getUser(tokenBefore);
console.log("2. getUser(staleJwt) -> role:", JSON.stringify(r2.data.user?.app_metadata?.role), "| err:", r2.error?.message ?? "none");

await service.auth.admin.deleteUser((await service.auth.admin.listUsers()).data.users.find(u=>u.email===email).id);
