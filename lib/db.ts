import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import {
  assignments as seedAssignments,
  categories as seedCategories,
  criteria as seedCriteria,
  events as seedEvents,
  files as seedFiles,
  members as seedMembers,
  reviews as seedReviews,
  statusLogs as seedLogs,
  submissions as seedSubmissions,
  users as seedUsers,
  type Assignment,
  type Category,
  type Criteria,
  type EventItem,
  type EventStatus,
  type Member,
  type Review,
  type Role,
  type StatusLog,
  type Submission,
  type SubmissionFile,
  type SubmissionStatus,
  type User,
} from "./data";
import { hashPassword } from "./session";

export interface DbUser extends User {
  password_hash?: string;
  quick_password?: string;
}

export interface DbSchema {
  categories: Category[];
  events: EventItem[];
  criteria: Criteria[];
  users: DbUser[];
  submissions: Submission[];
  submission_members: Member[];
  submission_files: SubmissionFile[];
  status_logs: StatusLog[];
  review_assignments: Assignment[];
  reviews: Review[];
}

/* ==========================================================================
   1. KONEKSI POSTGRESQL SUPABASE (host=db.znlqgniclsztjttfnbzb.supabase.co)
   ========================================================================== */

let pgPool: Pool | null = null;
let pgReady = false;
let pgFailed = false;

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_PASSWORD));
}

