/**
 * Data contoh (mock) mengikuti ERD SIMPEL:
 * categories, events, criteria, users, submissions, submission_members,
 * submission_files, status_logs, review_assignments, reviews, review_scores.
 *
 * Domain: Portal Unggah & Publikasi Karya Tulis Ilmiah (KTI & Essay Ilmiah)
 * UKM Studi Ilmiah Mahasiswa (SIMPEL) Universitas Pancasakti Tegal.
 */

export type Role = "admin" | "peserta" | "juri";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "desk_review"
  | "tidak_lolos"
  | "review"
  | "revisi"
  | "lolos"
  | "juara";

export type EventStatus = "draft" | "open" | "review" | "closed" | "announced";

export interface Category {
  id: number;
  nama: string;
  deskripsi: string;
  is_active: boolean;
}

export interface EventItem {
  id: number;
  category_id: number;
  nama: string;
  tema: string;
  deskripsi: string;
  deadline: string;
  max_halaman: number;
  max_anggota: number;
  status: EventStatus;
  volume: string;
  peserta: number;
}

export interface Criteria {
  id: number;
  event_id: number;
  nama: string;
  bobot: number;
}

export interface User {
  id: string;
  nama: string;
  email: string;
  role: Role;
  institusi: string;
  nim_nisn: string;
  no_hp: string;
  created_at: string;
}

export interface Submission {
  id: number;
  event_id: number;
  user_id: string;
  judul: string;
  abstrak: string;
  kata_kunci: string;
  status: SubmissionStatus;
  skor_akhir: number | null;
  submitted_at: string;
}

export interface Member {
  id: number;
  submission_id: number;
  nama: string;
  institusi: string;
  email: string;
  peran: "Ketua" | "Anggota";
}

export interface SubmissionFile {
  id: number;
  submission_id: number;
  jenis_berkas: string;
  file_path: string;
  versi: number;
  uploaded_at: string;
  size: string;
}

export interface StatusLog {
  id: number;
  submission_id: number;
  status: SubmissionStatus;
  catatan: string;
  created_at: string;
}

export interface Assignment {
  id: number;
  submission_id: number;
  juri_id: string;
  status: "pending" | "dinilai";
  assigned_at: string;
}

export interface Review {
  id: number;
  assignment_id: number;
  total_skor: number;
  komentar: string;
  rekomendasi: "Lolos" | "Revisi" | "Tidak Lolos";
  scores: { criteria_id: number; skor: number }[];
}

/** Tanggal acuan deterministik untuk perhitungan sisa hari. */
export const REFERENCE_DATE = "2026-11-22";

