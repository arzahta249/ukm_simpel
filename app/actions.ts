"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  addRevisionFileToSubmission,
  createCategory,
  createEventWithCriteria,
  createSubmissionFull,
  createUser,
  deleteCategory,
  deleteEvent,
  deleteSubmissionById,
  deleteUserById,
  finalizeSubmissionRecap,
  findUserByEmail,
  findUserById,
  saveJuriAssignments,
  saveJuriReview,
  toggleCategoryActive,
  updateEventStatus,
  updateSubmissionDeskEval,
  updateSubmissionFull,
  updateUserProfile,
} from "@/lib/db";
import type { EssayBody, EventStatus, Role, SubmissionStatus } from "@/lib/data";
import { sanitizeRichHtml, stripHtml } from "@/lib/utils";
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
  const loginRole = String(formData.get("login_role") ?? "").trim();

  if (!email || !password) {
    return { ok: false, error: "Email dan kata sandi wajib diisi." };
  }

  const targetRole: Role | "" = next.startsWith("/reviewer")
    ? "juri"
    : next.startsWith("/adminS")
      ? "admin"
      : next.startsWith("/dashboard")
        ? "peserta"
        : loginRole === "juri" || loginRole === "admin" || loginRole === "peserta"
          ? (loginRole as Role)
          : "";

  // 1. Cek apakah cocok dengan Admin 1 atau Admin 2 dari .env.local
  const envAdmin = matchEnvAdmin(email, password);
  if (envAdmin) {
    if (targetRole === "juri") {
      return {
        ok: false,
        error: "Anda sedang berada di akses login Reviewer. Akun Editor (.env.local) tidak dapat masuk sebagai Reviewer — gunakan akun Reviewer yang dibuat oleh Editor.",
      };
    }
    if (targetRole === "peserta") {
      return {
        ok: false,
        error: "Email atau kata sandi tidak valid untuk akun Penulis.",
      };
    }
    const token = await createSessionToken(envAdmin);
    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    const safeNext = next && next.startsWith("/adminS") ? next : "/adminS";
    return { ok: true, redirectTo: safeNext };
  }

  // 2. Cek pengguna di database (penulis / reviewer)
  const dbUser = await findUserByEmail(email);
  if (!dbUser) {
    if (targetRole === "juri") {
      return {
        ok: false,
        error: "Akun Reviewer tidak ditemukan. Pastikan Editor sudah membuatkan akun Reviewer Anda di menu Pengguna (/adminS/pengguna).",
      };
    }
    if (targetRole === "admin") {
      return {
        ok: false,
        error: "Akun Editor tidak valid. Gunakan salah satu akun Editor di .env.local.",
      };
    }
    return { ok: false, error: "Akun tidak ditemukan. Periksa kembali email Anda atau daftar akun baru." };
  }

  if (targetRole === "admin" && dbUser.role !== "admin") {
    return {
      ok: false,
      error: "Halaman Editor (/adminS) hanya dapat diakses menggunakan akun Editor yang terdaftar di .env.local.",
    };
  }

  if (targetRole === "juri" && dbUser.role !== "juri") {
    const label = dbUser.role === "peserta" ? "Penulis" : "Editor";
    return {
      ok: false,
      error: `Akun ini terdaftar sebagai ${label}, bukan Reviewer. Gunakan akun Reviewer yang dibuat oleh Editor.`,
    };
  }

  if (targetRole === "peserta" && dbUser.role === "juri") {
    return {
      ok: false,
      error: "Email atau kata sandi tidak valid untuk akun Penulis.",
    };
  }

  const hashed = await hashPassword(password);
  if (dbUser.password_hash && dbUser.password_hash !== hashed) {
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

  const defaultTarget =
    dbUser.role === "admin" ? "/adminS" : dbUser.role === "juri" ? "/reviewer" : "/dashboard";
  const safeNext =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    ((dbUser.role === "juri" && next.startsWith("/reviewer")) ||
      (dbUser.role === "admin" && next.startsWith("/adminS")) ||
      (dbUser.role === "peserta" && next.startsWith("/dashboard")))
      ? next
      : defaultTarget;
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
  revalidatePath("/reviewer");
  revalidatePath("/reviewer/profil");
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
  if (user.password_hash && user.password_hash !== currentHash) {
    return { ok: false, message: "Kata sandi saat ini tidak sesuai." };
  }

  const password_hash = await hashPassword(nextPass);
  await updateUserProfile(session.id, {
    password_hash,
    ...(user.role === "juri" ? { quick_password: nextPass } : {}),
  });
  return { ok: true, message: "Kata sandi berhasil diperbarui." };
}

