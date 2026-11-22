import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileCheck, ShieldAlert } from "lucide-react";
import { Avatar, PageHeader, StatusBadge } from "@/components/ui";
import { STATUS_META, type SubmissionStatus } from "@/lib/data";
import { readDb } from "@/lib/db";
import { formatShortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Naskah Masuk & Desk Evaluation" };
export const dynamic = "force-dynamic";

const FILTER_STATUSES: Array<{ key: "all" | SubmissionStatus; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "submitted", label: "Submitted" },
  { key: "desk_review", label: "Desk Evaluation" },
  { key: "review", label: "Ditinjau Juri" },
  { key: "revisi", label: "Perlu Revisi" },
  { key: "lolos", label: "Terbit (Lolos)" },
  { key: "juara", label: "Karya Terbaik" },
  { key: "tidak_lolos", label: "Ditolak" },
];

export default async function AdminNaskahPage({ searchParams }: PageProps<"/adminS/naskah">) {
  const { status } = await searchParams;
  const activeFilter = (status as SubmissionStatus | undefined) || "all";

  const db = await readDb();
  const needDeskEval = db.submissions.filter((s) => s.status === "submitted" || s.status === "desk_review");
  const filtered =
    activeFilter === "all" ? db.submissions : db.submissions.filter((s) => s.status === activeFilter);

  return (
    <>
      <PageHeader
        eyebrow="TAHAP 2 &amp; 3 ALUR ADMIN · SUBMISSIONS &amp; DESK EVALUATION"
        title="Naskah Masuk &amp; Desk Evaluation"
        description="Periksa kelengkapan berkas naskah yang masuk, verifikasi surat orisinalitas dan format penulisan, lalu tentukan kelolosan menuju tahap penugasan juri."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card flex items-start gap-3.5 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-gold-300 bg-gold-50 text-gold-700">
            <FileCheck className="size-4" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold uppercase text-forest-950">
              {needDeskEval.length} Naskah Menunggu Pemeriksaan Redaksi
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Klik rincian naskah untuk memeriksa berkas PDF &amp; surat orisinalitas.
            </p>
          </div>
        </div>
        <div className="card flex items-start gap-3.5 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-forest-800">
            <ShieldAlert className="size-4" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold uppercase text-forest-950">Aturan Desk Evaluation</p>
            <p className="mt-0.5 text-xs text-muted">
              Naskah lolos langsung dilanjutkan ke penugasan minimal 2 juri; naskah gagal otomatis mengirim notifikasi ke penulis.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTER_STATUSES.map((f) => {
          const isCurrent = activeFilter === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/adminS/naskah" : `/adminS/naskah?status=${f.key}`}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold ${
                isCurrent
                  ? "bg-forest-950 text-white"
                  : "border border-line-strong bg-sheet text-muted hover:border-forest-700"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Judul &amp; Periode</th>
                <th>Penulis Utama</th>
                <th>Berkas</th>
                <th>Juri</th>
                <th>Status</th>
                <th className="text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const u = db.users.find((x) => x.id === s.user_id);
                const ev = db.events.find((e) => e.id === s.event_id);
                const fCount = db.submission_files.filter((f) => f.submission_id === s.id).length || 2;
                const jCount = db.review_assignments.filter((a) => a.submission_id === s.id).length;
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs font-semibold text-forest-900">SMPL-{s.id}</td>
                    <td className="max-w-xs">
                      <Link
                        href={`/adminS/naskah/${s.id}`}
                        className="line-clamp-1 font-semibold text-ink hover:text-forest-700"
                      >
                        {s.judul}
                      </Link>
                      <p className="font-mono text-[11px] text-muted">
                        {ev?.volume} · {formatShortDate(s.submitted_at)}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={u?.nama || "Penulis"} size="sm" />
                        <div className="leading-tight">
                          <p className="text-xs font-semibold text-ink">{u?.nama}</p>
                          <p className="text-[11px] text-muted">{u?.institusi}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-muted">{fCount} PDF</td>
                    <td className="font-mono text-xs">
                      <span className={jCount >= 2 ? "font-bold text-forest-800" : "text-amber-800"}>
                        {jCount} / 2 juri
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="text-right">
                      <Link href={`/adminS/naskah/${s.id}`} className="btn btn-outline btn-sm">
                        Evaluasi <ArrowUpRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-line md:hidden">
          {filtered.map((s) => {
            const u = db.users.find((x) => x.id === s.user_id);
            const ev = db.events.find((e) => e.id === s.event_id);
            return (
              <div key={s.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-forest-800">SMPL-{s.id}</span>
                  <StatusBadge status={s.status} />
                </div>
                <Link
                  href={`/adminS/naskah/${s.id}`}
                  className="mt-2 block text-sm font-semibold text-forest-950"
                >
                  {s.judul}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {u?.nama} · {ev?.volume}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                  <span className="font-mono text-[11px] text-muted">{formatShortDate(s.submitted_at)}</span>
                  <Link href={`/adminS/naskah/${s.id}`} className="btn btn-outline btn-sm">
                    Desk Eval <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 font-mono text-xs text-muted">
        Menampilkan {filtered.length} dari {db.submissions.length} naskah ({STATUS_META.lolos.label}:{" "}
        {db.submissions.filter((s) => s.status === "lolos" || s.status === "juara").length}).
      </p>
    </>
  );
}
