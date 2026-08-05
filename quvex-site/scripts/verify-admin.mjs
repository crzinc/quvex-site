import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf-8").split("\n").filter(l=>l.includes("=")).map(l=>{const[k,...v]=l.split("=");return[k,v.join("=")];}));
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = createClient(URL, SERVICE, { auth: { autoRefreshToken:false, persistSession:false }});
const admin = createClient(URL, ANON, { auth: { autoRefreshToken:false, persistSession:false }});

const stamp = Date.now().toString(36);
const email = `tmp-admin-${stamp}@quvex.test`;
const { data:u } = await service.auth.admin.createUser({ email, password:"TmpAdmin123!", email_confirm:true, app_metadata:{ role:"admin" } });
const { data:studio } = await service.from("studios").insert({ name:"Seeded", slug:`seed-${stamp}`, owner_email:`seed-${stamp}@x.test` }).select().single();
await service.from("studio_clients").insert({ studio_id: studio.id, name:"SeededClient" });
await service.from("payments").insert({ studio_id: studio.id, amount: 100, status: "paid" });
await service.from("clients").insert({ name: "SeededLead", source: "test" });

const { data:si } = await admin.auth.signInWithPassword({ email, password:"TmpAdmin123!" });
console.log("temp admin role:", si.user.app_metadata.role);

const s = await admin.from("studios").select("id");
const c = await admin.from("studio_clients").select("id");
const cl = await admin.from("clients").select("id");
const p = await admin.from("payments").select("id");
console.log("studios visible:", s.data?.length, "err:", s.error?.message ?? "none");
console.log("all studio_clients visible:", c.data?.length, "err:", c.error?.message ?? "none");
console.log("clients (leads) visible:", cl.data?.length, "err:", cl.error?.message ?? "none");
console.log("payments visible:", p.data?.length, "err:", p.error?.message ?? "none");

await service.from("clients").delete().eq("source","test");
await service.from("payments").delete().eq("studio_id", studio.id);
await service.from("studio_clients").delete().eq("studio_id", studio.id);
await service.from("studios").delete().eq("id", studio.id);
await service.auth.admin.deleteUser(u.user.id);
console.log("cleaned up");
