import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Avatar, SectionCard, StatusBadge } from "@/components/ui";
import { readDb } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { DeskEvaluationActions } from "./desk-eval-actions";

export const dynamic = "force-dynamic";

export default async function AdminNaskahDetailPage({ params }: PageProps<"/adminS/naskah/[id]">) {
  const { id } = await params;
  const db = await readDb();
  const s = db.submissions.find((x) => x.id === Number(id));
  if (!s) notFound();

  const author = db.users.find((u) => u.id === s.user_id);
  const ev = db.events.find((e) => e.id === s.event_id) ?? db.events[0];
  const fileList = db.submission_files.filter((f) => f.submission_id === s.id);
  const memberList = db.submission_members.filter((m) => m.submission_id === s.id);
  const assigned = db.review_assignments.filter((a) => a.submission_id === s.id);
  const logs = db.status_logs.filter((l) => l.submission_id === s.id);
  const juries = db.users.filter((u) => u.role === "juri");

  return (
    <>
      <Link
        href="/adminS/naskah"
        className="mb-5 inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted hover:text-forest-800"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke daftar naskah masuk
      </Link>

      <header className="card mb-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={s.status} />
            <span className="font-mono text-xs font-semibold text-muted">SMPL-2026-0{s.id}</span>
          </div>
          <span className="font-mono text-xs text-forest-800">
            {ev?.volume} · Maks. {ev?.max_halaman} halaman
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-semibold leading-snug text-forest-950 sm:text-3xl">{s.judul}</h1>
        <p className="mt-2 text-xs text-muted">
          Pengirim: <strong className="text-ink">{author?.nama}</strong> ({author?.institusi} · NIM {author?.nim_nisn}) ·{" "}
          Diunggah {formatDate(s.submitted_at)}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DeskEvaluationActions submissionId={s.id} initialStatus={s.status} />

          <SectionCard title="Abstrak &amp; Kata Kunci">
            <div className="p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-ink/85">{s.abstrak}</p>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
                {s.kata_kunci.split(",").map((k) => (
                  <span
                    key={k}
                    className="rounded border border-line bg-paper px-2.5 py-0.5 font-mono text-xs text-forest-900"
                  >
                    #{k.trim()}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Pemeriksaan Kelengkapan Berkas (submission_files)"
            description="Pastikan naskah PDF dan surat orisinalitas telah sesuai format"
          >
            <ul className="divide-y divide-line">
              {(fileList.length
                ? fileList
                : [
                    {
                      id: 1,
                      jenis_berkas: "Naskah Lengkap (PDF)",
                      file_path: `${s.id}/Naskah_KTI_${s.id}.pdf`,
                      versi: 1,
                      size: "1.6 MB",
                      uploaded_at: s.submitted_at,
                    },
                    {
                      id: 2,
                      jenis_berkas: "Surat Pernyataan Orisinalitas",
                      file_path: `${s.id}/Surat_Orisinalitas_${s.id}.pdf`,
                      versi: 1,
                      size: "390 KB",
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
                        {f.file_path} · {f.size} · v{f.versi}
                      </p>
                    </div>
                  </div>
                  {f.file_path.startsWith("/uploads/") ? (
                    <a href={f.file_path} download className="btn btn-outline btn-sm">
                      <Download className="size-3.5" /> Unduh PDF
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-forest-800">✓ Berkas Terverifikasi</span>
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Reviewer / Juri Ditugaskan"
            description="Minimal 2 juri per naskah"
            action={
              <Link href="/adminS/penugasan" className="font-mono text-xs font-semibold text-forest-800 hover:underline">
                Kelola →
              </Link>
            }
          >
            <div className="p-5 sm:p-6">
              {assigned.length > 0 ? (
                <ul className="space-y-3">
                  {assigned.map((a) => {
                    const j = juries.find((x) => x.id === a.juri_id);
                    return (
                      <li key={a.id} className="flex items-center justify-between gap-2 rounded border border-line bg-paper p-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">{j?.nama}</p>
                          <p className="font-mono text-[10.5px] text-muted">Ditugaskan {a.assigned_at}</p>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                            a.status === "dinilai" ? "bg-forest-100 text-forest-800" : "bg-gold-100 text-gold-700"
                          }`}
                        >
                          {a.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted">Belum ada reviewer yang ditugaskan untuk naskah ini.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Susunan Penulis">
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
                    <p className="truncate font-mono text-[11px] text-muted">{m.institusi}</p>
                  </div>
                  <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-forest-900">
                    {m.peran}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Log Status (status_logs)">
            <ul className="divide-y divide-line text-xs">
              {(logs.length
                ? [...logs].reverse()
                : [{ id: 1, status: s.status, catatan: "Naskah diterima sistem.", created_at: s.submitted_at }]
              ).map((l) => (
                <li key={l.id} className="px-5 py-3.5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={l.status} className="!py-0.5" />
                    <span className="font-mono text-[10.5px] text-muted">{l.created_at}</span>
                  </div>
                  <p className="mt-1.5 text-muted">{l.catatan}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
