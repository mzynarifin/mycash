// ============================================================
// setup-db.mjs
// Applies migrations 001–011 and seeds demo data (users,
// expenses, bills, payments) automatically.
//
// Usage (from repo root):
//   node scripts/setup-db.mjs
//
// Required env:
//   SUPABASE_ACCESS_TOKEN   – Supabase Personal Access Token
//                             (needed to run SQL on the hosted project)
//   SUPABASE_SERVICE_ROLE_KEY – optional; fetched via API if missing
//
// Reads NEXT_PUBLIC_SUPABASE_URL from .env.local when present.
// ============================================================

import { readFileSync, readdirSync, existsSync, appendFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- minimal .env.local / .env loader -----------------------
function loadDotEnv(file) {
  const full = join(ROOT, file);
  if (!existsSync(full)) return {};
  const out = {};
  for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val && !out[m[1]]) out[m[1]] = val;
  }
  return out;
}

const env = { ...loadDotEnv(".env.local"), ...loadDotEnv(".env"), ...process.env };

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN ?? "";
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY ?? "";

function requireValue(name, value) {
  if (!value) {
    console.error(`[setup-db] Missing required env: ${name}`);
    process.exit(1);
  }
}

requireValue("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
if (!ACCESS_TOKEN && !SERVICE_KEY) {
  console.error("[setup-db] Missing admin credential. Add ONE of these to .env.local:");
  console.error('  a) SUPABASE_ACCESS_TOKEN  = SB_PERSONAL_ACCESS_TOKEN  (recommended – also applies migrations)');
  console.error('     Generate at: https://supabase.com/dashboard/account/tokens');
  console.error('  b) SUPABASE_SECRET_KEY    = sb_secret_... (service role)');
  console.error('     Copy at:   https://supabase.com/dashboard/project/ptxahuntbtpxmgrqwxij/settings/api');
  process.exit(1);
}

const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
const MGMT = `https://api.supabase.com/v1/projects/${ref}`;

async function management(endpoint, options = {}) {
  if (!ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN required for this step.");
  const res = await fetch(`${MGMT}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Management API ${endpoint} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function runSql(sql) {
  const text = await management("/database/query", {
    method: "POST",
    body: JSON.stringify({ query: sql }),
  });
  return text;
}

// ---- 1. apply migrations ------------------------------------
async function applyMigrations() {
  const dir = join(ROOT, "supabase", "migrations");
  if (!existsSync(dir)) {
    console.warn("[setup-db] No supabase/migrations directory; skipping.");
    return;
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  console.log(`[setup-db] Applying ${files.length} migration(s)…`);
  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    try {
      await runSql(sql);
      console.log(`  ✓ ${file}`);
    } catch (err) {
      const msg = String(err.message ?? err);
      const already = /already exists|duplicate object|multiple primary keys/i.test(msg);
      if (!already) {
        console.error(`  ✗ ${file}`);
        throw err;
      }
      console.warn(`  ~ ${file} (already applied, skipping)`);
    }
  }
}

// ---- 2. service role key ------------------------------------
async function getServiceKey() {
  if (SERVICE_KEY) return SERVICE_KEY;
  const keys = await management("/api-keys");
  const service = keys.find((k) => k.name === "service_role");
  if (!service?.api_key) throw new Error("service_role key not found on project.");
  return service.api_key;
}

function appendEnv(name, value) {
  const envFile = join(ROOT, ".env.local");
  if (!envFile) return;
  const existing = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
  if (new RegExp(`^${name}=`, "m").test(existing)) return;
  const line = existing && !existing.endsWith("\n") ? `\n${name}="${value}"\n` : `${name}="${value}"\n`;
  appendFileSync(envFile, line);
  console.log(`[setup-db] Wrote ${name} to .env.local (do not commit).`);
}

// ---- 3. demo users ------------------------------------------
const DEMO_USERS = [
  {
    email: "admin@mycash.demo",
    nim: "000000000001",
    password: "Admin123!",
    role: "admin",
    fullName: "Admin Demo",
    suspend: false,
  },
  {
    email: "demo@mycash.demo",
    nim: "221011400123",
    password: "Demo123!",
    role: "user",
    fullName: "Demo User",
    suspend: false,
  },
  {
    email: "suspended@mycash.demo",
    nim: "221011400124",
    password: "Suspend123!",
    role: "user",
    fullName: "User Suspended",
    suspend: true,
  },
];

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function findUserIdByEmail(supabase, email) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw new Error(`listUsers failed: ${error.message}`);
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function seedUsers(supabase) {
  console.log("[setup-db] Seeding demo users…");
  const userIds = {};
  for (const u of DEMO_USERS) {
    let userId = await findUserIdByEmail(supabase, u.email);
    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });
      if (error) throw new Error(`createUser ${u.email} failed: ${error.message}`);
      userId = data.user.id;
      console.log(`  ✓ created ${u.email}`);
    } else {
      console.log(`  ~ ${u.email} already exists`);
    }
    userIds[u.email] = userId;

    await supabase.from("user_roles").upsert(
      { user_id: userId, role: u.role },
      { onConflict: "user_id" }
    );

    if (u.suspend) {
      await supabase.from("profiles").update({ is_suspended: true }).eq("id", userId);
    }
  }

  // admin created via auth trigger defaults to 'user'; ensure profile email sync
  console.log("[setup-db] Syncing profiles.email and NIM for demo users…");
  for (const u of DEMO_USERS) {
    await supabase
      .from("profiles")
      .update({ email: u.email, nim: u.nim })
      .eq("id", userIds[u.email]);
  }
  return userIds;
}

// ---- 4. sample data -----------------------------------------
async function seedExpenses(supabase, demoUserId) {
  const { count } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", demoUserId);
  if ((count ?? 0) > 0) {
    console.log("  ~ sample expenses already exist for demo user");
    return;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", demoUserId);
  const byName = new Map((categories ?? []).map((c) => [c.name, c.id]));

  const cat = (name) => byName.get(name) ?? null;
  const rows = [
    ["Makanan", 45000, "Nasi goreng + es teh", -1, "e_wallet", "Makan siang di warteg"],
    ["Transportasi", 25000, "Bensin", -2, "cash", null],
    ["Tagihan", 150000, "Pulsa & kuota", -3, "bank_transfer", null],
    ["Belanja", 275000, "Belanja bulanan", -5, "debit_card", "Bahan makanan seminggu"],
    ["Hiburan", 120000, "Nonton bioskop", -7, "e_wallet", null],
    ["Kesehatan", 75000, "Vitamin", -9, "cash", null],
    ["Makanan", 38000, "Kopi & sarapan", -12, "e_wallet", null],
    ["Pendidikan", 200000, "Kursus online", -14, "bank_transfer", "Langganan bulanan"],
    ["Belanja", 95000, "Perlengkapan rumah", -18, "credit_card", null],
    ["Lainnya", 52000, "Top up e-wallet", -21, "e_wallet", null],
    ["Transportasi", 60000, "Ganti oli", -25, "cash", null],
    ["Makanan", 110000, "Makan malam keluarga", -28, "debit_card", null],
  ];

  const { error } = await supabase.from("expenses").insert(
    rows
      .map(([name, amount, description, day, method, notes]) => {
        const categoryId = cat(name);
        if (!categoryId) return null;
        return {
          user_id: demoUserId,
          category_id: categoryId,
          amount,
          description,
          expense_date: daysFromNow(day),
          payment_method: method,
          notes,
        };
      })
      .filter(Boolean)
  );
  if (error) throw new Error(`seedExpenses failed: ${error.message}`);
  console.log("  ✓ sample expenses inserted");
}

async function seedBillsAndPayments(supabase, demoUserId, adminUserId) {
  const { data: existingBills } = await supabase.from("bills").select("id, title");
  const titleIds = new Map((existingBills ?? []).map((b) => [b.title, b.id]));

  async function ensureBill(title, amount, dueInDays, status) {
    if (titleIds.has(title)) return titleIds.get(title);
    const { data, error } = await supabase
      .from("bills")
      .insert({
        title,
        description: "",
        reference: `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        amount,
        issue_date: daysFromNow(-1),
        due_date: daysFromNow(dueInDays),
        status,
        created_by: adminUserId,
      })
      .select("id")
      .single();
    if (error) throw new Error(`ensureBill failed: ${error.message}`);
    titleIds.set(title, data.id);
    return data.id;
  }

  const activeBillId = await ensureBill("SPP Bulan Ini", 1500000, 10, "active");
  await ensureBill("Iuran Kebersihan", 50000, 21, "active");
  await ensureBill("Sumbangan Tahun Lalu", 75000, 30, "archived");

  const { data: assignments } = await supabase
    .from("bill_assignments")
    .select("id, bill_id, user_id")
    .eq("user_id", demoUserId);
  const assignment = assignments?.find((a) => a.bill_id === activeBillId);

  let assignmentId = assignment?.id ?? null;
  if (!assignmentId) {
    const { data, error } = await supabase
      .from("bill_assignments")
      .insert({ bill_id: activeBillId, user_id: demoUserId })
      .select("id")
      .single();
    if (error) throw new Error(`assignBill failed: ${error.message}`);
    assignmentId = data.id;
  }

  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("assignment_id", assignmentId)
    .eq("status", "pending");
  if ((count ?? 0) === 0) {
    const { error } = await supabase.from("payments").insert({
      assignment_id: assignmentId,
      user_id: demoUserId,
      amount: 500000,
      payment_method: "bank_transfer",
      payment_date: daysFromNow(0),
      status: "pending",
      notes: "Pembayaran DP via transfer bank",
    });
    if (error) throw new Error(`seedPayment failed: ${error.message}`);
    console.log("  ✓ pending payment inserted");
  } else {
    console.log("  ~ pending payment already exists");
  }
  console.log("  ✓ bills + assignments seeded");
}

// ---- main ----------------------------------------------------
async function main() {
  console.log(`[setup-db] Project ref: ${ref}`);

  if (ACCESS_TOKEN) {
    await applyMigrations();
  } else {
    console.log("[setup-db] No access token — skipping migrations (already applied?).");
  }

  const serviceKey = await getServiceKey();
  appendEnv("SUPABASE_SERVICE_ROLE_KEY", serviceKey);

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userIds = await seedUsers(supabase);
  const demoUserId = userIds["demo@mycash.demo"];
  const adminUserId = userIds["admin@mycash.demo"];

  await seedExpenses(supabase, demoUserId);
  await seedBillsAndPayments(supabase, demoUserId, adminUserId);

  console.log("\n[setup-db] Demo accounts:");
  for (const u of DEMO_USERS) {
    console.log(`  NIM ${u.nim.padEnd(14)} ${u.password}`.padEnd(46) + ` role=${u.role}`);
  }
  console.log("\n[setup-db] Done. Run `npm run dev` and sign in with any account above.");
}

main().catch((err) => {
  console.error("\n[setup-db] Failed:", err.message);
  process.exitCode = 1;
});
