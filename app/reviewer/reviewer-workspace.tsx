"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  Loader2,
  Lock,
  Search,
  Users,
  X,
} from "lucide-react";
import { EssayContentView } from "@/components/essay-content-view";
import { Avatar, SectionCard, StatusBadge } from "@/components/ui";
import type { Criteria, Member, Review, Submission, SubmissionFile } from "@/lib/data";
import { submitReviewAction } from "@/app/actions";
import { formatShortDate } from "@/lib/utils";

type AssignedSub = Submission & {
  authorName: string;
  authorInstitusi: string;
  eventName: string;
  volume: string;
  maxHalaman: number;
  categoryName: string;
  assignmentStatus: "pending" | "dinilai";
  assignedAt: string;
  totalReviewers: number;
  completedReviewers: number;
  existingReview: Review | null;
  files: SubmissionFile[];
  members: Member[];
  criteria: Criteria[];
};

function getPredikat(score: number) {
  if (score >= 85) return { label: "Sangat Baik", cls: "bg-forest-100 text-forest-800 ring-forest-300" };
  if (score >= 75) return { label: "Baik", cls: "bg-sky-50 text-sky-800 ring-sky-200" };
  if (score >= 60) return { label: "Cukup", cls: "bg-amber-50 text-amber-900 ring-amber-200" };
  return { label: "Kurang", cls: "bg-red-50 text-red-800 ring-red-200" };
}