export const STATUS_META: Record<SubmissionStatus, { label: string; className: string; dot: string }> = {
  draft: { label: "Draft", className: "bg-stone-100 text-stone-700 ring-stone-300", dot: "bg-stone-500" },
  submitted: { label: "Submitted", className: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-600" },
  desk_review: { label: "Desk Evaluation", className: "bg-amber-50 text-amber-900 ring-amber-200", dot: "bg-amber-600" },
  tidak_lolos: { label: "Ditolak / Tidak Lolos", className: "bg-red-50 text-red-800 ring-red-200", dot: "bg-red-600" },
  review: { label: "Ditinjau Juri", className: "bg-gold-50 text-gold-700 ring-gold-300", dot: "bg-gold-500" },
  revisi: { label: "Perlu Revisi", className: "bg-orange-50 text-orange-800 ring-orange-200", dot: "bg-orange-600" },
  lolos: { label: "Terbit (Lolos)", className: "bg-forest-50 text-forest-800 ring-forest-200", dot: "bg-forest-600" },
  juara: { label: "Terbit · Karya Terbaik", className: "bg-gold-100 text-forest-950 ring-gold-400", dot: "bg-gold-600" },
};

export const EVENT_STATUS_META: Record<EventStatus, { label: string; className: string }> = {
  draft: { label: "Draft Redaksi", className: "bg-stone-100 text-stone-700 ring-stone-300" },
  open: { label: "Penerimaan Naskah Dibuka", className: "bg-forest-50 text-forest-800 ring-forest-300" },
  review: { label: "Tahap Telaah & Kurasi", className: "bg-gold-50 text-gold-700 ring-gold-300" },
  closed: { label: "Penerimaan Ditutup", className: "bg-stone-100 text-stone-700 ring-stone-300" },
  announced: { label: "Telah Diterbitkan", className: "bg-forest-900 text-gold-200 ring-forest-800" },
};

export const categories: Category[] = [
  { id: 1, nama: "Essay", deskripsi: "Tulisan gagasan kritis dan argumentatif berbasis referensi ilmiah.", is_active: true },
  { id: 2, nama: "Makalah", deskripsi: "Pembahasan sistematis suatu topik akademik dengan rumusan masalah dan tinjauan pustaka.", is_active: true },
  { id: 3, nama: "Artikel Jurnal", deskripsi: "Naskah hasil penelitian empiris dengan struktur pendahuluan, metode, hasil, dan pembahasan.", is_active: true },
  { id: 4, nama: "Literature Review", deskripsi: "Tinjauan pustaka sistematis yang mensintesis berbagai temuan riset terdahulu.", is_active: true },
  { id: 5, nama: "Proposal PKM / Riset", deskripsi: "Rancangan gagasan program kreativitas mahasiswa, riset terapan, atau pengabdian.", is_active: true },
];

export const events: EventItem[] = [
  {
    id: 1,
    category_id: 1,
    nama: "Penerimaan Naskah Essay Mahasiswa — Edisi Gasal",
    tema: "Transformasi Digital, Pendidikan, dan Ekonomi Komunitas Pesisir",
    deskripsi:
      "Periode unggah naskah essay mahasiswa untuk diterbitkan pada repositori resmi UKM SIMPEL. Naskah yang masuk akan melewati pemeriksaan kelengkapan, desk evaluation (orisinalitas & format), serta telaah substansi oleh minimal 2 reviewer/juri.",
    deadline: "2026-12-20",
    max_halaman: 10,
    max_anggota: 2,
    status: "open",
    volume: "Vol. 04 · No. 02",
    peserta: 48,
  },
  {
    id: 2,
    category_id: 2,
    nama: "Pengumpulan Makalah Akademik & Kajian Ilmiah 2026/2027",
    tema: "Ketahanan Pangan, Lingkungan, dan Teknologi Tepat Guna Daerah",
    deskripsi:
      "Penerimaan naskah makalah akademik mahasiswa lintas program studi. Setiap makalah ditelaah secara objektif menggunakan rubrik kriteria berbobot sebelum dipublikasikan secara terbuka.",
    deadline: "2027-01-15",
    max_halaman: 18,
    max_anggota: 3,
    status: "open",
    volume: "Vol. 05 · No. 01",
    peserta: 36,
  },
  {
    id: 3,
    category_id: 3,
    nama: "Publikasi Artikel Jurnal Mahasiswa SIMPEL",
    tema: "Etika Teknologi, Literasi Informasi, dan Riset Terapan Kampus",
    deskripsi:
      "Wadah publikasi artikel jurnal hasil riset mahasiswa D3/D4/S1 dengan struktur artikel ilmiah standar.",
    deadline: "2026-12-05",
    max_halaman: 15,
    max_anggota: 3,
    status: "open",
    volume: "Vol. 04 · No. 03",
    peserta: 62,
  },
  {
    id: 4,
    category_id: 4,
    nama: "Katalog Literature Review: Transisi Energi & Ekologi",
    tema: "Inovasi Energi Bersih dan Pengelolaan Limbah Berbasis Komunitas",
    deskripsi:
      "Edisi tematik naskah tinjauan pustaka (literature review) dan makalah seputar strategi transisi energi bersih skala daerah yang telah diterbitkan.",
    deadline: "2026-10-30",
    max_halaman: 15,
    max_anggota: 3,
    status: "announced",
    volume: "Vol. 04 · No. 01",
    peserta: 41,
  },
];

export const criteria: Criteria[] = events.flatMap((e) => [
  { id: e.id * 10 + 1, event_id: e.id, nama: "Orisinalitas & Kebaruan Gagasan", bobot: 30 },
  { id: e.id * 10 + 2, event_id: e.id, nama: "Kedalaman Substansi & Relevansi Tema", bobot: 30 },
  { id: e.id * 10 + 3, event_id: e.id, nama: "Ketepatan Metodologi & Referensi", bobot: 20 },
  { id: e.id * 10 + 4, event_id: e.id, nama: "Sistematika & Kaidah Bahasa Ilmiah", bobot: 20 },
]);

export const users: User[] = [
  { id: "u-admin", nama: "Redaksi Admin SIMPEL", email: "admin@simpel.ac.id", role: "admin", institusi: "UKM SIMPEL UPS Tegal", nim_nisn: "-", no_hp: "081200000000", created_at: "2026-08-01" },
  { id: "u-1", nama: "Nadia Putri Rahmawati", email: "nadia@upstegal.ac.id", role: "peserta", institusi: "Universitas Pancasakti Tegal", nim_nisn: "2201010023", no_hp: "081234567801", created_at: "2026-10-02" },
  { id: "u-2", nama: "Rizky Aditya Pratama", email: "rizky@upstegal.ac.id", role: "peserta", institusi: "Universitas Pancasakti Tegal", nim_nisn: "2104123456", no_hp: "081234567802", created_at: "2026-10-05" },
  { id: "u-3", nama: "Salsabila Azzahra", email: "salsa@mail.ac.id", role: "peserta", institusi: "Universitas Diponegoro", nim_nisn: "220498877", no_hp: "081234567803", created_at: "2026-10-11" },
  { id: "u-4", nama: "Fajar Nugroho", email: "fajar@mail.ac.id", role: "peserta", institusi: "Politeknik Harapan Bersama", nim_nisn: "230411009", no_hp: "081234567804", created_at: "2026-10-14" },
  { id: "u-5", nama: "Aulia Rahma", email: "aulia@upstegal.ac.id", role: "peserta", institusi: "Universitas Pancasakti Tegal", nim_nisn: "2301020018", no_hp: "081234567805", created_at: "2026-10-20" },
  { id: "u-6", nama: "Bima Sakti Wibowo", email: "bima@upstegal.ac.id", role: "peserta", institusi: "Universitas Pancasakti Tegal", nim_nisn: "2112321045", no_hp: "081234567806", created_at: "2026-10-21" },
  { id: "j-1", nama: "Dr. Hendra Kusuma, M.Pd.", email: "hendra@ups.ac.id", role: "juri", institusi: "Universitas Pancasakti Tegal", nim_nisn: "NIDN-0612088101", no_hp: "081300000001", created_at: "2026-09-01" },
  { id: "j-2", nama: "Dr. Ratna Sari, M.Si.", email: "ratna@ups.ac.id", role: "juri", institusi: "Universitas Pancasakti Tegal", nim_nisn: "NIDN-0623048502", no_hp: "081300000002", created_at: "2026-09-01" },
  { id: "j-3", nama: "Ir. Bambang Setiawan, M.T.", email: "bambang@ups.ac.id", role: "juri", institusi: "Universitas Pancasakti Tegal", nim_nisn: "NIDN-0604117903", no_hp: "081300000003", created_at: "2026-09-03" },
];

export const submissions: Submission[] = [
  {
    id: 101,
    event_id: 1,
    user_id: "u-1",
    judul: "SIGAP-Desa: Model Literasi Digital Berbasis Komunitas untuk Pemberdayaan UMKM Pesisir Tegal",
    abstrak:
      "Kesenjangan literasi digital di kawasan pesisir masih menjadi penghambat utama transformasi ekonomi mikro. Karya tulis ini merumuskan model SIGAP-Desa yang memadukan pendampingan sebaya mahasiswa, modul pembelajaran mikro terstruktur, dan tata kelola katalog produk lokal untuk memperkuat daya saing UMKM pesisir secara berkelanjutan.",
    kata_kunci: "literasi digital, UMKM pesisir, pemberdayaan masyarakat, ekonomi lokal",
    status: "review",
    skor_akhir: null,
    submitted_at: "2026-11-10",
  },
  {
    id: 102,
    event_id: 3,
    user_id: "u-1",
    judul: "Kerangka Etika Penggunaan Kecerdasan Buatan Generatif dalam Penulisan Akademik Mahasiswa",
    abstrak:
      "Penggunaan perangkat AI generatif di lingkungan perguruan tinggi membutuhkan batasan metodologis dan etis yang jelas agar integritas ilmiah tetap terjaga. Kajian ini menyusun pedoman transparansi sitasi dan verifikasi referensi bagi mahasiswa.",
    kata_kunci: "etika akademik, kecerdasan buatan, integritas ilmiah",
    status: "draft",
    skor_akhir: null,
    submitted_at: "2026-11-20",
  },
  {
    id: 103,
    event_id: 4,
    user_id: "u-1",
    judul: "Pemanfaatan Limbah Organik Pasar Tradisional Kota Tegal sebagai Biodigester Komunal Skala Kelurahan",
    abstrak:
      "Timbulan sampah organik pasar tradisional menyumbang beban signifikan pada TPA daerah. Penelitian ini menganalisis potensi konversi limbah sayur dan buah menjadi biogas komunal melalui reaktor anaerobik berbiaya rendah beserta skema pengelolaan partisipatif warga sekitar pasar.",
    kata_kunci: "biogas komunal, limbah organik, energi terbarukan, Kota Tegal",
    status: "lolos",
    skor_akhir: 86.4,
    submitted_at: "2026-10-25",
  },
  {
    id: 104,
    event_id: 1,
    user_id: "u-2",
    judul: "Sistem Pemantauan Mikroklimat Tambak Garam Berbasis IoT Daya Rendah di Pesisir Pantura",
    abstrak:
      "Fluktuasi cuaca ekstrem memengaruhi produktivitas dan kualitas kristal garam rakyat. Naskah ini mendeskripsikan purwarupa sensor kelembapan, suhu, dan salinitas berbasis LoRa untuk membantu petambak menentukan waktu kristalisasi secara presisi.",
    kata_kunci: "IoT, tambak garam, mikroklimat, Pantura",
    status: "desk_review",
    skor_akhir: null,
    submitted_at: "2026-11-15",
  },
  {
    id: 105,
    event_id: 1,
    user_id: "u-3",
    judul: "Integrasi Bank Sampah Kampus dengan Insentif Akademik sebagai Instrumen Ekonomi Sirkular",
    abstrak:
      "Studi mengenai rancangan tata kelola bank sampah terpadu di lingkungan kampus yang terhubung dengan pencatatan kontribusi mahasiswa.",
    kata_kunci: "ekonomi sirkular, bank sampah, kampus berkelanjutan",
    status: "submitted",
    skor_akhir: null,
    submitted_at: "2026-11-18",
  },
  {
    id: 106,
    event_id: 2,
    user_id: "u-4",
    judul: "Optimasi Fermentasi Tepung Mocaf Berbasis Singkong Lokal Jawa Tengah sebagai Substitusi Gandum",
    abstrak:
      "Kajian eksperimental variasi waktu fermentasi terhadap karakteristik fisikokimia tepung mocaf untuk meningkatkan kualitas produk pangan lokal.",
    kata_kunci: "mocaf, ketahanan pangan, fermentasi, singkong lokal",
    status: "submitted",
    skor_akhir: null,
    submitted_at: "2026-11-19",
  },
  {
    id: 107,
    event_id: 4,
    user_id: "u-6",
    judul: "Model Pembiayaan Kolektif Panel Surya Atap Gedung Kampus untuk Kemandirian Energi Pendidikan",
    abstrak:
      "Karya tulis ini memaparkan analisis kelayakan teknis dan model pendanaan gotong royong instalasi PLTS atap pada gedung perkuliahan sebagai laboratorium hidup transisi energi bersih.",
    kata_kunci: "PLTS atap, energi bersih, pembiayaan kolektif, kampus",
    status: "juara",
    skor_akhir: 91.2,
    submitted_at: "2026-10-22",
  },
  {
    id: 108,
    event_id: 4,
    user_id: "u-2",
    judul: "Evaluasi Kesiapan Jaringan Distribusi Listrik Pedesaan terhadap Adopsi Kompor Induksi",
    abstrak:
      "Analisis beban puncak dan keandalan jaringan tegangan rendah pada desa percontohan konversi energi memasak bersih.",
    kata_kunci: "kompor induksi, jaringan listrik, transisi energi",
    status: "revisi",
    skor_akhir: 74.5,
    submitted_at: "2026-10-28",
  },
  {
    id: 109,
    event_id: 3,
    user_id: "u-5",
    judul: "Peran Komunitas Diskusi Mahasiswa dalam Menangkal Disinformasi Sains di Media Sosial",
    abstrak:
      "Tinjauan terhadap pola verifikasi informasi ilmiah melalui kelompok studi mahasiswa lintas fakultas.",
    kata_kunci: "literasi sains, disinformasi, kelompok studi",
    status: "tidak_lolos",
    skor_akhir: null,
    submitted_at: "2026-11-12",
  },
  {
    id: 110,
    event_id: 4,
    user_id: "u-3",
    judul: "Rancang Bangun Turbin Mikrohidro Saluran Irigasi Sekunder untuk Penerangan Jalan Dusun Lereng Slamet",
    abstrak:
      "Pemanfaatan debit konstan saluran irigasi sekunder menggunakan turbin ulir Archimedes berhead rendah untuk menyuplai listrik penerangan jalan umum dusun.",
    kata_kunci: "mikrohidro, turbin ulir, irigasi, energi desa",
    status: "lolos",
    skor_akhir: 84.1,
    submitted_at: "2026-10-27",
  },
];

export const members: Member[] = [
  { id: 1, submission_id: 101, nama: "Nadia Putri Rahmawati", institusi: "Universitas Pancasakti Tegal", email: "nadia@upstegal.ac.id", peran: "Ketua" },
  { id: 2, submission_id: 101, nama: "Dimas Arya Saputra", institusi: "Universitas Pancasakti Tegal", email: "dimas@upstegal.ac.id", peran: "Anggota" },
  { id: 3, submission_id: 101, nama: "Laila Nur Fitri", institusi: "Universitas Pancasakti Tegal", email: "laila@upstegal.ac.id", peran: "Anggota" },
  { id: 4, submission_id: 103, nama: "Nadia Putri Rahmawati", institusi: "Universitas Pancasakti Tegal", email: "nadia@upstegal.ac.id", peran: "Ketua" },
  { id: 5, submission_id: 107, nama: "Bima Sakti Wibowo", institusi: "Universitas Pancasakti Tegal", email: "bima@upstegal.ac.id", peran: "Ketua" },
  { id: 6, submission_id: 110, nama: "Salsabila Azzahra", institusi: "Universitas Diponegoro", email: "salsa@mail.ac.id", peran: "Ketua" },
];

export const files: SubmissionFile[] = [
  { id: 1, submission_id: 101, jenis_berkas: "Naskah Lengkap (PDF)", file_path: "101/Nadia_SIGAP-Desa.pdf", versi: 2, uploaded_at: "2026-11-10", size: "1.8 MB" },
  { id: 2, submission_id: 101, jenis_berkas: "Surat Pernyataan Orisinalitas", file_path: "101/Surat_Orisinalitas_101.pdf", versi: 1, uploaded_at: "2026-11-09", size: "420 KB" },
  { id: 3, submission_id: 101, jenis_berkas: "Lampiran Data & Instrumen", file_path: "101/Lampiran_Data_101.pdf", versi: 1, uploaded_at: "2026-11-09", size: "610 KB" },
  { id: 4, submission_id: 104, jenis_berkas: "Naskah Lengkap (PDF)", file_path: "104/Rizky_IoT-Tambak.pdf", versi: 1, uploaded_at: "2026-11-15", size: "2.1 MB" },
  { id: 5, submission_id: 104, jenis_berkas: "Surat Pernyataan Orisinalitas", file_path: "104/Surat_Orisinalitas_104.pdf", versi: 1, uploaded_at: "2026-11-15", size: "380 KB" },
];

export const statusLogs: StatusLog[] = [
  { id: 1, submission_id: 101, status: "submitted", catatan: "Naskah berhasil diunggah dan lolos validasi format, ukuran, serta penamaan berkas.", created_at: "2026-11-10 09:12" },
  { id: 2, submission_id: 101, status: "desk_review", catatan: "Redaksi admin memeriksa kelengkapan berkas, surat orisinalitas, dan kesesuaian template.", created_at: "2026-11-12 14:30" },
  { id: 3, submission_id: 101, status: "review", catatan: "Lolos desk evaluation. Naskah ditugaskan kepada 2 reviewer/juri untuk penilaian substansi.", created_at: "2026-11-14 10:05" },
];

export const assignments: Assignment[] = [
  { id: 1, submission_id: 101, juri_id: "j-1", status: "dinilai", assigned_at: "2026-11-14" },
  { id: 2, submission_id: 101, juri_id: "j-2", status: "pending", assigned_at: "2026-11-14" },
  { id: 3, submission_id: 107, juri_id: "j-1", status: "dinilai", assigned_at: "2026-11-02" },
  { id: 4, submission_id: 107, juri_id: "j-3", status: "dinilai", assigned_at: "2026-11-02" },
  { id: 5, submission_id: 103, juri_id: "j-2", status: "dinilai", assigned_at: "2026-11-02" },
  { id: 6, submission_id: 103, juri_id: "j-3", status: "dinilai", assigned_at: "2026-11-02" },
  { id: 7, submission_id: 110, juri_id: "j-1", status: "dinilai", assigned_at: "2026-11-02" },
  { id: 8, submission_id: 110, juri_id: "j-2", status: "dinilai", assigned_at: "2026-11-02" },
  { id: 9, submission_id: 108, juri_id: "j-2", status: "dinilai", assigned_at: "2026-11-02" },
  { id: 10, submission_id: 108, juri_id: "j-3", status: "pending", assigned_at: "2026-11-02" },
];

export const reviews: Review[] = [
  {
    id: 1,
    assignment_id: 1,
    total_skor: 85.5,
    rekomendasi: "Lolos",
    komentar: "Kerangka konseptual relevan dan aplikatif untuk konteks lokal. Perkuat tabel perbandingan literatur pada bagian pembahasan.",
    scores: [
      { criteria_id: 11, skor: 88 },
      { criteria_id: 12, skor: 86 },
      { criteria_id: 13, skor: 80 },
      { criteria_id: 14, skor: 87 },
    ],
  },
  {
    id: 2,
    assignment_id: 5,
    total_skor: 87.0,
    rekomendasi: "Lolos",
    komentar: "Kajian kuat dengan data lapangan yang memadai dan layak diterbitkan pada repositori ilmiah SIMPEL.",
    scores: [
      { criteria_id: 41, skor: 90 },
      { criteria_id: 42, skor: 88 },
      { criteria_id: 43, skor: 84 },
      { criteria_id: 44, skor: 84 },
    ],
  },
  {
    id: 3,
    assignment_id: 3,
    total_skor: 92.0,
    rekomendasi: "Lolos",
    komentar: "Analisis teknis dan finansial sangat komprehensif. Direkomendasikan sebagai karya terbaik edisi ini.",
    scores: [
      { criteria_id: 41, skor: 94 },
      { criteria_id: 42, skor: 92 },
      { criteria_id: 43, skor: 90 },
      { criteria_id: 44, skor: 90 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const getEvent = (id: number) => events.find((e) => e.id === id);
export const getCategory = (id: number) => categories.find((c) => c.id === id);
export const getUser = (id: string) => users.find((u) => u.id === id);
export const getSubmission = (id: number) => submissions.find((s) => s.id === id);
export const eventCriteria = (eventId: number) => criteria.filter((c) => c.event_id === eventId);
export const submissionMembers = (id: number) => members.filter((m) => m.submission_id === id);
export const submissionFiles = (id: number) => files.filter((f) => f.submission_id === id);
export const submissionLogs = (id: number) => statusLogs.filter((l) => l.submission_id === id);
export const submissionAssignments = (id: number) => assignments.filter((a) => a.submission_id === id);
export const juries = users.filter((u) => u.role === "juri");
export const publishedSubmissions = submissions.filter((s) => s.status === "lolos" || s.status === "juara");

/** Penulis yang sedang aktif pada mode demo. */
export const DEMO_PESERTA_ID = "u-1";
