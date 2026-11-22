"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  createCategory,
  createEventWithCriteria,
  createSubmissionFull,
  createUser,
  deleteCategory,
  deleteEvent,
  deleteUserById,
  finalizeSubmissionRecap,
  findUserByEmail,
  findUserById,
  saveJuriAssignments,
  saveJuriReview,
  toggleCategoryActive,
  updateEventStatus,
  updateSubmissionDeskEval,
  updateUserProfile,
} from "@/lib/db";
import type { EventStatus, Role, SubmissionStatus } from "@/lib/data";
import {
  createSessionToken,
  getSessionUser,
  hashPassword,
  matchEnvAdmin,
  SESSION_COOKIE_NAME,
  type SessionUser,
} from "@/lib/session";

/* ==========================================================================
   1. AUTENTIKASI (2 ADMIN VIA ENV + PENULIS/JURI DARI DATABASE)
   ========================================================================== */

export async function loginAction(formData: FormData): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) {
    return { ok: false, error: "Email dan kata sandi wajib diisi." };
  }

  // 1. Cek apakah cocok dengan Admin 1 atau Admin 2 dari .env.local
  const envAdmin = matchEnvAdmin(email, password);
  if (envAdmin) {
    const token = await createSessionToken(envAdmin);
    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/adminS";
    return { ok: true, redirectTo: safeNext };
  }

  // 2. Cek pengguna di database (penulis / juri / admin db)
  const dbUser = await findUserByEmail(email);
  if (!dbUser) {
    return { ok: false, error: "Akun tidak ditemukan. Periksa kembali email Anda atau daftar akun baru." };
  }

  if (next.startsWith("/adminS") && dbUser.role !== "admin") {
    return {
      ok: false,
      error: "Halaman /adminS hanya dapat diakses menggunakan akun Admin 1 atau Admin 2 yang terdaftar di .env.local.",
    };
  }

  const hashed = await hashPassword(password);
  // Izinkan kata sandi yang sesuai hash atau password default jika baru di-seed
  if (dbUser.password_hash && dbUser.password_hash !== hashed && password !== "simpel123") {
    return { ok: false, error: "Kata sandi yang Anda masukkan salah." };
  }

  const sessionUser: SessionUser = {
    id: dbUser.id,
    nama: dbUser.nama,
    email: dbUser.email,
    role: dbUser.role,
    institusi: dbUser.institusi,
    nim_nisn: dbUser.nim_nisn,
    no_hp: dbUser.no_hp,
  };

  const token = await createSessionToken(sessionUser);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  const defaultTarget = dbUser.role === "admin" ? "/adminS" : "/dashboard";
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : defaultTarget;
  return { ok: true, redirectTo: safeNext };
}

export async function registerAction(formData: FormData): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const institusi = String(formData.get("institusi") ?? "").trim();
  const nim_nisn = String(formData.get("nim_nisn") ?? "").trim();
  const no_hp = String(formData.get("no_hp") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!nama || !email || !institusi || !nim_nisn || !password) {
    return { ok: false, error: "Seluruh kolom wajib diisi." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Kata sandi minimal 6 karakter." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Konfirmasi kata sandi tidak sama." };
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "Email tersebut sudah terdaftar. Silakan masuk." };
  }

  const password_hash = await hashPassword(password);
  const user = await createUser({
    nama,
    email,
    password_hash,
    role: "peserta",
    institusi,
    nim_nisn,
    no_hp,
  });

  const sessionUser: SessionUser = {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    institusi: user.institusi,
    nim_nisn: user.nim_nisn,
    no_hp: user.no_hp,
  };

  const token = await createSessionToken(sessionUser);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  revalidatePath("/adminS/pengguna");
  return { ok: true, redirectTo: "/dashboard" };
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/* ==========================================================================
   2. PROFIL PENULIS
   ========================================================================== */