export function ReviewerWorkspace({
  juriId,
  submissions,
}: {
  juriId: string;
  submissions: AssignedSub[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "dinilai">("all");
  const [query, setQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState<{ title: string; url: string } | null>(null);

  const filteredList = submissions.filter((s) => {
    const matchTab = filter === "all" || s.assignmentStatus === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      s.judul.toLowerCase().includes(q) ||
      s.categoryName.toLowerCase().includes(q) ||
      s.authorName.toLowerCase().includes(q) ||
      `smpl-${s.id}`.includes(q);
    return matchTab && matchQuery;
  });

  const [selectedId, setSelectedId] = useState<number>(submissions[0]?.id ?? 0);
  const sub = filteredList.find((s) => s.id === selectedId) ?? filteredList[0] ?? submissions[0];

  const [scores, setScores] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    sub?.criteria.forEach((c, idx) => {
      const existing = sub.existingReview?.scores.find((s) => s.criteria_id === c.id)?.skor;
      init[idx] = existing ?? 85;
    });
    return init;
  });
  const [komentar, setKomentar] = useState(
    sub?.existingReview?.komentar ||
      "Substansi kajian relevan dengan tema dan didukung analisis yang runtut. Layak dipertimbangkan untuk publikasi.",
  );
  const [rekomendasi, setRekomendasi] = useState<"Lolos" | "Revisi" | "Tidak Lolos">(
    sub?.existingReview?.rekomendasi || "Lolos",
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!sub) {
    return (
      <div className="card p-10 text-center">
        <p className="text-base font-semibold text-forest-950">Belum ada naskah yang ditugaskan kepada Anda</p>
        <p className="mt-1 text-xs text-muted">
          Editor akan menugaskan naskah yang telah lolos Desk Evaluation melalui menu Tugaskan Reviewer/Juri.
        </p>
      </div>
    );
  }

  function selectSubmission(item: AssignedSub) {
    setSelectedId(item.id);
    setSaved(false);
    const nextScores: Record<number, number> = {};
    item.criteria.forEach((c, idx) => {
      const existing = item.existingReview?.scores.find((s) => s.criteria_id === c.id)?.skor;
      nextScores[idx] = existing ?? 85;
    });
    setScores(nextScores);
    setKomentar(
      item.existingReview?.komentar ||
        "Substansi kajian relevan dengan tema dan didukung analisis yang runtut. Layak dipertimbangkan untuk publikasi.",
    );
    setRekomendasi(item.existingReview?.rekomendasi || "Lolos");
  }

  const isLocked = ["lolos", "juara", "tidak_lolos"].includes(sub.status);
  const weightedTotal = sub.criteria.reduce((acc, c, idx) => {
    const val = scores[idx] ?? 85;
    return acc + (val * c.bobot) / 100;
  }, 0);
  const predikat = getPredikat(weightedTotal);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true);
    setSaved(false);
    await submitReviewAction({
      submission_id: sub.id,
      juri_id: juriId,
      scores: sub.criteria.map((c, idx) => ({ criteria_id: c.id, skor: scores[idx] ?? 85 })),
      total_skor: weightedTotal,
      komentar,
      rekomendasi,
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Kiri: Pencarian, Filter & Antrean Tugas */}
        <div className="space-y-4 xl:col-span-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul, penulis, jenis, atau kode SMPL…"
              className="input !pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "all" as const, label: `Semua (${submissions.length})` },
              {
                key: "pending" as const,
                label: `Menunggu (${submissions.filter((s) => s.assignmentStatus === "pending").length})`,
              },
              {
                key: "dinilai" as const,
                label: `Sudah Dinilai (${submissions.filter((s) => s.assignmentStatus === "dinilai").length})`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilter(tab.key);
                  const nextList =
                    tab.key === "all" ? submissions : submissions.filter((s) => s.assignmentStatus === tab.key);
                  if (nextList[0]) selectSubmission(nextList[0]);
                }}
                className={`rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  filter === tab.key
                    ? "bg-forest-950 text-white"
                    : "border border-line-strong bg-sheet text-muted hover:border-forest-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <SectionCard
            title="Antrean Naskah Tugas Anda"
            description="Klik naskah untuk membaca berkas & mengisi penilaian"
          >
            {filteredList.length > 0 ? (
              <ul className="divide-y divide-line">
                {filteredList.map((item) => {
                  const active = item.id === sub.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectSubmission(item)}
                        className={`w-full p-4 text-left transition-colors ${
                          active ? "border-l-4 border-forest-700 bg-forest-50/90" : "hover:bg-paper"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-forest-800">
                            SMPL-{item.id} · {item.categoryName}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                              item.assignmentStatus === "dinilai"
                                ? "bg-forest-100 text-forest-800"
                                : "bg-gold-100 text-gold-700"
                            }`}
                          >
                            {item.assignmentStatus === "dinilai" ? "✓ Selesai" : "Menunggu"}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-forest-950">{item.judul}</p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                          <span>{item.authorName}</span>
                          <span className="font-mono text-[11px]">
                            {item.completedReviewers}/{item.totalReviewers} reviewer selesai
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-6 text-center text-xs text-muted">Tidak ada naskah yang sesuai pencarian/filter.</p>
            )}
          </SectionCard>
        </div>

        {/* Kanan: Pembaca Naskah & Rubrik Penilaian */}
        <div className="space-y-6 xl:col-span-7">
          <SectionCard
            title={`Naskah · SMPL-${sub.id}`}
            description={`${sub.eventName} (${sub.volume} · Maks. ${sub.maxHalaman} hlm)`}
            action={<StatusBadge status={sub.status} />}
          >
            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-forest-50 px-2.5 py-1 font-mono text-xs font-bold text-forest-800 ring-1 ring-forest-200">
                    Jenis: {sub.categoryName}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-paper px-2.5 py-1 font-mono text-xs text-muted ring-1 ring-line">
                    <Users className="size-3.5 text-forest-700" />
                    Progres Tim Reviewer: {sub.completedReviewers}/{sub.totalReviewers} selesai
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold leading-snug text-forest-950 sm:text-xl">{sub.judul}</h2>
                {sub.subjudul && <p className="mt-1 text-xs font-medium text-muted">{sub.subjudul}</p>}
                <p className="mt-1 text-xs text-muted">
                  Penulis Utama: <strong className="text-ink">{sub.authorName}</strong> ({sub.authorInstitusi}
                  {sub.prodi ? ` · ${sub.prodi}` : ""}) · Ditugaskan {formatShortDate(sub.assignedAt)}
                </p>
              </div>

              {sub.cover_image && (
                <img src={sub.cover_image} alt={sub.judul} className="h-44 w-full rounded-xl border border-line object-cover" />
              )}

              <div className="rounded-xl border border-line bg-paper p-4">
                <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-muted">
                  Deskripsi Singkat / Abstrak {sub.topik ? `· ${sub.topik}` : ""}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{sub.abstrak}</p>
                {sub.kata_kunci && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                    {sub.kata_kunci.split(",").filter(Boolean).map((k) => (
                      <span
                        key={k}
                        className="rounded border border-line bg-sheet px-2 py-0.5 font-mono text-[11px] text-forest-900"
                      >
                        #{k.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {sub.isi_essay && (
                <div className="rounded-xl border border-line bg-sheet p-4 sm:p-5">
                  <p className="mb-3 font-mono text-[10.5px] font-bold uppercase tracking-wider text-forest-800">
                    Struktur &amp; Isi Naskah
                  </p>
                  <EssayContentView isiEssay={sub.isi_essay} jenisRiset={sub.jenis_riset} />
                </div>
              )}

              {/* Tim Penulis */}
              {sub.members.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10.5px] font-bold uppercase tracking-wider text-muted">
                    Susunan Penulis ({sub.members.length})
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sub.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-sheet p-2.5">
                        <Avatar name={m.nama} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-ink">{m.nama}</p>
                          <p className="truncate text-[11px] text-muted">{m.institusi}</p>
                        </div>
                        <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-forest-900">
                          {m.peran}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Berkas Naskah */}
              <div>
                <p className="mb-2 font-mono text-[10.5px] font-bold uppercase tracking-wider text-muted">
                  Berkas Dokumen untuk Ditelaah
                </p>
                <ul className="divide-y divide-line rounded-xl border border-line bg-sheet">
                  {(sub.files.length
                    ? sub.files
                    : [
                        {
                          id: 1,
                          submission_id: sub.id,
                          jenis_berkas: `Naskah ${sub.categoryName} (PDF)`,
                          file_path: `${sub.id}/Naskah_${sub.id}.pdf`,
                          versi: 1,
                          uploaded_at: sub.submitted_at,
                          size: "1.6 MB",
                        },
                      ]
                  ).map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileText className="size-4 shrink-0 text-forest-700" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">{f.jenis_berkas}</p>
                          <p className="font-mono text-[11px] text-muted">
                            {f.size} · versi {f.versi} · {formatShortDate(f.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      {f.file_path.startsWith("/uploads/") ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewUrl({ title: f.jenis_berkas, url: f.file_path })}
                            className="btn btn-primary btn-sm"
                          >
                            <Eye className="size-3.5" /> Baca PDF
                          </button>
                          <a href={f.file_path} download className="btn btn-outline btn-sm">
                            <Download className="size-3.5" /> Unduh
                          </a>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-forest-800">✓ Terverifikasi Editor</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Lembar Penilaian Reviewer"
            description={
              isLocked
                ? "Penilaian telah dikunci karena Editor sudah menetapkan keputusan publikasi"
                : "Berikan skor 0–100 tiap kriteria, catatan telaah, dan rekomendasi"
            }
            action={
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold ring-1 ring-inset ${predikat.cls}`}>
                  {predikat.label}
                </span>
                <span className="rounded-lg bg-forest-950 px-3 py-1 font-mono text-xs font-bold text-gold-300">
                  {weightedTotal.toFixed(2)} / 100
                </span>
              </div>
            }
          >
            <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
              {isLocked && (
                <div className="flex items-center gap-2.5 rounded-xl border border-line-strong bg-paper p-3.5 text-xs font-semibold text-forest-900">
                  <Lock className="size-4 shrink-0 text-forest-700" />
                  Editor telah menetapkan status akhir naskah ini. Nilai dan komentar Anda tersimpan sebagai arsip.
                </div>
              )}

              <div className="space-y-3.5">
                {sub.criteria.map((c, idx) => {
                  const val = scores[idx] ?? 85;
                  const contrib = ((val * c.bobot) / 100).toFixed(1);
                  return (
                    <div key={c.id} className="rounded-xl border border-line bg-paper/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-ink">{c.nama}</p>
                          <p className="font-mono text-xs text-muted">
                            Bobot {c.bobot}% · Kontribusi: <strong className="text-forest-800">{contrib} poin</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={isLocked}
                            value={val}
                            onChange={(e) =>
                              setScores({ ...scores, [idx]: Math.min(100, Math.max(0, Number(e.target.value))) })
                            }
                            className="input !min-h-9 !w-20 !py-1 text-right font-mono font-bold"
                          />
                          <span className="font-mono text-xs text-muted">/ 100</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        disabled={isLocked}
                        value={val}
                        onChange={(e) => setScores({ ...scores, [idx]: Number(e.target.value) })}
                        className="mt-3 w-full accent-forest-700 disabled:opacity-60"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="label">Komentar &amp; Masukan Telaah untuk Penulis</label>
                <textarea
                  rows={4}
                  required
                  disabled={isLocked}
                  value={komentar}
                  onChange={(e) => setKomentar(e.target.value)}
                  className="input resize-none"
                  placeholder="Tuliskan catatan telaah substansi, metodologi, kekuatan naskah, dan saran perbaikan…"
                />
              </div>

              <div>
                <label className="label">Rekomendasi Keputusan untuk Editor</label>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {[
                    { key: "Lolos" as const, sub: "Layak terbit langsung" },
                    { key: "Revisi" as const, sub: "Perlu perbaikan penulis" },
                    { key: "Tidak Lolos" as const, sub: "Belum layak terbit" },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setRekomendasi(r.key)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        rekomendasi === r.key
                          ? "border-forest-800 bg-forest-950 text-white"
                          : "border-line bg-paper text-ink hover:border-forest-500"
                      }`}
                    >
                      <p className={`font-mono text-xs font-bold ${rekomendasi === r.key ? "text-gold-300" : ""}`}>
                        {r.key}
                      </p>
                      <p className={`mt-0.5 text-[11px] ${rekomendasi === r.key ? "text-forest-200/80" : "text-muted"}`}>
                        {r.sub}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {!isLocked && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="font-mono text-xs text-muted">
                    Skor Akhir Anda: <strong className="text-forest-950">{weightedTotal.toFixed(2)} / 100</strong>
                  </div>
                  <button disabled={loading} type="submit" className="btn btn-primary">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}{" "}
                    {sub.assignmentStatus === "dinilai" ? "Perbarui Nilai" : "Simpan & Kirim Nilai"}
                  </button>
                </div>
              )}

              {saved && (
                <p className="flex items-center gap-2 rounded-xl border border-forest-300 bg-forest-50 p-3.5 text-xs font-semibold text-forest-800">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Penilaian Anda ({weightedTotal.toFixed(2)} · {rekomendasi}) berhasil disimpan ke database dan dikirim ke Rekap Nilai Editor!
                </p>
              )}
            </form>
          </SectionCard>
        </div>
      </div>

      {/* Modal Pratinjau PDF Inline */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/70 p-4 backdrop-blur-sm">
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-sheet shadow-pop">
            <header className="flex items-center justify-between border-b border-line bg-forest-950 px-5 py-3.5 text-white">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-wider text-gold-300">Pratinjau Dokumen PDF</p>
                <p className="truncate text-sm font-semibold">{previewUrl.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={previewUrl.url} download className="btn btn-gold btn-sm">
                  <Download className="size-3.5" /> Unduh
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="flex size-9 items-center justify-center rounded-xl border border-white/15 text-white hover:bg-white/10"
                  aria-label="Tutup pratinjau"
                >
                  <X className="size-4" />
                </button>
              </div>
            </header>
            <iframe src={previewUrl.url} title={previewUrl.title} className="h-full w-full flex-1 bg-paper" />
          </div>
        </div>
      )}
    </>
  );
}