function getPool(): Pool | null {
  if (!isPostgresConfigured() || pgFailed) return null;
  if (!pgPool) {
    pgPool = process.env.DATABASE_URL
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 6000,
        })
      : new Pool({
          host: process.env.DB_HOST || "db.znlqgniclsztjttfnbzb.supabase.co",
          port: Number(process.env.DB_PORT || 5432),
          database: process.env.DB_NAME || "postgres",
          user: process.env.DB_USER || "postgres",
          password: process.env.DB_PASSWORD,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 6000,
        });
  }
  return pgPool;
}

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS simpel_store (
  id INT PRIMARY KEY DEFAULT 1,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  deskripsi TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  nama TEXT NOT NULL,
  tema TEXT NOT NULL,
  deskripsi TEXT NOT NULL DEFAULT '',
  deadline TEXT NOT NULL,
  max_halaman INT NOT NULL DEFAULT 15,
  max_anggota INT NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'open',
  volume TEXT NOT NULL DEFAULT 'Vol. 05 · No. 01',
  peserta INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS criteria (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  bobot INT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'peserta',
  institusi TEXT NOT NULL DEFAULT '',
  nim_nisn TEXT NOT NULL DEFAULT '',
  no_hp TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  abstrak TEXT NOT NULL DEFAULT '',
  kata_kunci TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted',
  skor_akhir NUMERIC(5,2),
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submission_members (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  institusi TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  peran TEXT NOT NULL DEFAULT 'Anggota'
);

CREATE TABLE IF NOT EXISTS submission_files (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  jenis_berkas TEXT NOT NULL,
  file_path TEXT NOT NULL,
  versi INT NOT NULL DEFAULT 1,
  uploaded_at TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT '1.0 MB'
);

CREATE TABLE IF NOT EXISTS status_logs (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  catatan TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_assignments (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  juri_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  assignment_id INT NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,
  total_skor NUMERIC(5,2) NOT NULL DEFAULT 0,
  komentar TEXT NOT NULL DEFAULT '',
  rekomendasi TEXT NOT NULL DEFAULT 'Lolos'
);

CREATE TABLE IF NOT EXISTS review_scores (
  id SERIAL PRIMARY KEY,
  review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  criteria_id INT NOT NULL,
  skor NUMERIC(5,2) NOT NULL DEFAULT 0
);
`;

/* ==========================================================================
   2. PENYIMPANAN PERSISTEN (sinkron ke PostgreSQL Supabase + file lokal)
   ========================================================================== */

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "simpel-db.json");

async function buildInitialDb(): Promise<DbSchema> {
  const defaultPass = await hashPassword("simpel123");
  return {
    categories: structuredClone(seedCategories),
    events: structuredClone(seedEvents),
    criteria: structuredClone(seedCriteria),
    users: seedUsers.map((u) => ({
      ...u,
      password_hash: defaultPass,
      ...(u.role === "juri" ? { quick_password: "simpel123" } : {}),
    })),
    submissions: structuredClone(seedSubmissions),
    submission_members: structuredClone(seedMembers),
    submission_files: structuredClone(seedFiles),
    status_logs: structuredClone(seedLogs),
    review_assignments: structuredClone(seedAssignments),
    reviews: structuredClone(seedReviews),
  };
}

async function syncRelationalTables(pool: Pool, db: DbSchema) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const c of db.categories) {
      await client.query(
        `INSERT INTO categories (id, nama, deskripsi, is_active)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, deskripsi = EXCLUDED.deskripsi, is_active = EXCLUDED.is_active`,
        [c.id, c.nama, c.deskripsi, c.is_active],
      );
    }
    for (const e of db.events) {
      await client.query(
        `INSERT INTO events (id, category_id, nama, tema, deskripsi, deadline, max_halaman, max_anggota, status, volume, peserta)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           category_id=EXCLUDED.category_id, nama=EXCLUDED.nama, tema=EXCLUDED.tema,
           deskripsi=EXCLUDED.deskripsi, deadline=EXCLUDED.deadline, max_halaman=EXCLUDED.max_halaman,
           max_anggota=EXCLUDED.max_anggota, status=EXCLUDED.status, volume=EXCLUDED.volume, peserta=EXCLUDED.peserta`,
        [e.id, e.category_id, e.nama, e.tema, e.deskripsi, e.deadline, e.max_halaman, e.max_anggota, e.status, e.volume, e.peserta],
      );
    }
    for (const u of db.users) {
      await client.query(
        `INSERT INTO app_users (id, nama, email, password_hash, role, institusi, nim_nisn, no_hp, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           nama=EXCLUDED.nama, email=EXCLUDED.email, password_hash=EXCLUDED.password_hash,
           role=EXCLUDED.role, institusi=EXCLUDED.institusi, nim_nisn=EXCLUDED.nim_nisn, no_hp=EXCLUDED.no_hp`,
        [u.id, u.nama, u.email, u.password_hash || "", u.role, u.institusi, u.nim_nisn, u.no_hp, u.created_at],
      );
    }
    for (const s of db.submissions) {
      await client.query(
        `INSERT INTO submissions (id, event_id, user_id, judul, abstrak, kata_kunci, status, skor_akhir, submitted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           judul=EXCLUDED.judul, abstrak=EXCLUDED.abstrak, kata_kunci=EXCLUDED.kata_kunci,
           status=EXCLUDED.status, skor_akhir=EXCLUDED.skor_akhir`,
        [s.id, s.event_id, s.user_id, s.judul, s.abstrak, s.kata_kunci, s.status, s.skor_akhir, s.submitted_at],
      );
    }
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
}

export async function readDb(): Promise<DbSchema> {
  const pool = getPool();
  if (pool) {
    try {
      if (!pgReady) {
        await pool.query(INIT_SQL);
        pgReady = true;
      }
      const res = await pool.query("SELECT payload FROM simpel_store WHERE id = 1");
      if (res.rows.length > 0) {
        return res.rows[0].payload as DbSchema;
      }
      const initial = await buildInitialDb();
      await pool.query("INSERT INTO simpel_store (id, payload) VALUES (1, $1)", [JSON.stringify(initial)]);
      await syncRelationalTables(pool, initial);
      return initial;
    } catch (err) {
      console.error("[SIMPEL DB] Koneksi Postgres gagal, menggunakan penyimpanan lokal:", (err as Error).message);
      pgFailed = true;
    }
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = await buildInitialDb();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw) as DbSchema;
}

export async function writeDb(db: DbSchema): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");

  const pool = getPool();
  if (pool && !pgFailed) {
    try {
      if (!pgReady) {
        await pool.query(INIT_SQL);
        pgReady = true;
      }
      await pool.query(
        `INSERT INTO simpel_store (id, payload, updated_at)
         VALUES (1, $1, NOW())
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
        [JSON.stringify(db)],
      );
      await syncRelationalTables(pool, db);
    } catch (err) {
      console.error("[SIMPEL DB] Gagal sinkron ke Postgres:", (err as Error).message);
    }
  }
}

/* ==========================================================================
   3. OPERASI CRUD DINAMIS
   ========================================================================== */

export async function findUserByEmail(email: string): Promise<DbUser | undefined> {
  const db = await readDb();
  const clean = email.trim().toLowerCase();
  return db.users.find((u) => u.email.trim().toLowerCase() === clean);
}

export async function findUserById(id: string): Promise<DbUser | undefined> {
  const db = await readDb();
  return db.users.find((u) => u.id === id);
}

export async function createUser(input: {
  nama: string;
  email: string;
  password_hash: string;
  quick_password?: string;
  role?: Role;
  institusi: string;
  nim_nisn: string;
  no_hp: string;
}): Promise<DbUser> {
  const db = await readDb();
  const newUser: DbUser = {
    id: `u-${Date.now()}`,
    nama: input.nama.trim(),
    email: input.email.trim().toLowerCase(),
    password_hash: input.password_hash,
    ...(input.quick_password ? { quick_password: input.quick_password } : {}),
    role: input.role || "peserta",
    institusi: input.institusi.trim(),
    nim_nisn: input.nim_nisn.trim(),
    no_hp: input.no_hp.trim(),
    created_at: new Date().toISOString().slice(0, 10),
  };
  db.users.push(newUser);
  await writeDb(db);
  return newUser;
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<
    Pick<DbUser, "nama" | "email" | "institusi" | "nim_nisn" | "no_hp" | "password_hash" | "quick_password" | "role">
  >,
): Promise<DbUser | null> {
  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...patch };
  await writeDb(db);
  return db.users[idx];
}

