import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BellRing,
  BookOpen,
  Check,
  Feather,
  FileUp,
  GraduationCap,
  Lightbulb,
  PenLine,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { BookMascot } from "@/components/book-mascot";
import { EventCard } from "@/components/event-card";
import { Reveal } from "@/components/reveal";
import { StatusBadge } from "@/components/ui";
import { readDb } from "@/lib/db";
import { formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const authorSteps = [
  { icon: UserPlus, title: "Buat akun", desc: "Daftar dengan email aktif. Gratis dan hanya semenit." },
  { icon: Search, title: "Pilih jenis & periode", desc: "Essay, makalah, artikel jurnal, dan lainnya. Pilih yang cocok." },
  { icon: PenLine, title: "Isi data naskah", desc: "Judul, abstrak, kata kunci, dan siapa saja penulisnya." },
  { icon: FileUp, title: "Unggah PDF", desc: "Sistem langsung mengecek format, ukuran, dan nama berkasmu.", badge: "Dicek otomatis" },
  { icon: BadgeCheck, title: "Kirim ke redaksi", desc: "Cek ulang lalu kirim. Statusnya berubah jadi submitted." },
  { icon: BellRing, title: "Pantau prosesnya", desc: "Lihat tiap tahap penilaian langsung dari dashboardmu." },
  { icon: Award, title: "Terbit!", desc: "Naskah yang lolos tampil di katalog, lengkap dengan skor kurasi." },
];

const editorialFlow = [
  { title: "Periode dibuka", detail: "Redaksi menetapkan tema, tenggat, batas halaman, dan bobot penilaian." },
  { title: "Cek kelengkapan", detail: "Setiap naskah yang masuk diperiksa berkas dan administrasinya." },
  { title: "Desk evaluation", detail: "Seleksi orisinalitas dan format. Yang belum sesuai langsung diberi kabar." },
  { title: "Telaah oleh juri", detail: "Minimal 2 juri menilai tiap naskah per kriteria, lengkap dengan catatan." },
  { title: "Rekap & terbit", detail: "Skor akhir dihitung adil, lalu naskah terbaik diterbitkan ke katalog." },
];

const faqs = [
  {
    q: "Ini lomba atau tempat publikasi?",
    a: "Ini tempat publikasi. Kamu mengunggah naskah (essay, makalah, artikel jurnal, dan sejenisnya) untuk ditelaah redaksi UKM SIMPEL dan diterbitkan di repositori jika lolos kurasi.",
  },
  {
    q: "Format berkas apa yang diterima?",
    a: "PDF dengan ukuran maksimal 5 MB, bernama NamaKetua_JudulSingkat.pdf tanpa spasi. Tambahkan juga surat pernyataan orisinalitas (PDF, maksimal 2 MB).",
  },
  {
    q: "Bagaimana kalau berkasku gagal validasi?",
    a: "Tenang, sistem langsung menjelaskan penyebabnya (format, ukuran, atau nama file). Perbaiki lalu unggah ulang sebelum tenggat.",
  },
  {
    q: "Berapa penulis yang boleh dalam satu naskah?",
    a: "Bisa individu atau tim. Batasnya tertera pada tiap periode penerimaan, umumnya 2–3 penulis.",
  },
];

const SPINES = ["bg-forest-700", "bg-gold-400", "bg-olive-500", "bg-forest-500"];

export default async function HomePage() {
  const db = await readDb();
  const openEvents = db.events.filter((e) => e.status === "open");
  const published = db.submissions.filter((s) => s.status === "lolos" || s.status === "juara");
  const activeCats = db.categories.filter((c) => c.is_active);
  const sampleCriteria = db.criteria.filter((c) => c.event_id === (db.events[0]?.id ?? 1)).slice(0, 4);
  const catName = (id: number) => db.categories.find((c) => c.id === id)?.nama;

  const stats = [
    { v: published.length, l: "Karya terbit" },
    { v: db.submissions.length, l: "Naskah masuk" },
    { v: openEvents.length, l: "Periode dibuka" },
    { v: activeCats.length, l: "Jenis naskah" },
  ];

  return (
    <>
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="bg-dots absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_60%_30%,black_20%,transparent_70%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:pt-14 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="lg:col-span-7">
            <div
              className="rise inline-flex items-center gap-2 rounded-full border border-gold-300 bg-gold-50 py-1.5 pl-2 pr-4 text-xs font-bold text-forest-900"
              style={{ animationDelay: "0ms" }}
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-gold-400 text-forest-950">
                <Sparkles className="size-3.5" />
              </span>
              {openEvents.length > 0
                ? `${openEvents.length} periode penerimaan sedang dibuka`
                : "Repositori karya ilmiah UKM SIMPEL"}
            </div>

            <h1
              className="rise mt-5 text-[2.5rem] font-semibold leading-[1.06] tracking-tight text-forest-950 sm:text-6xl lg:text-[4rem]"
              style={{ animationDelay: "90ms" }}
            >
              Tulisanmu layak{" "}
              <span className="relative inline-block whitespace-nowrap italic text-forest-700">
                dibaca
                <svg
                  aria-hidden
                  viewBox="0 0 220 16"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-3 w-full overflow-visible"
                >
                  <path
                    d="M3 11 C 30 2, 52 15, 80 7 S 135 3, 160 10 S 200 5, 217 8"
                    pathLength="1"
                    fill="none"
                    stroke="#cfa92c"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="draw-line"
                  />
                </svg>
              </span>{" "}
              lebih banyak orang.
            </h1>

            <p
              className="rise mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
              style={{ animationDelay: "180ms" }}
            >
              Unggah essay, makalah, atau artikel jurnalmu. Redaksi UKM SIMPEL membantu menelaahnya dengan adil, lalu
              menerbitkannya di repositori Universitas Pancasakti Tegal.
            </p>

            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "270ms" }}>
              <Link href="/dashboard/submit" className="btn btn-primary btn-lg">
                <FileUp className="size-4" /> Unggah Naskah
              </Link>
              <Link href="#katalog" className="btn btn-outline btn-lg">
                <BookOpen className="size-4" /> Baca Karya Terbit
              </Link>
            </div>

            <dl
              className="rise mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4"
              style={{ animationDelay: "360ms" }}
            >
              {stats.map((s) => (
                <div key={s.l} className="rounded-2xl border border-line bg-sheet/90 px-4 py-3 shadow-soft">
                  <dd className="font-display text-3xl font-semibold text-forest-900">{s.v}</dd>
                  <dt className="mt-0.5 text-[11px] font-semibold text-muted">{s.l}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Panggung maskot */}
          <div className="rise lg:col-span-5" style={{ animationDelay: "220ms" }}>
            <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[440px]">
              <div
                aria-hidden
                className="absolute inset-[6%] rounded-full bg-gradient-to-b from-gold-100 via-forest-50 to-transparent"
              />
              <div
                aria-hidden
                className="spin-slow absolute inset-[1%] rounded-full border-2 border-dashed border-gold-400/50"
              />

              {[
                { Icon: BookOpen, pos: "left-[2%] top-[14%]", d: "0s", c: "text-forest-700" },
                { Icon: Lightbulb, pos: "right-[0%] top-[8%]", d: "-1.5s", c: "text-gold-600" },
                { Icon: Feather, pos: "left-[0%] bottom-[22%]", d: "-3s", c: "text-olive-600" },
                { Icon: GraduationCap, pos: "right-[2%] bottom-[16%]", d: "-4.5s", c: "text-forest-800" },
              ].map(({ Icon, pos, d, c }, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={`chip-float absolute z-10 flex size-11 items-center justify-center rounded-2xl border border-line bg-white shadow-lift sm:size-12 ${pos} ${c}`}
                  style={{ animationDelay: d }}
                >
                  <Icon className="size-5" />
                </span>
              ))}

              <BookMascot className="relative pt-4" />
            </div>

            {/* Perjalanan naskah */}
            <div className="mx-auto mt-5 max-w-[420px] rounded-2xl border border-line bg-sheet/90 p-4 shadow-soft">
              <p className="mb-3 text-center font-mono text-[10.5px] font-bold uppercase tracking-widest text-muted">
                Perjalanan naskahmu
              </p>
              <div className="relative flex items-start justify-between px-1">
                <div className="absolute left-7 right-7 top-[22px]">
                  <div className="h-0.5 bg-[repeating-linear-gradient(90deg,var(--color-line-strong)_0_6px,transparent_6px_12px)]" />
                  <span className="journey-dot absolute -top-[5px] size-3 rounded-full bg-gold-400 shadow-[0_0_0_5px_rgb(207_169_44/0.25)]" />
                </div>
                {[
                  { Icon: FileUp, l: "Unggah" },
                  { Icon: ShieldCheck, l: "Ditelaah" },
                  { Icon: Award, l: "Terbit" },
                ].map(({ Icon, l }) => (
                  <div key={l} className="relative z-10 flex w-16 flex-col items-center gap-1.5">
                    <span className="flex size-11 items-center justify-center rounded-2xl border border-forest-200 bg-forest-50 text-forest-800">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-forest-900">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== PITA JENIS NASKAH ============================== */}
      {activeCats.length > 0 && (
        <div className="marquee overflow-hidden border-y border-forest-800 bg-forest-950 py-3.5 text-forest-100">
          <div className="marquee-track gap-10 whitespace-nowrap text-sm font-semibold">
            {[0, 1].flatMap((k) =>
              activeCats.map((c) => (
                <span key={`${k}-${c.id}`} className="flex items-center gap-10">
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="size-4 text-gold-300" /> {c.nama}
                  </span>
                  <span className="text-gold-400">✦</span>
                </span>
              )),
            )}
          </div>
        </div>
      )}

      {/* ============================== KATALOG ============================== */}
      <section id="katalog" className="scroll-mt-24 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Katalog terbitan</p>
              <h2 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-5xl">Karya yang sudah terbit</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                Naskah yang lolos desk evaluation dan telaah juri. Klik untuk membaca ringkasannya.
              </p>
            </div>
            <Link href="/dashboard/submit" className="btn btn-outline self-start md:self-auto">
              Ajukan naskahmu <ArrowRight className="size-4" />
            </Link>
          </Reveal>

          {published.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {published.map((item, index) => {
                const author = db.users.find((u) => u.id === item.user_id);
                const ev = db.events.find((e) => e.id === item.event_id);
                return (
                  <Reveal key={item.id} delay={(index % 2) * 90}>
                    <Link
                      href={`/katalog/${item.id}`}
                      className="group flex h-full overflow-hidden rounded-2xl border border-line bg-sheet shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-lift"
                    >
                      <div
                        aria-hidden
                        className={`relative w-3 shrink-0 ${SPINES[index % SPINES.length]} sm:w-4`}
                      >
                        <span className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-white/40" />
                      </div>
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-forest-700">
                            {catName(ev?.category_id ?? 0) ?? "Naskah"} · {ev?.volume}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        <h3 className="mt-3 text-xl font-semibold leading-snug text-forest-950 transition-colors group-hover:text-forest-700 sm:text-[1.35rem]">
                          {item.judul}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{item.abstrak}</p>
                        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                          <div className="min-w-0 text-xs">
                            <p className="truncate font-bold text-ink">{author?.nama}</p>
                            <p className="truncate text-muted">
                              {author?.institusi} · {formatShortDate(item.submitted_at)}
                            </p>
                          </div>
                          <div className="shrink-0 rounded-xl bg-forest-50 px-3 py-1.5 text-center ring-1 ring-inset ring-forest-200">
                            <p className="font-display text-xl font-semibold leading-none text-forest-900">
                              {item.skor_akhir ?? "—"}
                            </p>
                            <p className="mt-0.5 font-mono text-[9px] uppercase text-muted">skor</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <Reveal className="mt-10 rounded-3xl border border-dashed border-line-strong bg-sheet p-8 text-center sm:p-12">
              <div className="mx-auto max-w-[240px]">
                <BookMascot showBubble={false} />
              </div>
              <p className="mt-2 text-lg font-semibold text-forest-950">Belum ada karya yang terbit</p>
              <p className="mt-1 text-sm text-muted">Jadilah penulis pertama yang diterbitkan di sini!</p>
              <Link href="/dashboard/submit" className="btn btn-primary mt-5">
                <FileUp className="size-4" /> Unggah naskah
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      {/* ============================== PERIODE ============================== */}
      <section className="border-y border-line bg-sheet/70 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Periode penerimaan</p>
              <h2 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-5xl">Mau kirim ke mana?</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                Pilih periode yang sesuai dengan jenis naskah dan tema tulisanmu.
              </p>
            </div>
            <Link href="/events" className="btn btn-outline self-start md:self-auto">
              Semua periode ({db.events.length}) <ArrowRight className="size-4" />
            </Link>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {openEvents.map((e, i) => (
              <Reveal key={e.id} delay={i * 80}>
                <EventCard event={e} categoryName={catName(e.category_id)} />
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {activeCats.map((c, i) => (
              <Reveal key={c.id} delay={i * 60}>
                <div className="h-full rounded-2xl border border-line bg-paper/70 p-4 transition-colors hover:border-forest-400 hover:bg-forest-50/60">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-forest-100 text-forest-800">
                    <BookOpen className="size-4" />
                  </span>
                  <h3 className="mt-3 font-sans text-sm font-bold text-forest-950">{c.nama}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{c.deskripsi}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CARA KERJA ============================== */}
      <section id="alur" className="scroll-mt-24 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow justify-center">Cara kerja</p>
            <h2 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-5xl">Tujuh langkah sampai terbit</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Semuanya dibuat sederhana. Kamu fokus menulis, sistem dan redaksi yang mengurus sisanya.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {authorSteps.map((s, i) => (
              <Reveal key={s.title} delay={(i % 4) * 80}>
                <div className="group relative h-full rounded-2xl border border-line bg-sheet p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-forest-400 hover:shadow-lift">
                  <span className="absolute right-4 top-3 font-display text-5xl font-semibold text-forest-100 transition-colors group-hover:text-gold-200">
                    {i + 1}
                  </span>
                  <span className="relative flex size-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-300 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <s.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-sans text-base font-bold text-forest-950">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.desc}</p>
                  {s.badge && (
                    <span className="mt-3 inline-block rounded-full bg-gold-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-gold-700">
                      {s.badge}
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
            <Reveal delay={240}>
              <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-forest-800 to-forest-950 p-5 text-white shadow-pop">
                <div>
                  <Sparkles className="size-6 text-gold-300" />
                  <h3 className="mt-3 font-display text-2xl font-semibold leading-snug">Siap mulai menulis?</h3>
                  <p className="mt-1.5 text-sm text-forest-100/80">Siapkan PDF naskah dan surat orisinalitasmu.</p>
                </div>
                <Link href="/dashboard/submit" className="btn btn-gold mt-5 w-full">
                  Mulai unggah <ArrowRight className="size-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Di balik layar */}
          <div className="mt-20 grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <p className="eyebrow">Di balik layar</p>
              <h3 className="mt-2 text-2xl font-semibold text-forest-950 sm:text-4xl">Bagaimana redaksi menilai</h3>
              <ol className="relative mt-8 space-y-6 border-l-2 border-dashed border-line-strong pl-8">
                {editorialFlow.map((ef, i) => (
                  <li key={ef.title} className="relative">
                    <span className="absolute -left-[2.85rem] flex size-8 items-center justify-center rounded-full border-2 border-forest-700 bg-sheet font-mono text-xs font-bold text-forest-800">
                      {i + 1}
                    </span>
                    <h4 className="font-sans text-base font-bold text-forest-950">{ef.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{ef.detail}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal className="lg:col-span-5" delay={120}>
              <div className="rounded-3xl border border-line bg-sheet p-6 shadow-soft sm:p-7">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <h3 className="font-sans text-base font-bold text-forest-950">Rubrik penilaian</h3>
                  <span className="rounded-full bg-forest-50 px-3 py-1 font-mono text-xs font-bold text-forest-800 ring-1 ring-inset ring-forest-200">
                    100%
                  </span>
                </div>
                <div className="mt-5 space-y-5">
                  {sampleCriteria.map((c, i) => (
                    <div key={c.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-ink">{c.nama}</span>
                        <span className="font-mono font-bold text-forest-800">{c.bobot}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-paper-dark">
                        <div
                          className={`bar-grow h-full rounded-full ${i % 2 ? "bg-gold-400" : "bg-forest-600"}`}
                          style={{ width: `${Math.min(100, c.bobot * 3.3)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 rounded-xl bg-paper p-3.5 font-mono text-xs leading-relaxed text-muted">
                  Skor akhir = rata-rata nilai tertimbang dari seluruh juri.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================== FAQ ============================== */}
      <section id="panduan" className="scroll-mt-24 border-t border-line bg-sheet/70 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">Panduan & FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-4xl">Ada yang masih bingung?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Cek daftar singkat ini sebelum mengunggah supaya naskahmu langsung lolos validasi.
            </p>
            <ul className="mt-6 space-y-3 rounded-2xl border border-line bg-paper/70 p-5 text-sm text-ink/85">
              {[
                "PDF, maksimal 5 MB untuk naskah utama",
                "Nama file: NamaKetua_JudulSingkat.pdf",
                "Sertakan surat pernyataan orisinalitas",
                "Abstrak 30–300 kata, 3–6 kata kunci",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
                    <Check className="size-3" />
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="space-y-3 lg:col-span-7">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details
                  className="group rounded-2xl border border-line bg-sheet shadow-soft transition-colors open:border-forest-400 [&_summary::-webkit-details-marker]:hidden"
                  open={i === 0}
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[15px] font-bold text-forest-950 sm:px-6 sm:py-5">
                    {f.q}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-800 transition-transform duration-300 group-open:rotate-45 group-open:bg-forest-800 group-open:text-white">
                      <Plus className="size-4" />
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Reveal>
          <div className="relative mx-auto grid max-w-7xl items-center gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-6 py-10 text-white shadow-pop sm:px-12 sm:py-14 md:grid-cols-2">
            <div aria-hidden className="bg-grid-light absolute inset-0 opacity-70" />
            <div aria-hidden className="absolute -right-10 -top-16 size-72 rounded-full bg-gold-400/25 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-medium leading-tight sm:text-5xl">
                Satu ide bagus, <em className="text-gradient-gold">satu karya</em> yang terbit.
              </h2>
              <p className="mt-4 max-w-md text-forest-100/80">
                Daftar dalam semenit, lalu unggah naskahmu. Kami tunggu tulisanmu!
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="btn btn-gold btn-lg">
                  Buat akun gratis <ArrowUpRight className="size-4" />
                </Link>
                <Link href="/login" className="btn btn-ghost-light btn-lg">
                  Sudah punya akun
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[300px] md:max-w-[340px]">
              <BookMascot showBubble={false} />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
