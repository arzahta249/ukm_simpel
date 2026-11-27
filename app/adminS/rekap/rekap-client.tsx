"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calculator, CheckCircle2, Globe, Loader2 } from "lucide-react";
import { PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import type { SubmissionStatus } from "@/lib/data";
import { finalizeRecapAction } from "@/app/actions";

export type RecapReviewItem = {
  reviewerName: string;
  status: "pending" | "dinilai";
  skor: number | null;
  rekomendasi: string | null;
};

export type RecapRow = {
  id: number;
  judul: string;
  penulis: string;
  institusi: string;
  volume: string;
  reviews: RecapReviewItem[];
  avgSkor: number | null;
  status: SubmissionStatus;
};

export function RekapClient({ initialRows }: { initialRows: RecapRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<RecapRow[]>(initialRows);
  const [saving, setSaving] = useState(false);
  const [announced, setAnnounced] = useState(false);

  function setStatus(id: number, status: SubmissionStatus) {
    setRows(rows.map((r) => (r.id === id ? { ...r, status } : r)));
    setAnnounced(false);
  }

  async function publishAll() {
    setSaving(true);
    await finalizeRecapAction(
      rows.map((r) => ({
        id: r.id,
        status: r.status,
        skor_akhir: r.avgSkor,
      })),
    );
    setSaving(false);
    setAnnounced(true);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="TAHAP 6 &amp; 7 ALUR EDITOR · REKAP NILAI &amp; PENERBITAN"
        title="Rekapitulasi Skor Akhir &amp; Penerbitan"
        description="Pantau skor dan rekomendasi langsung dari masing-masing Reviewer, hitung rata-rata otomatis, lalu tetapkan keputusan akhir untuk diterbitkan ke katalog."
        actions={
          <button type="button" disabled={saving} onClick={publishAll} className="btn btn-gold">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />} Simpan &amp; Terbitkan ke Katalog
          </button>
        }
      />

      {announced && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-forest-300 bg-forest-50 p-4 text-xs font-semibold text-forest-900">
          <CheckCircle2 className="size-4 shrink-0 text-forest-700" />
          Keputusan rekapitulasi telah disimpan ke database! Seluruh naskah berstatus Terbit (Lolos / Karya Terbaik) kini otomatis tampil di Katalog Beranda.
        </div>
      )}

      <SectionCard
        title="Tabel Rekap Nilai Reviewer (submissions.skor_akhir)"
        description="Skor rata-rata dihitung otomatis dari Reviewer yang telah menyelesaikan penilaian"
        action={
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-forest-800">
            <Calculator className="size-3.5" /> Terhubung ke /reviewer
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Judul Naskah &amp; Penulis</th>
                <th>Hasil Penilaian Reviewer</th>
                <th>Skor Rata-rata</th>
                <th>Status Saat Ini</th>
                <th>Keputusan Editor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs font-bold text-forest-900">SMPL-{r.id}</td>
                  <td className="max-w-xs">
                    <p className="line-clamp-1 font-semibold text-ink">{r.judul}</p>
                    <p className="text-xs text-muted">
                      {r.penulis} · {r.institusi} ({r.volume})
                    </p>
                  </td>
                  <td>
                    {r.reviews.length > 0 ? (
                      <ul className="space-y-1 text-xs">
                        {r.reviews.map((rv, i) => (
                          <li key={i} className="flex items-center justify-between gap-3">
                            <span className="truncate text-muted">{rv.reviewerName}</span>
                            {rv.skor !== null ? (
                              <span className="shrink-0 font-mono font-bold text-forest-800">
                                {rv.skor.toFixed(1)} ({rv.rekomendasi})
                              </span>
                            ) : (
                              <span className="shrink-0 font-mono text-[11px] text-amber-700">Menunggu</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="font-mono text-xs text-muted">Belum ada reviewer</span>
                    )}
                  </td>
                  <td className="font-mono text-sm font-bold text-forest-900">
                    {r.avgSkor !== null ? r.avgSkor.toFixed(2) : "—"}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <select
                      value={r.status}
                      onChange={(e) => setStatus(r.id, e.target.value as SubmissionStatus)}
                      className="input !min-h-9 !py-1.5 !text-xs font-mono"
                    >
                      <option value="lolos">Terbit (Lolos)</option>
                      <option value="juara">Terbit · Karya Terbaik</option>
                      <option value="revisi">Perlu Revisi</option>
                      <option value="review">Ditinjau Juri</option>
                      <option value="desk_review">Desk Evaluation</option>
                      <option value="submitted">Submitted</option>
                      <option value="tidak_lolos">Tidak Lolos</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}