export async function deleteUserById(userId: string): Promise<void> {
  const db = await readDb();
  db.users = db.users.filter((u) => u.id !== userId);
  await writeDb(db);
}

export async function createCategory(input: { nama: string; deskripsi: string; is_active: boolean }): Promise<Category> {
  const db = await readDb();
  const nextId = db.categories.reduce((m, c) => Math.max(m, c.id), 0) + 1;
  const cat: Category = {
    id: nextId,
    nama: input.nama.trim(),
    deskripsi: input.deskripsi.trim(),
    is_active: input.is_active,
  };
  db.categories.push(cat);
  await writeDb(db);
  return cat;
}

export async function toggleCategoryActive(id: number): Promise<void> {
  const db = await readDb();
  const c = db.categories.find((x) => x.id === id);
  if (c) {
    c.is_active = !c.is_active;
    await writeDb(db);
  }
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await readDb();
  db.categories = db.categories.filter((c) => c.id !== id);
  await writeDb(db);
}

export async function createEventWithCriteria(input: {
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
}): Promise<EventItem> {
  const db = await readDb();
  const nextId = db.events.reduce((m, e) => Math.max(m, e.id), 0) + 1;
  const ev: EventItem = {
    id: nextId,
    category_id: input.category_id,
    nama: input.nama.trim(),
    tema: input.tema.trim(),
    deskripsi: input.deskripsi.trim(),
    deadline: input.deadline,
    max_halaman: input.max_halaman,
    max_anggota: input.max_anggota,
    status: input.status,
    volume: input.volume.trim() || `Vol. 05 · No. 0${nextId}`,
    peserta: 0,
  };
  db.events.unshift(ev);
  input.criteria.forEach((c, idx) => {
    db.criteria.push({
      id: nextId * 100 + idx + 1,
      event_id: nextId,
      nama: c.nama.trim(),
      bobot: Number(c.bobot),
    });
  });
  await writeDb(db);
  return ev;
}

