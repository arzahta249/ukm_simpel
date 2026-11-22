import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookMarked, CalendarDays, Check, FileText, Users } from "lucide-react";
import { EventStatusBadge, StatusBadge } from "@/components/ui";
import { readDb } from "@/lib/db";
import { daysLeft, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ketentuan = [
  "Penulis adalah mahasiswa aktif yang terdaftar pada perguruan tinggi.",
  "Naskah merupakan karya asli, belum pernah diterbitkan di jurnal/repositori lain, dan bebas plagiarisme.",
  "Naskah ditulis dalam Bahasa Indonesia ilmiah sesuai pedoman tata tulis SIMPEL (A4, spasi 1,15–1,5).",
  "Berkas utama wajib berformat PDF (maksimal 5 MB) dengan penamaan NamaKetua_JudulSingkat.pdf.",
  "Wajib melampirkan Surat Pernyataan Orisinalitas yang telah ditandatangani penulis utama.",
];

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const db = await readDb();
  const event = db.events.find((e) => e.id === Number(id));
  if (!event) notFound();

  const cat = db.categories.find((c) => c.id === event.category_id);
  const crit = db.criteria.filter((c) => c.event_id === event.id);
  const left = daysLeft(event.deadline);
  const relatedPapers = db.submissions.filter(
    (s) => s.event_id === event.id && (s.status === "lolos" || s.status === "juara"),
  );

  const stages = [
    { t: "Batas akhir unggah naskah", d: formatDate(event.deadline) },
    { t: "Pemeriksaan kelengkapan & Desk Evaluation", d: "3–5 hari kerja setelah naskah masuk" },
    { t: "Telaah substansi oleh minimal 2 reviewer/juri", d: "7–14 hari kerja" },
    { t: "Rekap nilai akhir & publikasi ke repositori", d: "Diumumkan pada dashboard & katalog" },
  ];

  return (
    <>
      <section className="border-b border-line-strong bg-sheet py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted hover:text-forest-800"
          >
            <ArrowLeft className="size-3.5" /> Kembali ke daftar periode
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs font-semibold text-forest-800">
              {event.volume} · {cat?.nama}
            </span>
            <EventStatusBadge status={event.status} />
          </div>

          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-forest-950 sm:text-4xl lg:text-5xl">
            {event.nama}
          </h1>

          <p className="mt-3 max-w-3xl text-base text-muted">
            Cakupan Tema: <strong className="font-medium text-ink">&ldquo;{event.tema}&rdquo;</strong>
          </p>

          <div className="mt-8 grid max-w-3xl grid-cols-2 border border-line-strong bg-paper sm:grid-cols-4">
            {[
              { i: CalendarDays, l: "Tenggat Unggah", v: formatDate(event.deadline, { day: "numeric", month: "short", year: "numeric" }) },
              { i: FileText, l: "Batas Halaman", v: `Maks. ${event.max_halaman} hlm` },
              { i: Users, l: "Penulis / Tim", v: `Maks. ${event.max_anggota} orang` },
              { i: BookMarked, l: "Edisi Terbitan", v: event.volume },
            ].map(({ i: Icon, l, v }, idx) => (
              <div key={l} className={`p-4 ${idx > 0 ? "border-l border-line" : ""}`}>
                <Icon className="size-4 text-forest-700" />
                <p className="mt-2 font-mono text-[10.5px] uppercase tracking-wider text-muted">{l}</p>
                <p className="mt-0.5 text-sm font-semibold text-forest-950">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-6 lg:col-span-2">
          <article className="card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-forest-950">Deskripsi Periode Terbitan</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{event.deskripsi}</p>
          </article>

          <article className="card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-forest-950">Persyaratan &amp; Format Naskah</h2>
            <ul className="mt-4 space-y-3">
              {ketentuan.map((k) => (
                <li key={k} className="flex gap-3 text-sm leading-relaxed text-ink/85">
                  <Check className="mt-0.5 size-4 shrink-0 text-forest-700" /> {k}
                </li>
              ))}
            </ul>
          </article>

          <article className="card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-forest-950">Kriteria Evaluasi Naskah</h2>
              <span className="font-mono text-xs font-semibold text-forest-800">Total Bobot 100%</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {crit.map((c) => (
                <div key={c.id} className="rounded-md border border-line bg-paper p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{c.nama}</p>
                    <span className="font-mono text-lg font-bold text-forest-800">{c.bobot}%</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sheet">
                    <div className="h-full bg-forest-700" style={{ width: `${c.bobot * 3.33}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          {relatedPapers.length > 0 && (
            <article className="card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-forest-950">
                Naskah yang Diterbitkan pada Edisi Ini ({relatedPapers.length})
              </h2>
              <div className="mt-4 divide-y divide-line">
                {relatedPapers.map((p) => {
                  const u = db.users.find((x) => x.id === p.user_id);
                  return (
                    <div key={p.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusBadge status={p.status} />
                        <span className="font-mono text-xs text-muted">Skor: {p.skor_akhir}</span>
                      </div>
                      <Link
                        href={`/katalog/${p.id}`}
                        className="mt-2 block text-base font-semibold text-forest-950 hover:text-forest-700"
                      >
                        {p.judul}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        {u?.nama} · {u?.institusi}
                      </p>
                    </div>
                  );
                })}
              </div>
            </article>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-line bg-forest-950 p-6 text-white">
              <p className="font-mono text-[11px] uppercase tracking-wider text-gold-300">Status Penerimaan</p>
              <p className="mt-1 font-display text-3xl font-semibold">
                {event.status === "open" ? (left > 0 ? `${left} Hari Tersisa` : "Ditutup") : "Telah Terbit"}
              </p>
              <p className="mt-1 font-mono text-xs text-forest-200/80">
                Tenggat: {formatDate(event.deadline)}
              </p>
            </div>
            <div className="space-y-3 p-6">
              {event.status === "open" ? (
                <>
                  <Link href={`/dashboard/submit?event=${event.id}`} className="btn btn-primary btn-lg w-full">
                    Unggah Naskah ke Periode Ini <ArrowRight className="size-4" />
                  </Link>
                  <p className="text-center text-xs text-muted">
                    Belum memiliki akun penulis?{" "}
                    <Link href="/register" className="font-semibold text-forest-800 hover:underline">
                      Registrasi
                    </Link>
                  </p>
                </>
              ) : (
                <p className="rounded-md bg-paper p-3.5 text-center text-xs text-muted">
                  Periode pengumpulan naskah untuk edisi ini telah selesai.
                </p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-forest-800">
              Tahapan Kurasi Naskah
            </h3>
            <ol className="mt-4 space-y-4">
              {stages.map((t, i) => (
                <li key={t.t} className="flex gap-3">
                  <span className="font-mono text-xs font-bold text-forest-700">0{i + 1}.</span>
                  <div>
                    <p className="text-xs font-semibold text-ink">{t.t}</p>
                    <p className="mt-0.5 text-xs text-muted">{t.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>
    </>
  );
}
