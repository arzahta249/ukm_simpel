import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Globe, Hourglass, Lock, MessageSquareQuote, PenLine } from "lucide-react";
import { EssayContentView } from "@/components/essay-content-view";
import { Avatar, SectionCard, StatusBadge } from "@/components/ui";
import { STATUS_META } from "@/lib/data";
import { readDb } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { DeleteSubmissionButton } from "@/app/adminS/naskah/delete-submission-button";
import { RevisionUploadBox } from "./revision-upload";

export const dynamic = "force-dynamic";

export default async function KaryaDetailPage({ params }: PageProps<"/dashboard/karya/[id]">) {
  const { id } = await params;
  const db = await readDb();
  const s = db.submissions.find((x) => x.id === Number(id));
  if (!s) notFound();

  const ev = db.events.find((e) => e.id === s.event_id) ?? db.events[0];
  const logs = db.status_logs.filter((l) => l.submission_id === s.id);
  const fileList = db.submission_files.filter((f) => f.submission_id === s.id);
  const memberList = db.submission_members.filter((m) => m.submission_id === s.id);
  const crit = db.criteria.filter((c) => c.event_id === s.event_id);
  const assignIds = db.review_assignments.filter((a) => a.submission_id === s.id).map((a) => a.id);
  const subReviews = db.reviews.filter((r) => assignIds.includes(r.assignment_id));
  const author = db.users.find((u) => u.id === s.user_id);

  const announced = ["lolos", "juara", "revisi", "tidak_lolos"].includes(s.status);

  const fallbackLogs = logs.length
    ? logs
    : [{ id: 0, submission_id: s.id, status: s.status, catatan: "Status terkini naskah.", created_at: s.submitted_at }];

  return (
    <>
      <Link
        href="/dashboard/karya"
        className="mb-5 inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted hover:text-forest-800"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke daftar naskah
      </Link>

      <header className="card mb-6 overflow-hidden">
        {s.cover_image && (
          <img src={s.cover_image} alt={s.judul} className="h-56 w-full object-cover sm:h-64" />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status={s.status} />
              {s.topik && (
                <span className="rounded bg-forest-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-800 ring-1 ring-forest-200">
                  {s.topik}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded bg-paper px-2.5 py-0.5 font-mono text-xs text-muted">
                {s.visibilitas === "privat" ? <Lock className="size-3" /> : <Globe className="size-3" />}
                {s.visibilitas === "privat" ? "Privat" : "Publik"}
              </span>
              <span className="font-mono text-xs text-muted">SMPL-2026-0{s.id}</span>
            </div>
            <span className="font-mono text-xs font-semibold text-forest-800">{ev?.volume}</span>
          </div>

          <h1 className="mt-4 max-w-4xl text-2xl font-semibold leading-snug text-forest-950 sm:text-3xl">{s.judul}</h1>
          {s.subjudul && <p className="mt-1.5 text-base text-muted">{s.subjudul}</p>}
          <p className="mt-2 text-xs text-muted">
            Periode: <strong className="text-ink">{ev?.nama}</strong> · Tanggal {formatDate(s.submitted_at)}
            {s.prodi ? ` · ${s.prodi}` : ""}
          </p>

          {s.kata_kunci && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {s.kata_kunci.split(",").filter(Boolean).map((k) => (
                <span
                  key={k}
                  className="rounded border border-line bg-paper px-2.5 py-1 font-mono text-xs text-forest-900"
                >
                  #{k.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {s.status === "draft" && (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold-400 bg-gold-50 p-5">
              <div>
                <p className="text-sm font-bold text-forest-950">Naskah Ini Masih Berstatus Draft</p>
                <p className="mt-0.5 text-xs text-muted">
                  Anda dapat memperbarui dokumen atau isi naskah lalu mengajukan publikasi ke Editor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/submit?edit=${s.id}`} className="btn btn-primary">
                  <PenLine className="size-4" /> Edit Draft &amp; Ajukan
                </Link>
                <DeleteSubmissionButton submissionId={s.id} label="Hapus Draft" redirectTo="/dashboard/karya" />
              </div>
            </section>
          )}
          {s.status === "revisi" && <RevisionUploadBox submissionId={s.id} />}
          {announced && s.skor_akhir ? (
            <section className="border border-forest-800 bg-forest-950 p-6 text-white sm:p-8">
              <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex size-28 flex-col items-center justify-center rounded-md border border-gold-400/50 bg-forest-900">
                  <span className="font-display text-4xl font-semibold text-gold-300">{s.skor_akhir}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-forest-200">Skor Akhir</span>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-gold-300">Keputusan Editor</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    Status Naskah: {STATUS_META[s.status].label}
                  </p>
                  <div className="mt-4 space-y-2">
                    {crit.map((c, i) => {
                      const v = subReviews[0]?.scores?.[i]?.skor ?? Math.round(s.skor_akhir ?? 85);
                      return (
                        <div key={c.id} className="flex items-center gap-3 font-mono text-xs">
                          <span className="w-40 shrink-0 truncate text-forest-100/80 sm:w-52">{c.nama}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full bg-gold-400" style={{ width: `${v}%` }} />
                          </div>
                          <span className="w-8 text-right font-semibold">{v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="flex items-start gap-4 rounded-md border border-gold-300 bg-gold-50 p-5">
              <Hourglass className="mt-0.5 size-5 shrink-0 text-gold-700" />
              <div>
                <p className="text-sm font-bold text-forest-950">Naskah Sedang Dalam Proses Kurasi &amp; Telaah</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  Skor akhir dan catatan lengkap dari dewan reviewer akan ditampilkan setelah rekapitulasi nilai selesai.
                </p>
              </div>
            </section>
          )}

          {subReviews.length > 0 && (
            <SectionCard title="Catatan &amp; Komentar Reviewer" action={<MessageSquareQuote className="size-4 text-muted" />}>
              <div className="space-y-4 p-5 sm:p-6">
                {subReviews.map((r, i) => (
                  <blockquote key={r.id} className="border-l-2 border-forest-700 bg-paper p-4">
                    <p className="text-sm leading-relaxed text-ink/85">&ldquo;{r.komentar}&rdquo;</p>
                    <footer className="mt-2 font-mono text-xs font-semibold text-muted">
                      — Reviewer 0{i + 1} · Skor {r.total_skor} ({r.rekomendasi})
                    </footer>
                  </blockquote>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Deskripsi Singkat / Abstrak">
            <p className="p-5 text-sm leading-relaxed text-ink/85 sm:p-6">{s.abstrak}</p>
          </SectionCard>

          {s.isi_essay && (
            <SectionCard title="Struktur &amp; Isi Naskah">
              <div className="p-5 sm:p-6">
                <EssayContentView isiEssay={s.isi_essay} jenisRiset={s.jenis_riset} />
              </div>
            </SectionCard>
          )}

          <SectionCard title="Berkas Naskah Terunggah" description="Daftar file PDF naskah dan kelengkapan">
            <ul className="divide-y divide-line">
              {(fileList.length
                ? fileList
                : [
                    {
                      id: 0,
                      jenis_berkas: "Naskah Lengkap (PDF)",
                      file_path: `Naskah_SMPL_${s.id}.pdf`,
                      versi: 1,
                      size: "1.4 MB",
                      uploaded_at: s.submitted_at,
                    },
                  ]
              ).map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-forest-800">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{f.jenis_berkas}</p>
                      <p className="truncate font-mono text-xs text-muted">
                        {f.file_path.split("/").pop()} · {f.size} · versi {f.versi}
                      </p>
                    </div>
                  </div>
                  {f.file_path.startsWith("/uploads/") && (
                    <a href={f.file_path} download className="btn btn-outline btn-sm">
                      <Download className="size-3.5" /> Unduh PDF
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Log Riwayat Status (status_logs)">
            <ol className="p-5 sm:p-6">
              {[...fallbackLogs].reverse().map((l, i) => (
                <li key={l.id} className="relative flex gap-3.5 pb-6 last:pb-0">
                  {i < fallbackLogs.length - 1 && (
                    <span className="absolute left-[9px] top-6 h-[calc(100%-1.25rem)] w-px bg-line-strong" />
                  )}
                  <span
                    className={`relative mt-1 flex size-5 shrink-0 items-center justify-center rounded-full ${
                      i === 0 ? "bg-forest-700" : "bg-line-strong"
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-white" />
                  </span>
                  <div>
                    <StatusBadge status={l.status} className="!py-0.5" />
                    <p className="mt-1.5 text-xs leading-relaxed text-ink/85">{l.catatan}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted">{l.created_at}</p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard title="Susunan Penulis (submission_members)">
            <ul className="divide-y divide-line">
              {(memberList.length
                ? memberList
                : [
                    {
                      id: 0,
                      nama: author?.nama || "Penulis",
                      institusi: author?.institusi || "Universitas Pancasakti Tegal",
                      email: author?.email || "",
                      peran: "Ketua" as const,
                    },
                  ]
              ).map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <Avatar name={m.nama} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{m.nama}</p>
                    <p className="truncate font-mono text-[11px] text-muted">{m.email}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                      m.peran === "Ketua" ? "bg-gold-100 text-forest-950" : "bg-paper text-muted"
                    }`}
                  >
                    {m.peran}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