export async function updateEventStatus(eventId: number, status: EventStatus): Promise<void> {
  const db = await readDb();
  const ev = db.events.find((e) => e.id === eventId);
  if (ev) {
    ev.status = status;
    await writeDb(db);
  }
}

export async function deleteEvent(eventId: number): Promise<void> {
  const db = await readDb();
  db.events = db.events.filter((e) => e.id !== eventId);
  db.criteria = db.criteria.filter((c) => c.event_id !== eventId);
  await writeDb(db);
}

export async function createSubmissionFull(input: {
  event_id: number;
  user_id: string;
  judul: string;
  subjudul?: string;
  topik?: string;
  jenis_riset?: string;
  abstrak: string;
  cover_image?: string;
  kata_kunci: string;
  prodi?: string;
  bio?: string;
  isi_essay?: import("./data").EssayBody;
  visibilitas?: "publik" | "privat";
  persetujuan_publikasi?: boolean;
  pernyataan_orisinalitas?: boolean;
  status?: "draft" | "submitted";
  members: Array<{ nama: string; institusi: string; email: string; peran: "Ketua" | "Anggota" }>;
  files: Array<{ jenis_berkas: string; file_path: string; size: string }>;
}): Promise<Submission> {
  const db = await readDb();
  const nextId = db.submissions.reduce((m, s) => Math.max(m, s.id), 100) + 1;
  const nowDate = new Date().toISOString().slice(0, 10);
  const nowDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");
  const initialStatus = input.status === "draft" ? "draft" : "submitted";

  const sub: Submission = {
    id: nextId,
    event_id: input.event_id,
    user_id: input.user_id,
    judul: input.judul.trim(),
    subjudul: input.subjudul?.trim() || undefined,
    topik: input.topik?.trim() || undefined,
    jenis_riset: input.jenis_riset?.trim() || undefined,
    abstrak: input.abstrak.trim(),
    cover_image: input.cover_image || undefined,
    kata_kunci: input.kata_kunci.trim(),
    prodi: input.prodi?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
    isi_essay: input.isi_essay,
    visibilitas: input.visibilitas || "publik",
    persetujuan_publikasi: input.persetujuan_publikasi,
    pernyataan_orisinalitas: input.pernyataan_orisinalitas,
    status: initialStatus,
    skor_akhir: null,
    submitted_at: nowDate,
  };
  db.submissions.unshift(sub);

  if (initialStatus === "submitted") {
    const ev = db.events.find((e) => e.id === input.event_id);
    if (ev) ev.peserta += 1;
  }

  let memId = db.submission_members.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  for (const m of input.members) {
    db.submission_members.push({
      id: memId++,
      submission_id: nextId,
      nama: m.nama,
      institusi: m.institusi,
      email: m.email,
      peran: m.peran,
    });
  }

  let fileId = db.submission_files.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  for (const f of input.files) {
    db.submission_files.push({
      id: fileId++,
      submission_id: nextId,
      jenis_berkas: f.jenis_berkas,
      file_path: f.file_path,
      versi: 1,
      uploaded_at: nowDate,
      size: f.size,
    });
  }

  const logId = db.status_logs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  db.status_logs.push({
    id: logId,
    submission_id: nextId,
    status: initialStatus,
    catatan:
      initialStatus === "draft"
        ? "Naskah disimpan sebagai draft oleh penulis dan dapat diedit kembali."
        : "Naskah diajukan untuk publikasi ke Editor.",
    created_at: nowDateTime,
  });

  await writeDb(db);
  return sub;
}