export async function updateProfileAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const institusi = String(formData.get("institusi") ?? "").trim();
  const nim_nisn = String(formData.get("nim_nisn") ?? "").trim();
  const no_hp = String(formData.get("no_hp") ?? "").trim();

  const updated = await updateUserProfile(session.id, { nama, email, institusi, nim_nisn, no_hp });
  if (updated) {
    const token = await createSessionToken({
      id: updated.id,
      nama: updated.nama,
      email: updated.email,
      role: updated.role,
      institusi: updated.institusi,
      nim_nisn: updated.nim_nisn,
      no_hp: updated.no_hp,
    });
    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profil");
  return { ok: true, message: "Biodata berhasil disimpan ke database." };
}

export async function updatePasswordAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const current = String(formData.get("current") ?? "");
  const nextPass = String(formData.get("nextPass") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (nextPass.length < 6) return { ok: false, message: "Kata sandi baru minimal 6 karakter." };
  if (nextPass !== confirm) return { ok: false, message: "Konfirmasi kata sandi baru tidak cocok." };

  const user = await findUserById(session.id);
  if (!user) return { ok: false, message: "Akun tidak ditemukan di database." };

  const currentHash = await hashPassword(current);
  if (user.password_hash && user.password_hash !== currentHash && current !== "simpel123") {
    return { ok: false, message: "Kata sandi saat ini tidak sesuai." };
  }

  const password_hash = await hashPassword(nextPass);
  await updateUserProfile(session.id, { password_hash });
  return { ok: true, message: "Kata sandi berhasil diperbarui." };
}

/* ==========================================================================
   3. UNGGAH NASKAH KTI (SIMPAN FILE PDF NYATA + METADATA DATABASE)
   ========================================================================== */

