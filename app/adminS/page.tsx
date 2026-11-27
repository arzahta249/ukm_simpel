import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarPlus,
  ClipboardCheck,
  FileClock,
  Gavel,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Avatar, EventStatusBadge, PageHeader, ProgressBar, SectionCard, StatCard, StatusBadge } from "@/components/ui";
import { formatEventPages } from "@/lib/data";
import { readDb } from "@/lib/db";
import { formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const db = await readDb();
  const count = (st: string[]) => db.submissions.filter((s) => st.includes(s.status)).length;
  const juries = db.users.filter((u) => u.role === "juri");

  const pipeline = [
    {
      step: "01",
      icon: FileClock,
      label: "Naskah Masuk",
      desc: "Admin cek kelengkapan",
      value: count(["submitted"]),
      href: "/adminS/naskah?status=submitted",
    },
    {
      step: "02",
      icon: ShieldCheck,
      label: "Desk Evaluation",
      desc: "Orisinalitas & format",
      value: count(["desk_review"]),
      href: "/adminS/naskah?status=desk_review",
    },
    {
      step: "03",
      icon: Gavel,
      label: "Penilaian Juri",
      desc: "Maks. 4 reviewer / naskah",
      value: count(["review"]),
      href: "/adminS/penugasan",
    },
    {
      step: "04",
      icon: ClipboardCheck,
      label: "Rekap Nilai",
      desc: "Hitung skor akhir",
      value: count(["revisi", "lolos", "juara"]),
      href: "/adminS/rekap",
    },
    {
      step: "05",
      icon: Megaphone,
      label: "Terbit & Pengumuman",
      desc: "Terbit, revisi, unggulan",
      value: count(["lolos", "juara"]),
      href: "/adminS/rekap",
    },
  ];

  const recent = [...db.submissions].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)).slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="PANEL EDITOR · /adminS"
        title="Ringkasan Kurasi &amp; Publikasi KTI"
        description="Kelola periode penerimaan naskah, lakukan desk evaluation, tugaskan hingga maksimal 4 reviewer/juri per naskah, dan terbitkan karya tulis ilmiah."
        actions={
          <>
            <Link href="/adminS/naskah" className="btn btn-outline">
              <BookOpenCheck className="size-4" /> Periksa Naskah Masuk
            </Link>
            <Link href="/adminS/events/baru" className="btn btn-primary">
              <CalendarPlus className="size-4" /> Buat Periode / Event
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Naskah"
          value={db.submissions.length}
          icon={<BookOpenCheck className="size-4" />}
          trend={`${count(["lolos", "juara"])} naskah telah diterbitkan`}
        />
        <StatCard
          label="Menunggu Desk Eval"
          value={count(["submitted", "desk_review"])}
          icon={<FileClock className="size-4" />}
          tone="gold"
          trend="Perlu verifikasi orisinalitas & format"
        />
        <StatCard
          label="Dewan Juri / Reviewer"
          value={juries.length}
          icon={<Gavel className="size-4" />}
          tone="forest"
          trend={`${db.review_assignments.filter((a) => a.status === "pending").length} penugasan sedang dinilai`}
        />
        <StatCard
          label="Penulis Terdaftar"
          value={db.users.filter((u) => u.role === "peserta").length}
          icon={<Users className="size-4" />}
          tone="neutral"
          trend="Akun penulis terverifikasi"
        />
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <h2 className="font-sans text-sm font-bold text-forest-950">Alur Kurasi &amp; Evaluasi Naskah</h2>
            <p className="text-xs text-muted">Klik tahapan untuk menindaklanjuti naskah pada tahap tersebut</p>
          </div>
          <Link href="/adminS/naskah" className="font-mono text-xs font-semibold text-forest-800 hover:underline">
            Buka Antrean Naskah →
          </Link>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {pipeline.map((p) => (
            <li key={p.label}>
              <Link
                href={p.href}
                className="group flex h-full flex-col justify-between rounded-xl border border-line bg-paper/60 p-4 transition-colors hover:border-forest-700 hover:bg-forest-50/40"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-forest-700">TAHAP {p.step}</span>
                  <span className="font-display text-2xl font-semibold text-forest-950">{p.value}</span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-ink group-hover:text-forest-800">{p.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{p.desc}</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Naskah Masuk Terbaru"
          className="xl:col-span-2"
          action={
            <Link href="/adminS/naskah" className="btn btn-outline btn-sm">
              Semua Naskah <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Penulis</th>
                  <th>Judul Karya Tulis</th>
                  <th>Status</th>
                  <th>Unggah</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => {
                  const u = db.users.find((x) => x.id === s.user_id);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u?.nama || "Penulis"} size="sm" />
                          <div className="leading-tight">
                            <p className="whitespace-nowrap font-semibold text-ink">{u?.nama}</p>
                            <p className="text-[11px] text-muted">{u?.institusi}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[260px]">
                        <Link href={`/adminS/naskah/${s.id}`} className="line-clamp-1 font-medium hover:text-forest-700">
                          {s.judul}
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs text-muted">
                        {formatShortDate(s.submitted_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Progres Penilaian Reviewer/Juri"
            action={
              <Link href="/adminS/penugasan" className="font-mono text-xs font-semibold text-forest-800 hover:underline">
                Penugasan →
              </Link>
            }
          >
            <ul className="space-y-4 p-5 sm:p-6">
              {juries.map((j) => {
                const mine = db.review_assignments.filter((a) => a.juri_id === j.id);
                const doneCount = mine.filter((a) => a.status === "dinilai").length;
                return (
                  <li key={j.id}>
                    <div className="flex items-center gap-3">
                      <Avatar name={j.nama} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">{j.nama}</p>
                        <p className="font-mono text-[11px] text-muted">
                          {doneCount} / {mine.length} naskah selesai dinilai
                        </p>
                      </div>
                    </div>
                    <ProgressBar
                      value={(doneCount / Math.max(1, mine.length)) * 100}
                      className="mt-2"
                      tone={doneCount === mine.length ? "forest" : "gold"}
                    />
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard
            title="Periode Terbitan (events)"
            action={
              <Link href="/adminS/events" className="font-mono text-xs font-semibold text-forest-800 hover:underline">
                Kelola →
              </Link>
            }
          >
            <ul className="divide-y divide-line">
              {db.events.map((e) => (
                <li key={e.id} className="px-5 py-3.5 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-forest-700">{e.volume}</span>
                      <p className="text-xs font-semibold leading-snug text-ink">{e.nama}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-forest-900">{e.peserta}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <EventStatusBadge status={e.status} className="!px-2 !py-0.5 !text-[10px]" />
                    <span className="font-mono text-[11px] text-muted">
                      {e.halaman_label ? formatEventPages(e, "hlm") : `Maks. ${e.max_halaman} hlm`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
