import { cookies } from "next/headers";

export type SessionRole = "admin" | "peserta" | "juri";

export interface SessionUser {
  id: string;
  nama: string;
  email: string;
  role: SessionRole;
  institusi?: string;
  nim_nisn?: string;
  no_hp?: string;
}

export const SESSION_COOKIE_NAME = "simpel_session";

function getSecret(): string {
  return process.env.SESSION_SECRET || "simpel-ups-tegal-default-secret-2026";
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  const sig = await hmacSign(payload, getSecret());
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmacSign(payload, getSecret());
  if (expected !== sig) return null;
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as SessionUser;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(`simpel:${password}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Cek apakah email & password cocok dengan salah satu dari 2 Admin di .env.local */
export function matchEnvAdmin(email: string, password: string): SessionUser | null {
  const cleanEmail = email.trim().toLowerCase();
  const admins = [
    {
      id: "admin-1",
      email: (process.env.ADMIN_1_EMAIL || "admin1@simpel.ac.id").trim().toLowerCase(),
      password: process.env.ADMIN_1_PASSWORD || "adminsimpel1",
      nama: process.env.ADMIN_1_NAME || "Admin Redaksi 1",
    },
    {
      id: "admin-2",
      email: (process.env.ADMIN_2_EMAIL || "admin2@simpel.ac.id").trim().toLowerCase(),
      password: process.env.ADMIN_2_PASSWORD || "adminsimpel2",
      nama: process.env.ADMIN_2_NAME || "Admin Redaksi 2",
    },
  ];

  const found = admins.find((a) => a.email === cleanEmail && a.password === password);
  if (!found) return null;

  return {
    id: found.id,
    nama: found.nama,
    email: found.email,
    role: "admin",
    institusi: "UKM SIMPEL UPS Tegal",
    nim_nisn: "-",
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

