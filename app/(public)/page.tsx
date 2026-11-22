import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Check, FileUp, Plus } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { StatusBadge } from "@/components/ui";
import { readDb } from "@/lib/db";
import { formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const authorSteps = [
  { code: "01", title: "Registrasi & Login", desc: "Buat akun penulis menggunakan email aktif untuk mengakses portal unggah." },
  { code: "02", title: "Pilih Periode / Event Essay & KTI", desc: "Baca cakupan tema, ketentuan halaman, jumlah penulis, dan tenggat unggah." },
  { code: "03", title: "Isi Metadata Karya", desc: "Masukkan judul lengkap, abstrak (30–300 kata), kata kunci, serta susunan anggota penulis." },
  { code: "04", title: "Upload Berkas PDF", desc: "Unggah naskah PDF dan surat pernyataan orisinalitas sesuai format penamaan." },
  { code: "05", title: "Validasi Sistem Otomatis", desc: "Sistem memeriksa format PDF, batas ukuran file, dan pola nama berkas. Jika gagal, perbaiki dan unggah ulang." },
  { code: "06", title: "Konfirmasi & Kirim", desc: "Kirim naskah (`status: submitted`). Setiap perubahan tahap tercatat pada log riwayat." },
  { code: "07", title: "Pantau Status & Publikasi", desc: "Pantau hasil desk evaluation dan penilaian juri hingga naskah dinyatakan lolos terbit atau perlu revisi." },
];

const editorialFlow = [
  { stage: "Tahap I", title: "Admin Buat Periode / Event", detail: "Redaksi menetapkan tema terbitan, tenggat waktu, batas halaman, dan bobot kriteria penilaian." },
  { stage: "Tahap II", title: "Pemeriksaan Kelengkapan", detail: "Naskah yang masuk (`submitted`) diperiksa kelengkapan administrasi dan berkas pendukungnya." },
  { stage: "Tahap III", title: "Desk Evaluation", detail: "Seleksi orisinalitas dan kesesuaian format. Naskah yang tidak memenuhi syarat langsung diberi notifikasi penolakan." },
  { stage: "Tahap IV", title: "Penugasan & Telaah Juri", detail: "Minimal 2 juri/reviewer ditugaskan per naskah untuk memberi skor per kriteria beserta catatan telaah." },
  { stage: "Tahap V", title: "Rekap Nilai & Penerbitan", detail: "Admin merekap skor akhir tertimbang dan mengumumkan status: Terbit (Lolos), Revisi, atau Karya Terbaik." },
];

const faqs = [
  {
    q: "Apakah portal ini untuk lomba atau untuk publikasi karya ilmiah?",
    a: "Portal ini merupakan repositori dan sistem penerbitan karya tulis ilmiah serta essay mahasiswa UKM SIMPEL. Seluruh naskah yang diunggah melewati proses kurasi redaksi (desk evaluation) dan telaah substansi oleh minimal 2 reviewer/juri sebelum diterbitkan.",
  },
  {
    q: "Bagaimana aturan format dan penamaan berkas saat unggah?",
    a: "Berkas utama wajib berformat PDF (maksimal 5 MB) dengan pola penamaan NamaKetua_JudulSingkat.pdf tanpa spasi, disertai Surat Pernyataan Orisinalitas (PDF, maksimal 2 MB).",
  },
  {
    q: "Apa yang terjadi jika berkas saya gagal validasi sistem?",
    a: "Sesuai alur sistem, apabila format bukan PDF, ukuran melebihi batas, atau nama file mengandung spasi, sistem langsung menampilkan pesan kesalahan spesifik agar Anda dapat memperbaiki dan mengunggah ulang.",
  },
  {
    q: "Berapa jumlah penulis dalam satu naskah KTI?",
    a: "Setiap naskah dapat ditulis secara individu maupun berkelompok (umumnya maksimal 2–3 penulis sesuai ketentuan pada periode penerimaan yang dipilih).",
  },
];

export default async function HomePage() {
  const db = await readDb();
  const openEvents = db.events.filter((e) => e.status === "open");
  const published = db.submissions.filter((s) => s.status === "lolos" || s.status === "juara");
  const featured = published[0] ?? db.submissions[0];
  const featuredAuthor = db.users.find((u) => u.id === featured?.user_id);
  const featuredEvent = db.events.find((e) => e.id === featured?.event_id);
  const featuredCat = db.categories.find((c) => c.id === featuredEvent?.category_id);
  const sampleCriteria = db.criteria.filter((c) => c.event_id === (db.events[0]?.id ?? 1));

  return (
    <>
      {/* ============================== HERO (NO LOGO IN BODY) ============================== */}
      <section className="border-b border-line-strong bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left column: Editorial Masthead */}
            <div className="lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2 border border-line-strong bg-sheet px-3 py-1.5 font-mono text-xs text-forest-900">
                <span className="size-2 rounded-full bg-forest-600" />
                <span>PORTAL PUBLIKASI &amp; REPOSITORI KARYA TULIS ILMIAH</span>
                <span className="text-muted">·</span>
                <span className="font-semibold text-forest-700">{openEvents.length} Periode Dibuka</span>
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-forest-950 sm:text-5xl lg:text-[3.5rem]">
                Unggah, kurasi, dan publikasikan karya tulis ilmiah mahasiswa.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                Sistem pengumpulan dan penerbitan naskah ilmiah UKM Studi Ilmiah Mahasiswa (SIMPEL) Universitas Pancasakti Tegal. Setiap naskah melalui validasi berkas terstruktur, <em>desk evaluation</em>, dan peninjauan oleh minimal dua reviewer sebelum diterbitkan.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/dashboard/submit" className="btn btn-primary btn-lg">
                  <FileUp className="size-4" /> Unggah Naskah KTI
                </Link>
                <Link href="#katalog" className="btn btn-outline btn-lg">
                  <BookOpen className="size-4" /> Telusuri Karya Terbit
                </Link>
              </div>

              {/* Architectural Ledger Metrics */}
              <dl className="mt-12 grid grid-cols-2 border border-line-strong bg-sheet sm:grid-cols-4">
                {[
                  { label: "Karya Terbit", value: String(published.length), unit: "Naskah Terkurasi" },
                  { label: "Total Naskah", value: String(db.submissions.length), unit: "Arsip Masuk" },
                  { label: "Periode Aktif", value: String(openEvents.length), unit: "Edisi Terbuka" },
                  { label: "Bidang Kajian", value: String(db.categories.filter((c) => c.is_active).length), unit: "Kategori Aktif" },
                ].map((m, idx) => (
                  <div
                    key={m.label}
                    className={`p-4 ${idx > 0 ? "border-t sm:border-l sm:border-t-0 border-line" : ""} ${idx === 1 ? "!border-t-0 border-l" : ""}`}
                  >
                    <dt className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{m.label}</dt>
                    <dd className="mt-1 font-display text-2xl font-semibold text-forest-950 sm:text-3xl">{m.value}</dd>
                    <p className="mt-0.5 font-mono text-[11px] text-forest-700">{m.unit}</p>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right column: Tactile Manuscript Offprint Sheet (No Logo!) */}
            {featured && (
              <div className="lg:col-span-5">
                <article className="border border-line-strong bg-sheet shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-forest-950 px-5 py-3 text-white">
                    <span className="font-mono text-[11px] tracking-wider text-gold-300">
                      ARSIP TERBITAN · {featuredEvent?.volume}
                    </span>
                    <span className="font-mono text-[11px] text-forest-200">
                      KODE: SMPL-2026-{featured.id}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-forest-700">
                        {featuredCat?.nama ?? "Karya Tulis Ilmiah"}
                      </span>
                      <StatusBadge status={featured.status} />
                    </div>

                    <h2 className="mt-3 text-xl font-semibold leading-snug text-forest-950 sm:text-2xl">
                      <Link href={`/katalog/${featured.id}`} className="hover:text-forest-700">
                        {featured.judul}
                      </Link>
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-line py-2.5 text-xs text-muted">
                      <span className="font-semibold text-ink">{featuredAuthor?.nama}</span>
                      <span>·</span>
                      <span>{featuredAuthor?.institusi}</span>
                      <span>·</span>
                      <span className="font-mono">NIM {featuredAuthor?.nim_nisn}</span>
                    </div>

                    <div className="mt-4">
                      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                        Abstrak
                      </p>
                      <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-ink/85">
                        {featured.abstrak}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {featured.kata_kunci.split(",").map((kw) => (
                        <span
                          key={kw}
                          className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-forest-900"
                        >
                          {kw.trim()}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <div className="font-mono text-xs">
                        <span className="text-muted">Skor Kurasi: </span>
                        <strong className="text-forest-900">{featured.skor_akhir ?? "—"} / 100</strong>
                      </div>
                      <Link
                        href={`/katalog/${featured.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:underline"
                      >
                        Baca Rincian Naskah <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================== 01 / KATALOG KARYA TERBIT ============================== */}
      <section id="katalog" className="scroll-mt-20 border-b border-line bg-sheet py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">01 / ARSIP &amp; KATALOG PUBLIKASI</p>
              <h2 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-4xl">
                Karya Tulis Ilmiah yang Telah Terbit ({published.length})
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-muted">
                Naskah yang telah lulus <em>desk evaluation</em> dan penilaian substansi oleh dewan reviewer/juri UKM SIMPEL.
              </p>
            </div>
            <Link href="/dashboard/submit" className="btn btn-outline self-start md:self-auto">
              Ajukan Naskah Anda <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 divide-y divide-line border border-line bg-sheet">
            {published.map((item, index) => {
              const author = db.users.find((u) => u.id === item.user_id);
              const ev = db.events.find((e) => e.id === item.event_id);
              const cat = db.categories.find((c) => c.id === (ev?.category_id ?? 1));
              return (
                <article
                  key={item.id}
                  className="grid gap-6 p-5 transition-colors hover:bg-paper/60 sm:p-6 lg:grid-cols-12"
                >
                  <div className="flex flex-row items-center justify-between gap-2 lg:col-span-3 lg:flex-col lg:items-start lg:justify-start">
                    <span className="font-mono text-xs font-semibold text-forest-800">
                      #{String(index + 1).padStart(2, "0")} · SMPL-{item.id}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {ev?.volume} · {formatShortDate(item.submitted_at)}
                    </span>
                    <div className="hidden lg:mt-3 lg:block">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-forest-700">
                        {cat?.nama}
                      </span>
                      <span className="lg:hidden">
                        <StatusBadge status={item.status} />
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold leading-snug text-forest-950">
                      <Link href={`/katalog/${item.id}`} className="hover:text-forest-700">
                        {item.judul}
                      </Link>
                    </h3>
                    <p className="mt-2 text-xs text-muted">
                      Penulis: <strong className="text-ink">{author?.nama}</strong> ({author?.institusi})
                    </p>
                    <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink/80">
                      {item.abstrak}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.kata_kunci.split(",").map((k) => (
                        <span
                          key={k}
                          className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-muted"
                        >
                          #{k.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between border-t border-line pt-4 lg:col-span-2 lg:flex-col lg:items-end lg:justify-between lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="lg:text-right">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">Nilai Kurasi</p>
                      <p className="font-display text-2xl font-semibold text-forest-900">{item.skor_akhir ?? "—"}</p>
                    </div>
                    <Link href={`/katalog/${item.id}`} className="btn btn-outline btn-sm">
                      Baca Naskah <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== 02 / PERIODE PENERIMAAN (EVENTS) ============================== */}
      <section className="border-b border-line bg-paper py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-line-strong pb-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">02 / PERIODE &amp; EVENT UNGGAH NASKAH</p>
              <h2 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-4xl">
                Jadwal Penerimaan Karya Tulis Ilmiah
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-muted">
                Pilih periode publikasi atau <em>call for papers</em> yang sesuai dengan topik dan kategori karya tulis Anda.
              </p>
            </div>
            <Link href="/events" className="btn btn-outline self-start md:self-auto">
              Lihat Semua Periode ({db.events.length}) <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {openEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>

          {/* Categories strip */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {db.categories.map((c) => (
              <div key={c.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-forest-700">KATEGORI 0{c.id}</span>
                  <span className={`font-mono text-[11px] font-semibold ${c.is_active ? "text-forest-700" : "text-muted"}`}>
                    {c.is_active ? "● Aktif" : "○ Nonaktif"}
                  </span>
                </div>
                <h3 className="mt-2 font-sans text-base font-bold text-forest-950">{c.nama}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{c.deskripsi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 03 / ALUR PENULIS & REDAKSI ============================== */}
      <section id="alur" className="scroll-mt-20 border-b border-line bg-sheet py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-line pb-6">
            <p className="eyebrow">03 / PROSEDUR PENGAJUAN &amp; STANDAR KURASI</p>
            <h2 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-4xl">
              Alur Penulis dan Tahapan Evaluasi Redaksi
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">
              Dirancang transparan mengikuti alur kerja penulis dan redaksi UKM SIMPEL — mulai dari verifikasi berkas otomatis hingga rekapitulasi nilai reviewer.
            </p>
          </div>

          <div className="mt-8">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-forest-800">
              A. Alur Unggah Penulis (7 Tahap)
            </h3>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {authorSteps.map((s) => (
                <li key={s.code} className="border border-line bg-paper/50 p-5">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <span className="font-mono text-xs font-bold text-forest-800">LANGKAH {s.code}</span>
                    {s.code === "05" && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-900">
                        Cek Otomatis
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 font-sans text-sm font-bold text-forest-950">{s.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{s.desc}</p>
                </li>
              ))}
              <li className="flex flex-col justify-between border border-forest-800 bg-forest-950 p-5 text-white">
                <div>
                  <span className="font-mono text-xs font-semibold text-gold-300">MULAI SEKARANG</span>
                  <h4 className="mt-2 font-display text-xl font-semibold">Siap mengunggah naskah Anda?</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-forest-200/80">
                    Siapkan file PDF naskah beserta surat pernyataan orisinalitas.
                  </p>
                </div>
                <Link href="/dashboard/submit" className="btn btn-gold btn-sm mt-4 w-full">
                  Buka Formulir Unggah <ArrowRight className="size-3.5" />
                </Link>
              </li>
            </ol>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-forest-800">
                B. Alur Redaksi Admin &amp; Reviewer (5 Tahap)
              </h3>
              <div className="mt-4 divide-y divide-line border border-line">
                {editorialFlow.map((ef) => (
                  <div key={ef.stage} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-5">
                    <span className="w-24 shrink-0 font-mono text-xs font-bold text-forest-700">{ef.stage}</span>
                    <div>
                      <h4 className="font-sans text-sm font-bold text-forest-950">{ef.title}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{ef.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-forest-800">
                C. Rubrik &amp; Bobot Penilaian Reviewer
              </h3>
              <div className="mt-4 border border-line bg-paper p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <span className="font-sans text-sm font-bold text-forest-950">Komponen Kriteria Standar</span>
                  <span className="font-mono text-xs font-semibold text-forest-800">Total 100%</span>
                </div>

                <div className="mt-5 space-y-4">
                  {sampleCriteria.map((c) => (
                    <div key={c.id}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">{c.nama}</span>
                        <span className="font-mono font-bold text-forest-800">{c.bobot}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full border border-line bg-sheet">
                        <div className="h-full bg-forest-700" style={{ width: `${c.bobot * 3.33}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-line pt-4 font-mono text-xs text-muted">
                  <p className="font-semibold text-forest-950">Perhitungan Skor Akhir:</p>
                  <p className="mt-1">Skor Akhir = Σ (Skor Kriteria × Bobot) ÷ Jumlah Reviewer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== 04 / PANDUAN & FAQ ============================== */}
      <section id="panduan" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow">04 / KETENTUAN &amp; TANYA JAWAB</p>
              <h2 className="mt-2 text-3xl font-semibold text-forest-950">
                Standar Berkas &amp; Informasi Penulis
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Pastikan naskah yang Anda ajukan memenuhi spesifikasi teknis berikut agar langsung lolos tahap validasi sistem dan <em>desk evaluation</em>.
              </p>

              <div className="mt-6 border border-line bg-sheet p-5">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-forest-800">
                  Daftar Periksa Unggah Berkas
                </h3>
                <ul className="mt-3.5 space-y-2.5 text-xs text-ink/85">
                  {[
                    "Format dokumen wajib PDF (maks. 5 MB untuk naskah utama)",
                    "Nama file tanpa spasi: NamaKetua_JudulSingkat.pdf",
                    "Melampirkan Surat Pernyataan Orisinalitas bertanda tangan",
                    "Abstrak memuat latar belakang, metode, dan simpulan (30–300 kata)",
                    "Mencantumkan 3–6 kata kunci yang relevan",
                  ].map((rule) => (
                    <li key={rule} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-forest-700" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-7">
              {faqs.map((f, i) => (
                <details
                  key={f.q}
                  className="card group [&_summary::-webkit-details-marker]:hidden"
                  open={i === 0}
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-forest-950 sm:px-6">
                    <span>{f.q}</span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded border border-line bg-paper text-forest-800 transition-transform group-open:rotate-45">
                      <Plus className="size-4" />
                    </span>
                  </summary>
                  <p className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted sm:px-6">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