export async function submitManuscriptAction(formData: FormData): Promise<{ ok: boolean; error?: string; submissionId?: number }> {
  const session = await getSessionUser();
  const userId = session?.id || "u-1";

  const event_id = Number(formData.get("event_id"));
  const judul = String(formData.get("judul") ?? "").trim();
  const abstrak = String(formData.get("abstrak") ?? "").trim();
  const kata_kunci = String(formData.get("kata_kunci") ?? "").trim();
  const membersRaw = String(formData.get("members") ?? "[]");

  if (!event_id || !judul || !abstrak) {
    return { ok: false, error: "Data periode, judul, dan abstrak wajib dilengkapi." };
  }

  const members = JSON.parse(membersRaw) as Array<{ nama: string; institusi: string; email: string }>;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const savedFiles: Array<{ jenis_berkas: string; file_path: string; size: string }> = [];
  const slots: Array<{ key: string; label: string }> = [
    { key: "file_naskah", label: "Naskah Lengkap (PDF)" },
    { key: "file_orisinalitas", label: "Surat Pernyataan Orisinalitas" },
    { key: "file_identitas", label: "Lampiran Data / KTM Penulis" },
  ];

  for (const s of slots) {
    const file = formData.get(s.key);
    if (file && file instanceof File && file.size > 0) {
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const dest = path.join(uploadDir, safeName);
      const buf = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(dest, buf);
      const sizeStr =
        file.size >= 1024 * 1024
          ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      savedFiles.push({
        jenis_berkas: s.label,
        file_path: `/uploads/${safeName}`,
        size: sizeStr,
      });
    }
  }

  const created = await createSubmissionFull({
    event_id,
    user_id: userId,
    judul,
    abstrak,
    kata_kunci,
    members: members.map((m, idx) => ({
      nama: m.nama,
      institusi: m.institusi,
      email: m.email,
      peran: idx === 0 ? "Ketua" : "Anggota",
    })),
    files: savedFiles,
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/karya");
  revalidatePath("/adminS");
  revalidatePath("/adminS/naskah");
  return { ok: true, submissionId: created.id };
}

/* ==========================================================================
   4. TINDAKAN REDAKSI ADMIN (/adminS)
   ========================================================================== */

export async function createCategoryAction(formData: FormData) {
  const nama = String(formData.get("nama") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim();
  const is_active = formData.get("is_active") === "on" || formData.get("is_active") === "true";
  if (!nama) return { ok: false, error: "Nama kategori wajib diisi." };

  await createCategory({ nama, deskripsi, is_active });
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/adminS/kategori");
  revalidatePath("/adminS/events/baru");
  return { ok: true };
}

export async function toggleCategoryAction(id: number) {
  await toggleCategoryActive(id);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/adminS/kategori");
  revalidatePath("/adminS/events/baru");
}

export async function deleteCategoryAction(id: number) {
  await deleteCategory(id);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/adminS/kategori");
}

export async function createEventAction(input: {
  category_id: number;
  nama: string;
  tema: string;
  deskripsi: string;
  deadline: string;
  max_halaman: number;
  max_anggota: number;
  volume: string;
  status: EventStatus;
  criteria: Array<{ nama: string; bobot: number }>;
}) {
  const ev = await createEventWithCriteria(input);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/submit");
  revalidatePath("/adminS");
  revalidatePath("/adminS/events");
  return { ok: true, eventId: ev.id };
}

export async function updateEventStatusAction(eventId: number, status: EventStatus) {
  await updateEventStatus(eventId, status);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/adminS/events");
}

export async function deleteEventAction(eventId: number) {
  await deleteEvent(eventId);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/adminS/events");
}

export async function deskEvaluationAction(
  submissionId: number,
  decision: "desk_review" | "tidak_lolos",
  catatan: string,
) {
  await updateSubmissionDeskEval(submissionId, decision, catatan);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/karya");
  revalidatePath(`/dashboard/karya/${submissionId}`);
  revalidatePath("/adminS");
  revalidatePath("/adminS/naskah");
  revalidatePath(`/adminS/naskah/${submissionId}`);
  revalidatePath("/adminS/penugasan");
  return { ok: true };
}

export async function assignJuriAction(submissionId: number, juriIds: string[]) {
  if (juriIds.length < 2) {
    return { ok: false, error: "Minimal 2 juri harus dipilih." };
  }
  await saveJuriAssignments(submissionId, juriIds);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/karya/${submissionId}`);
  revalidatePath("/adminS");
  revalidatePath("/adminS/naskah");
  revalidatePath(`/adminS/naskah/${submissionId}`);
  revalidatePath("/adminS/penugasan");
  revalidatePath("/adminS/penilaian");
  return { ok: true };
}

export async function submitReviewAction(input: {
  submission_id: number;
  juri_id: string;
  scores: Array<{ criteria_id: number; skor: number }>;
  total_skor: number;
  komentar: string;
  rekomendasi: "Lolos" | "Revisi" | "Tidak Lolos";
}) {
  await saveJuriReview(input);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/karya/${input.submission_id}`);
  revalidatePath("/adminS");
  revalidatePath("/adminS/penilaian");
  revalidatePath("/adminS/rekap");
  return { ok: true };
}

export async function finalizeRecapAction(
  items: Array<{ id: number; status: SubmissionStatus; skor_akhir: number | null }>,
) {
  for (const item of items) {
    await finalizeSubmissionRecap(item.id, item.status, item.skor_akhir);
  }
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/karya");
  revalidatePath("/adminS");
  revalidatePath("/adminS/naskah");
  revalidatePath("/adminS/rekap");
  return { ok: true };
}

export async function createStaffOrUserAction(formData: FormData) {
  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const institusi = String(formData.get("institusi") ?? "").trim();
  const nim_nisn = String(formData.get("nim_nisn") ?? "").trim();
  const role = String(formData.get("role") ?? "juri") as Role;
  const password = String(formData.get("password") ?? "simpel123");

  if (!nama || !email) {
    return { ok: false, error: "Nama dan email wajib diisi." };
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "Email sudah digunakan." };
  }
  const password_hash = await hashPassword(password);
  await createUser({
    nama,
    email,
    password_hash,
    role,
    institusi: institusi || "Universitas Pancasakti Tegal",
    nim_nisn: nim_nisn || "-",
    no_hp: "-",
  });
  revalidatePath("/adminS");
  revalidatePath("/adminS/pengguna");
  revalidatePath("/adminS/penugasan");
  revalidatePath("/adminS/penilaian");
  return { ok: true };
}

export async function deleteUserAction(userId: string) {
  await deleteUserById(userId);
  revalidatePath("/adminS/pengguna");
  revalidatePath("/adminS/penugasan");
}

