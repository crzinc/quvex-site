// End-to-end isolation test:
// 1. Create a studio account (service role, same as the admin flow)
// 2. Sign in as the studio owner (anon key) — verify they see ONLY their own data
// 3. Sign in as admin — verify they see everything
//
// Run: node scripts/verify-isolation.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k, v.join("=")];
    }),
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const service = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = (token) => createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });

const stamp = Date.now().toString(36);
const studioEmail = `test-${stamp}@quvex.test`;
const studioName = `Тест Студия ${stamp}`;
const password = "TestPass123!";

// ---- 1. Create studio (mirrors createStudioAccount) ----
console.log("\n== 1. Create studio account ==");
const { data: userData, error: userError } = await service.auth.admin.createUser({
  email: studioEmail,
  password,
  email_confirm: true,
  app_metadata: { role: "studio" },
});
if (userError) { console.error("createUser FAIL", userError.message); process.exit(1); }
const userId = userData.user.id;
console.log("user created:", userId);

const { data: studio, error: studioError } = await service
  .from("studios")
  .insert({ name: studioName, slug: `test-${stamp}`, owner_email: studioEmail, plan: "basic", settings: { primary_color: "#a855f7" } })
  .select()
  .single();
if (studioError) { console.error("insert studio FAIL", studioError.message); process.exit(1); }
console.log("studio created:", studio.id, studio.slug);

await service.from("user_studios").insert({ user_id: userId, studio_id: studio.id, role: "owner" });

// Add a service + client for this studio (so isolation is testable)
await service.from("studio_services").insert({ studio_id: studio.id, name: "Полировка", price: 8000, category: "detailing" });
await service.from("studio_clients").insert({ studio_id: studio.id, name: "Клиент Студии A", phone: "+70000000001" });

// ---- 2. Sign in as studio owner ----
console.log("\n== 2. Studio owner access ==");
const owner = anon();
const { data: signIn, error: signInErr } = await owner.auth.signInWithPassword({ email: studioEmail, password });
if (signInErr) { console.error("signIn FAIL", signInErr.message); process.exit(1); }
console.log("role in JWT:", signIn.user.app_metadata.role);

const check = async (label, query) => {
  const { data, error } = await query;
  console.log(`  [${label}] rows=${data?.length ?? data ? 1 : 0} err=${error?.message ?? "none"}`);
  return { data, error };
};

await check("own studio_clients", owner.from("studio_clients").select("id"));
await check("own studio_services", owner.from("studio_services").select("id"));
await check("other clients (admin leads)", owner.from("clients").select("id"));
await check("notes (admin)", owner.from("notes").select("id"));
await check("notifications (admin)", owner.from("notifications").select("id"));
await check("payments (all tenants)", owner.from("payments").select("id"));
await check("studios (all tenants)", owner.from("studios").select("id"));

// ---- 3. Sign in as admin ----
console.log("\n== 3. Admin access ==");
const admin = anon();
const { data: adminSignIn, error: adminSignInErr } = await admin.auth.signInWithPassword({
  email: env.TEST_ADMIN_EMAIL || "amramrslnv@gmail.com",
  password: env.TEST_ADMIN_PASSWORD,
});
if (adminSignInErr) { console.error("admin signIn FAIL — set TEST_ADMIN_PASSWORD in env"); console.log("  (skipping admin checks)"); }
else {
  console.log("admin role:", adminSignIn.user.app_metadata.role);
  await check("all studios", admin.from("studios").select("id"));
  await check("all studio_clients", admin.from("studio_clients").select("id"));
  await check("all payments", admin.from("payments").select("id"));
}

// ---- 4. Cleanup test studio ----
console.log("\n== 4. Cleanup ==");
await service.from("user_studios").delete().eq("user_id", userId);
await service.from("studios").delete().eq("id", studio.id);
await service.auth.admin.deleteUser(userId);
console.log("test studio removed");