export async function updateSubmissionFull(
  submissionId: number,
  userId: string,
  input: {
    event_id: number;
    judul: string;
    subjudul?: string;
    topik?: string;
    jenis_riset?: string;
    abstrak: string;
    cover_image?: string;
    kata_kunci: string;
    prodi?: string;
    bio?: string;
    isi_essay?: import("./data").EssayBody;
    visibilitas?: "publik" | "privat";
    persetujuan_publikasi?: boolean;
    pernyataan_orisinalitas?: boolean;
    status: "draft" | "submitted";
    members: Array<{ nama: string; institusi: string; email: string; peran: "Ketua" | "Anggota" }>;
    files: Array<{ jenis_berkas: string; file_path: string; size: string }>;
  },
): Promise<Submission | null> {
  const db = await readDb();
  const s = db.submissions.find((x) => x.id === submissionId && x.user_id === userId);
  if (!s) return null;

  const wasDraft = s.status === "draft";
  const nowDate = new Date().toISOString().slice(0, 10);
  const nowDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");

  s.event_id = input.event_id;
  s.judul = input.judul.trim();
  s.subjudul = input.subjudul?.trim() || undefined;
  s.topik = input.topik?.trim() || undefined;
  s.jenis_riset = input.jenis_riset?.trim() || undefined;
  s.abstrak = input.abstrak.trim();
  if (input.cover_image !== undefined) {
    s.cover_image = input.cover_image || undefined;
  }
  s.kata_kunci = input.kata_kunci.trim();
  s.prodi = input.prodi?.trim() || undefined;
  s.bio = input.bio?.trim() || undefined;
  s.isi_essay = input.isi_essay;
  s.visibilitas = input.visibilitas || "publik";
  s.persetujuan_publikasi = input.persetujuan_publikasi;
  s.pernyataan_orisinalitas = input.pernyataan_orisinalitas;
  s.status = input.status;
  s.submitted_at = nowDate;

  if (wasDraft && input.status === "submitted") {
    const ev = db.events.find((e) => e.id === input.event_id);
    if (ev) ev.peserta += 1;
  }

  db.submission_members = db.submission_members.filter((m) => m.submission_id !== submissionId);
  let memId = db.submission_members.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  for (const m of input.members) {
    db.submission_members.push({
      id: memId++,
      submission_id: submissionId,
      nama: m.nama,
      institusi: m.institusi,
      email: m.email,
      peran: m.peran,
    });
  }

  if (input.files.length > 0) {
    let fileId = db.submission_files.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const maxVer = db.submission_files
      .filter((f) => f.submission_id === submissionId)
      .reduce((m, f) => Math.max(m, f.versi), 0);
    for (const f of input.files) {
      db.submission_files.push({
        id: fileId++,
        submission_id: submissionId,
        jenis_berkas: f.jenis_berkas,
        file_path: f.file_path,
        versi: maxVer + 1,
        uploaded_at: nowDate,
        size: f.size,
      });
    }
  }

  const logId = db.status_logs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  db.status_logs.push({
    id: logId,
    submission_id: submissionId,
    status: input.status,
    catatan:
      input.status === "draft"
        ? "Draft naskah diperbarui oleh penulis."
        : "Naskah diajukan untuk publikasi ke Editor.",
    created_at: nowDateTime,
  });

  await writeDb(db);
  return s;
}

export async function addRevisionFileToSubmission(input: {
  submission_id: number;
  file_path: string;
  size: string;
  catatan: string;
}): Promise<void> {
  const db = await readDb();
  const s = db.submissions.find((x) => x.id === input.submission_id);
  if (!s) return;

  const existingFiles = db.submission_files.filter((f) => f.submission_id === input.submission_id);
  const maxVer = existingFiles.reduce((m, f) => Math.max(m, f.versi), 1);
  const nextFileId = db.submission_files.reduce((m, f) => Math.max(m, f.id), 0) + 1;
  const nowDate = new Date().toISOString().slice(0, 10);
  const nowDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");

  db.submission_files.push({
    id: nextFileId,
    submission_id: input.submission_id,
    jenis_berkas: `Naskah Revisi v${maxVer + 1} (PDF)`,
    file_path: input.file_path,
    versi: maxVer + 1,
    uploaded_at: nowDate,
    size: input.size,
  });

  s.status = "review";
  for (const a of db.review_assignments) {
    if (a.submission_id === input.submission_id) {
      a.status = "pending";
    }
  }

  const logId = db.status_logs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  db.status_logs.push({
    id: logId,
    submission_id: input.submission_id,
    status: "review",
    catatan:
      input.catatan.trim() ||
      `Penulis mengunggah naskah revisi v${maxVer + 1}. Menunggu peninjauan ulang dari Reviewer.`,
    created_at: nowDateTime,
  });

  await writeDb(db);
}

