import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Check,
  Clock3,
  FileCheck2,
  FileStack,
  PenSquare,
  Send,
} from "lucide-react";
import { EventStatusBadge, SectionCard, StatCard, StatusBadge } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { daysLeft, formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PesertaDashboard() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/dashboard");

  const db = await readDb();
  const mine =
    session.role === "admin"
      ? db.submissions
      : db.submissions.filter((s) => s.user_id === session.id);

  const active = mine[0];
  const upcoming = db.events.filter((e) => e.status === "open").sort((a, b) => a.deadline.localeCompare(b.deadline));
  const myLogs = db.status_logs
    .filter((l) => mine.some((m) => m.id === l.submission_id))
    .slice(-4)
    .reverse();

  const progressSteps = ["Submitted", "Desk Evaluation", "Ditinjau Juri", "Keputusan Terbit"];
  const stepIndexMap: Record<string, number> = {
    draft: 0,
    submitted: 1,
    desk_review: 2,
    review: 3,
    revisi: 3,
    lolos: 4,
    juara: 4,
    tidak_lolos: 2,
  };
  const currentStep = active ? (stepIndexMap[active.status] ?? 1) : 0;

  return (
    <>
      <section className="mb-6 border border-line-strong bg-sheet p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">PORTAL PENULIS · {session.institusi || "UKM SIMPEL"}</p>
            <h1 className="mt-1.5 text-2xl font-semibold text-forest-950 sm:text-3xl">{session.nama}</h1>
            <p className="mt-1 text-sm text-muted">
              {session.nim_nisn && session.nim_nisn !== "-" ? `NIM ${session.nim_nisn} · ` : ""}
              Anda memiliki {mine.length} naskah tercatat pada sistem repositori SIMPEL.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/dashboard/submit" className="btn btn-primary">
              <Send className="size-4" /> Unggah Naskah Baru
            </Link>
            <Link href="/events" className="btn btn-outline">
              Lihat Periode Penerimaan
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Naskah" value={mine.length} icon={<FileStack className="size-4" />} />
        <StatCard
          label="Dalam Evaluasi"
          value={mine.filter((s) => ["submitted", "desk_review", "review"].includes(s.status)).length}
          icon={<Clock3 className="size-4" />}
          tone="gold"
        />
        <StatCard
          label="Draft / Revisi"
          value={mine.filter((s) => s.status === "draft" || s.status === "revisi").length}
          icon={<PenSquare className="size-4" />}
          tone="neutral"
        />
        <StatCard
          label="Telah Terbit"
          value={mine.filter((s) => s.status === "lolos" || s.status === "juara").length}
          icon={<FileCheck2 className="size-4" />}
          tone="forest"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Status Kurasi Naskah Terbaru"
          description="Pemantauan tahapan evaluasi naskah secara real-time"
          className="xl:col-span-2"
          action={
            active ? (
              <Link href={`/dashboard/karya/${active.id}`} className="btn btn-outline btn-sm">
                Rincian <ArrowUpRight className="size-3.5" />
              </Link>
            ) : undefined
          }
        >
          {active ? (
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={active.status} />
                <span className="font-mono text-xs text-muted">
                  · SMPL-2026-{active.id} · {db.events.find((e) => e.id === active.event_id)?.nama}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-snug text-forest-950 sm:text-xl">{active.judul}</h3>

              <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {progressSteps.map((s, i) => {
                  const done = i < currentStep;
                  const current = i === currentStep;
                  return (
                    <li
                      key={s}
                      className={`rounded-md border p-3 ${
                        done
                          ? "border-forest-300 bg-forest-50/70"
                          : current
                            ? "border-gold-400 bg-gold-50"
                            : "border-line bg-paper/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase text-muted">Tahap 0{i + 1}</span>
                        {done && <Check className="size-3.5 text-forest-700" />}
                      </div>
                      <p className={`mt-1 text-xs font-semibold ${current ? "text-forest-950" : "text-ink"}`}>{s}</p>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 grid gap-3 border border-line bg-paper p-4 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Tanggal Unggah</p>
                  <p className="mt-0.5 text-sm font-semibold">{formatShortDate(active.submitted_at)}</p>
                </div>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Penugasan Juri</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {db.review_assignments.filter((a) => a.submission_id === active.id).length} reviewer ditugaskan
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Skor Akhir</p>
                  <p className="mt-0.5 text-sm font-semibold">{active.skor_akhir ?? "Menunggu Rekap"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-forest-950">Anda belum mengunggah naskah</p>
              <p className="mt-1 text-xs text-muted">
                Pilih periode penerimaan yang sedang dibuka dan unggah karya tulis ilmiah pertama Anda.
              </p>
              <Link href="/dashboard/submit" className="btn btn-primary mt-4">
                <Send className="size-4" /> Unggah Naskah Sekarang
              </Link>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Log Aktivitas Naskah" action={<Bell className="size-4 text-muted" />}>
          {myLogs.length > 0 ? (
            <ul className="divide-y divide-line">
              {myLogs.map((n) => (
                <li key={n.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={n.status} className="!py-0.5" />
                    <span className="font-mono text-[10.5px] text-muted">{n.created_at}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{n.catatan}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-xs text-muted">Belum ada aktivitas status naskah.</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Daftar Naskah Saya"
          className="xl:col-span-2"
          action={
            <Link href="/dashboard/karya" className="font-mono text-xs font-semibold text-forest-800 hover:underline">
              Lihat Semua →
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Judul Naskah</th>
                  <th>Periode</th>
                  <th>Status</th>
                  <th>Skor</th>
                </tr>
              </thead>
              <tbody>
                {mine.length > 0 ? (
                  mine.map((s) => (
                    <tr key={s.id}>
                      <td className="max-w-xs">
                        <Link
                          href={`/dashboard/karya/${s.id}`}
                          className="line-clamp-1 font-semibold text-ink hover:text-forest-700"
                        >
                          {s.judul}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs text-muted">
                        {db.events.find((e) => e.id === s.event_id)?.volume}
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="font-mono text-sm font-bold text-forest-900">{s.skor_akhir ?? "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-muted">
                      Belum ada naskah yang diunggah.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Periode Penerimaan Dibuka" action={<CalendarClock className="size-4 text-muted" />}>
          <ul className="divide-y divide-line">
            {upcoming.map((e) => {
              const left = daysLeft(e.deadline);
              return (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-paper sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] font-semibold text-forest-700">{e.volume}</p>
                      <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-ink group-hover:text-forest-800">
                        {e.nama}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <EventStatusBadge status={e.status} className="!px-2 !py-0.5 !text-[10px]" />
                        <span className="font-mono text-[11px] text-muted">{left} hari tersisa</span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