/* ==========================================================================
   3. UNGGAH NASKAH KTI (SIMPAN FILE PDF NYATA + METADATA DATABASE)
   ========================================================================== */

export async function submitManuscriptAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
  submissionId?: number;
  status?: "draft" | "submitted";
}> {
  const session = await getSessionUser();
  const userId = session?.id || "u-1";

  const submissionIdRaw = Number(formData.get("submission_id") || 0);
  const actionMode = String(formData.get("action_mode") ?? "submit") === "draft" ? "draft" : "submit";
  const event_id = Number(formData.get("event_id"));
  const judul = String(formData.get("judul") ?? "").trim();
  const subjudul = String(formData.get("subjudul") ?? "").trim();
  const topik = String(formData.get("topik") ?? "").trim();
  const jenis_riset = String(formData.get("jenis_riset") ?? "").trim();
  const abstrak = String(formData.get("abstrak") ?? "").trim();
  const kata_kunci = String(formData.get("kata_kunci") ?? "").trim();
  const prodi = String(formData.get("prodi") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const visibilitas = String(formData.get("visibilitas") ?? "publik") === "privat" ? "privat" : "publik";
  const persetujuan_publikasi = formData.get("persetujuan_publikasi") === "true";
  const pernyataan_orisinalitas = formData.get("pernyataan_orisinalitas") === "true";
  const membersRaw = String(formData.get("members") ?? "[]");
  const isiEssayRaw = String(formData.get("isi_essay") ?? "{}");

  let parsedEssay: EssayBody = {
    pendahuluan: "",
    metode_penelitian: "",
    hasil_pembahasan: "",
    pembahasan: "",
    kesimpulan: "",
    daftar_pustaka: "",
  };
  try {
    const rawObj = JSON.parse(isiEssayRaw) as Partial<EssayBody>;
    parsedEssay = {
      pendahuluan: sanitizeRichHtml(String(rawObj.pendahuluan ?? "")),
      metode_penelitian: sanitizeRichHtml(String(rawObj.metode_penelitian ?? "")),
      hasil_pembahasan: sanitizeRichHtml(String(rawObj.hasil_pembahasan ?? "")),
      pembahasan: sanitizeRichHtml(String(rawObj.pembahasan ?? "")),
      kesimpulan: sanitizeRichHtml(String(rawObj.kesimpulan ?? "")),
      daftar_pustaka: sanitizeRichHtml(String(rawObj.daftar_pustaka ?? "")),
    };
  } catch {
    parsedEssay = {
      pendahuluan: "",
      metode_penelitian: "",
      hasil_pembahasan: "",
      pembahasan: "",
      kesimpulan: "",
      daftar_pustaka: "",
    };
  }

  if (!event_id || !judul) {
    return { ok: false, error: "Judul naskah dan periode publikasi wajib diisi." };
  }

  const members = JSON.parse(membersRaw) as Array<{ nama: string; institusi: string; email: string }>;

  if (actionMode === "submit") {
    if (!topik || !abstrak) {
      return { ok: false, error: "Kategori/bidang ilmu dan ringkasan/abstrak wajib diisi sebelum diajukan." };
    }
    if (!members[0]?.nama?.trim() || !members[0]?.email?.trim()) {
      return { ok: false, error: "Nama penulis dan email wajib diisi." };
    }
    const hasWrittenSections =
      stripHtml(parsedEssay.pendahuluan).length > 0 &&
      (stripHtml(parsedEssay.pembahasan).length > 0 ||
        (stripHtml(parsedEssay.metode_penelitian || "").length > 0 &&
          stripHtml(parsedEssay.hasil_pembahasan || "").length > 0)) &&
      stripHtml(parsedEssay.kesimpulan).length > 0;
    const hasPdfFile = formData.get("file_naskah") instanceof File && (formData.get("file_naskah") as File).size > 0;

    if (!hasWrittenSections && !hasPdfFile && !submissionIdRaw) {
      return {
        ok: false,
        error: "Unggah berkas PDF naskah Anda atau lengkapi ringkasan struktur naskah sebelum mengajukan publikasi.",
      };
    }
    if (!persetujuan_publikasi || !pernyataan_orisinalitas) {
      return {
        ok: false,
        error: "Centang Persetujuan Publikasi dan Pernyataan Orisinalitas sebelum mengajukan publikasi.",
      };
    }
  }

  // Simpan gambar sampul essay (opsional)
  let cover_image: string | undefined = String(formData.get("existing_cover") ?? "").trim() || undefined;
  const coverFile = formData.get("cover_file");
  if (coverFile && coverFile instanceof File && coverFile.size > 0) {
    const coverDir = path.join(process.cwd(), "public", "uploads", "covers");
    if (!fs.existsSync(coverDir)) {
      fs.mkdirSync(coverDir, { recursive: true });
    }
    const safeCover = `${Date.now()}_${coverFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    fs.writeFileSync(path.join(coverDir, safeCover), Buffer.from(await coverFile.arrayBuffer()));
    cover_image = `/uploads/covers/${safeCover}`;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const savedFiles: Array<{ jenis_berkas: string; file_path: string; size: string }> = [];
  const slots: Array<{ key: string; label: string }> = [
    { key: "file_naskah", label: "Lampiran Naskah (PDF)" },
    { key: "file_orisinalitas", label: "Surat Pernyataan Orisinalitas" },
    { key: "file_identitas", label: "Lampiran Pendukung" },
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

  const payloadMembers = members.map((m, idx) => ({
    nama: m.nama,
    institusi: m.institusi || "Universitas Pancasakti Tegal",
    email: m.email,
    peran: (idx === 0 ? "Ketua" : "Anggota") as "Ketua" | "Anggota",
  }));

  const nextStatus: "draft" | "submitted" = actionMode === "draft" ? "draft" : "submitted";

  let resultId = submissionIdRaw;
  if (submissionIdRaw > 0) {
    const updated = await updateSubmissionFull(submissionIdRaw, userId, {
      event_id,
      judul,
      subjudul,
      topik,
      jenis_riset,
      abstrak,
      cover_image,
      kata_kunci,
      prodi,
      bio,
      isi_essay: parsedEssay,
      visibilitas,
      persetujuan_publikasi,
      pernyataan_orisinalitas,
      status: nextStatus,
      members: payloadMembers,
      files: savedFiles,
    });
    if (!updated) {
      return { ok: false, error: "Draft tidak ditemukan atau Anda tidak memiliki akses untuk mengeditnya." };
    }
    resultId = updated.id;
  } else {
    const created = await createSubmissionFull({
      event_id,
      user_id: userId,
      judul,
      subjudul,
      topik,
      jenis_riset,
      abstrak,
      cover_image,
      kata_kunci,
      prodi,
      bio,
      isi_essay: parsedEssay,
      visibilitas,
      persetujuan_publikasi,
      pernyataan_orisinalitas,
      status: nextStatus,
      members: payloadMembers,
      files: savedFiles,
    });
    resultId = created.id;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/karya");
  revalidatePath(`/dashboard/karya/${resultId}`);
  revalidatePath("/adminS");
  revalidatePath("/adminS/naskah");
  return { ok: true, submissionId: resultId, status: nextStatus };
}

export async function uploadRevisionAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Sesi berakhir. Silakan login kembali." };

  const submissionId = Number(formData.get("submission_id"));
  const catatan = String(formData.get("catatan") ?? "").trim();
  const file = formData.get("file_revisi");

  if (!submissionId || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pilih file PDF revisi terlebih dahulu." };
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "Format berkas revisi wajib PDF." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Ukuran berkas maksimal 5 MB." };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const safeName = `${Date.now()}_rev_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  fs.writeFileSync(path.join(uploadDir, safeName), Buffer.from(await file.arrayBuffer()));

  const sizeStr =
    file.size >= 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;

  await addRevisionFileToSubmission({
    submission_id: submissionId,
    file_path: `/uploads/${safeName}`,
    size: sizeStr,
    catatan,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/karya");
  revalidatePath(`/dashboard/karya/${submissionId}`);
  revalidatePath("/reviewer");
  revalidatePath("/adminS");
  revalidatePath("/adminS/naskah");
  revalidatePath(`/adminS/naskah/${submissionId}`);
  return { ok: true };
}

/* ==========================================================================
   4. TINDAKAN EDITOR ADMIN (/adminS)
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
  decision: SubmissionStatus,
  catatan: string,
) {
  await finalizeSubmissionRecap(submissionId, decision, null, catatan);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/karya");
  revalidatePath(`/dashboard/karya/${submissionId}`);
  revalidatePath("/adminS");
  revalidatePath("/adminS/naskah");
  revalidatePath(`/adminS/naskah/${submissionId}`);
  revalidatePath("/adminS/rekap");
  return { ok: true };
}

export async function assignJuriAction(submissionId: number, juriIds: string[]) {
  const uniqueIds = [...new Set(juriIds)];
  if (uniqueIds.length < 1) {
    return { ok: false, error: "Pilih minimal 1 reviewer/juri." };
  }
  if (uniqueIds.length > 4) {
    return { ok: false, error: "Maksimal 4 reviewer/juri per naskah." };
  }
  await saveJuriAssignments(submissionId, uniqueIds);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/karya/${submissionId}`);
  revalidatePath("/reviewer");
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
  revalidatePath("/reviewer");
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

export async function createStaffOrUserAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
  created?: { nama: string; email: string; role: Role; password: string };
}> {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return { ok: false, error: "Hanya Editor yang berwenang membuat akun Reviewer atau Penulis." };
  }

  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const institusi = String(formData.get("institusi") ?? "").trim();
  const nim_nisn = String(formData.get("nim_nisn") ?? "").trim();
  const rawRole = String(formData.get("role") ?? "juri").trim();
  const role: Role = rawRole === "peserta" ? "peserta" : "juri";
  const password = String(formData.get("password") ?? "").trim() || "simpel123";

  if (!nama || !email) {
    return { ok: false, error: "Nama dan email wajib diisi." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Kata sandi minimal 6 karakter." };
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
    ...(role === "juri" ? { quick_password: password } : {}),
    role,
    institusi: institusi || "Universitas Pancasakti Tegal",
    nim_nisn: nim_nisn || "-",
    no_hp: "-",
  });
  revalidatePath("/adminS");
  revalidatePath("/adminS/pengguna");
  revalidatePath("/adminS/penugasan");
  revalidatePath("/adminS/penilaian");
  return { ok: true, created: { nama, email, role, password } };
}

export async function resetUserPasswordAction(
  userId: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string; reset?: { email: string; nama: string; password: string } }> {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return { ok: false, error: "Hanya Editor yang berwenang mengatur ulang kata sandi." };
  }
  const clean = newPassword.trim();
  if (clean.length < 6) {
    return { ok: false, error: "Kata sandi baru minimal 6 karakter." };
  }
  const target = await findUserById(userId);
  if (!target) {
    return { ok: false, error: "Akun tidak ditemukan." };
  }
  const password_hash = await hashPassword(clean);
  await updateUserProfile(userId, {
    password_hash,
    ...(target.role === "juri" ? { quick_password: clean } : {}),
  });
  revalidatePath("/adminS/pengguna");
  return { ok: true, reset: { email: target.email, nama: target.nama, password: clean } };
}

export async function deleteUserAction(userId: string) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return { ok: false, error: "Hanya Editor yang berwenang menghapus akun." };
  }
  await deleteUserById(userId);
  revalidatePath("/adminS/pengguna");
  revalidatePath("/adminS/penugasan");
  return { ok: true };
}

export async function deleteSubmissionAction(
  submissionId: number,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };
  }

  if (session.role !== "admin") {
    const { readDb } = await import("@/lib/db");
    const db = await readDb();
    const target = db.submissions.find((s) => s.id === submissionId);
    if (!target || target.user_id !== session.id || target.status !== "draft") {
      return { ok: false, error: "Anda hanya dapat menghapus draft naskah milik Anda sendiri." };
    }
  }

  const deleted = await deleteSubmissionById(submissionId);
  if (!deleted) {
    return { ok: false, error: "Naskah tidak ditemukan." };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/karya");
  revalidatePath("/reviewer");
  revalidatePath("/adminS");
  revalidatePath("/adminS/naskah");
  revalidatePath("/adminS/penugasan");
  revalidatePath("/adminS/penilaian");
  revalidatePath("/adminS/rekap");
  return { ok: true };
}