export async function updateSubmissionDeskEval(
  submissionId: number,
  decision: "desk_review" | "tidak_lolos",
  catatan: string,
): Promise<void> {
  const db = await readDb();
  const s = db.submissions.find((x) => x.id === submissionId);
  if (!s) return;
  s.status = decision;
  const logId = db.status_logs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  const nowDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");
  db.status_logs.push({
    id: logId,
    submission_id: submissionId,
    status: decision,
    catatan:
      catatan.trim() ||
      (decision === "desk_review"
        ? "Lolos pemeriksaan kelengkapan & Desk Evaluation. Menunggu penugasan reviewer/juri (maks. 4 orang)."
        : "Tidak lolos Desk Evaluation (orisinalitas/format belum memenuhi ketentuan)."),
    created_at: nowDateTime,
  });
  await writeDb(db);
}

export async function saveJuriAssignments(submissionId: number, juriIds: string[]): Promise<void> {
  const db = await readDb();
  const existing = db.review_assignments.filter((a) => a.submission_id === submissionId);
  const kept = existing.filter((a) => juriIds.includes(a.juri_id));
  const existingJuriIds = new Set(kept.map((a) => a.juri_id));

  db.review_assignments = db.review_assignments.filter((a) => a.submission_id !== submissionId);
  db.review_assignments.push(...kept);

  let nextId = db.review_assignments.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  const today = new Date().toISOString().slice(0, 10);
  for (const jId of juriIds) {
    if (!existingJuriIds.has(jId)) {
      db.review_assignments.push({
        id: nextId++,
        submission_id: submissionId,
        juri_id: jId,
        status: "pending",
        assigned_at: today,
      });
    }
  }

  const s = db.submissions.find((x) => x.id === submissionId);
  if (s && juriIds.length >= 1 && (s.status === "submitted" || s.status === "desk_review")) {
    s.status = "review";
    const logId = db.status_logs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const nowDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");
    db.status_logs.push({
      id: logId,
      submission_id: submissionId,
      status: "review",
      catatan: `Naskah ditugaskan kepada ${juriIds.length} reviewer/juri untuk penilaian substansi.`,
      created_at: nowDateTime,
    });
  }

  await writeDb(db);
}

