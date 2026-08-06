import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf-8").split("\n").filter(l=>l.includes("=")).map(l=>{const[k,...v]=l.split("=");return[k,v.join("=")];}));
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{ autoRefreshToken:false, persistSession:false }});

const stamp = Date.now().toString(36);
const name = "Тест Студия";
const email = `test-studio-${stamp}@quvex.test`;
const password = "TestStudio123!";

const { data:u, error:ue } = await s.auth.admin.createUser({ email, password, email_confirm:true, app_metadata:{ role:"studio" } });
if (ue) { console.error("createUser:", ue.message); process.exit(1); }

const { data:studio, error:se } = await s.from("studios").insert({
  name, slug:`test-studio-${stamp}`, owner_email:email,
  settings:{ primary_color:"#a855f7" },
}).select().single();
if (se) { console.error("studio:", se.message); process.exit(1); }

await s.from("user_studios").insert({ user_id:u.user.id, studio_id:studio.id, role:"owner" });

const defaults = [
  ["Мойка кузова", 2000], ["Мойка двигателя", 3000], ["Химчистка салона", 8000],
  ["Полировка кузова", 12000], ["Керамическое покрытие", 25000], ["Защитная плёнка", 35000],
  ["Тонировка", 10000], ["Восстановление фар", 5000], ["Детейлинг-уход", 15000], ["Озонирование", 4000],
];
const { error: serr } = await s.from("studio_services").insert(defaults.map(([n,p]) => ({ studio_id:studio.id, name:n, price:p, category:"detailing" })));
if (serr) console.log("seed services:", serr.message);

const { error: perr } = await s.from("payments").insert({ studio_id:studio.id, amount:1990, status:"paid", period_start:new Date().toISOString() });
if (perr) console.log("payment:", perr.message);

console.log("\n=== АККАУНТ СТУДИИ ===");
console.log("Название:", name);
console.log("Ссылка:", `http://localhost:3000/studio/${studio.slug}`);
console.log("Логин:", email);
console.log("Пароль:", password);