export async function saveJuriReview(input: {
  submission_id: number;
  juri_id: string;
  scores: Array<{ criteria_id: number; skor: number }>;
  total_skor: number;
  komentar: string;
  rekomendasi: "Lolos" | "Revisi" | "Tidak Lolos";
}): Promise<void> {
  const db = await readDb();
  const today = new Date().toISOString().slice(0, 10);
  let assignment = db.review_assignments.find(
    (a) => a.submission_id === input.submission_id && a.juri_id === input.juri_id,
  );
  if (!assignment) {
    const nextAId = db.review_assignments.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    assignment = {
      id: nextAId,
      submission_id: input.submission_id,
      juri_id: input.juri_id,
      status: "dinilai",
      assigned_at: today,
    };
    db.review_assignments.push(assignment);
  } else {
    assignment.status = "dinilai";
  }

  const existingIdx = db.reviews.findIndex((r) => r.assignment_id === assignment.id);
  if (existingIdx >= 0) {
    db.reviews[existingIdx] = {
      ...db.reviews[existingIdx],
      total_skor: Number(input.total_skor.toFixed(2)),
      komentar: input.komentar.trim(),
      rekomendasi: input.rekomendasi,
      scores: input.scores,
    };
  } else {
    const nextRId = db.reviews.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    db.reviews.push({
      id: nextRId,
      assignment_id: assignment.id,
      total_skor: Number(input.total_skor.toFixed(2)),
      komentar: input.komentar.trim(),
      rekomendasi: input.rekomendasi,
      scores: input.scores,
    });
  }

  // Hitung rata-rata skor dari semua reviewer yang sudah menilai naskah ini
  const subAssignments = db.review_assignments.filter((a) => a.submission_id === input.submission_id);
  const subReviews = db.reviews.filter((r) => subAssignments.some((a) => a.id === r.assignment_id));
  if (subReviews.length > 0) {
    const avg = subReviews.reduce((acc, r) => acc + r.total_skor, 0) / subReviews.length;
    const sub = db.submissions.find((s) => s.id === input.submission_id);
    if (sub) {
      sub.skor_akhir = Number(avg.toFixed(2));
    }
  }

  const allDone = subAssignments.length > 0 && subAssignments.every((a) => a.status === "dinilai");
  if (allDone) {
    const logId = db.status_logs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const nowDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");
    db.status_logs.push({
      id: logId,
      submission_id: input.submission_id,
      status: "review",
      catatan: `Seluruh reviewer (${subAssignments.length} reviewer) telah selesai menilai. Menunggu rekapitulasi dan keputusan Editor.`,
      created_at: nowDateTime,
    });
  }

  await writeDb(db);
}

export async function finalizeSubmissionRecap(
  submissionId: number,
  status: SubmissionStatus,
  skorAkhir: number | null,
  catatan?: string,
): Promise<void> {
  const db = await readDb();
  const s = db.submissions.find((x) => x.id === submissionId);
  if (!s) return;
  s.status = status;
  if (skorAkhir !== null) {
    s.skor_akhir = Number(skorAkhir.toFixed(2));
  }
  const logId = db.status_logs.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  const nowDateTime = new Date().toISOString().slice(0, 16).replace("T", " ");
  const defaultMsg: Record<SubmissionStatus, string> = {
    draft: "Disimpan sebagai draft.",
    submitted: "Naskah dikirim dan menunggu verifikasi admin.",
    desk_review: "Naskah sedang diperiksa kelengkapannya oleh admin.",
    review: "Naskah dalam antrean publikasi.",
    revisi: "Admin meminta perbaikan/revisi naskah sebelum diterbitkan.",
    lolos: "Selamat! Naskah telah diverifikasi dan diterbitkan ke Katalog Publikasi.",
    juara: "Selamat! Naskah diterbitkan sebagai Pilihan Editor di Katalog Publikasi.",
    tidak_lolos: "Naskah belum dapat diterbitkan karena belum memenuhi ketentuan.",
  };
  db.status_logs.push({
    id: logId,
    submission_id: submissionId,
    status,
    catatan: catatan?.trim() || defaultMsg[status],
    created_at: nowDateTime,
  });
  await writeDb(db);
}

export async function deleteSubmissionById(submissionId: number): Promise<boolean> {
  const db = await readDb();
  const target = db.submissions.find((x) => x.id === submissionId);
  if (!target) return false;

  if (target.status !== "draft") {
    const ev = db.events.find((e) => e.id === target.event_id);
    if (ev && ev.peserta > 0) ev.peserta -= 1;
  }

  const removedAssignIds = new Set(
    db.review_assignments.filter((a) => a.submission_id === submissionId).map((a) => a.id),
  );

  db.submissions = db.submissions.filter((x) => x.id !== submissionId);
  db.submission_members = db.submission_members.filter((m) => m.submission_id !== submissionId);
  db.submission_files = db.submission_files.filter((f) => f.submission_id !== submissionId);
  db.status_logs = db.status_logs.filter((l) => l.submission_id !== submissionId);
  db.review_assignments = db.review_assignments.filter((a) => a.submission_id !== submissionId);
  db.reviews = db.reviews.filter((r) => !removedAssignIds.has(r.assignment_id));

  await writeDb(db);
  return true;
}

