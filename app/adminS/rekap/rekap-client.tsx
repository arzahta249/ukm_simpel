"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calculator, CheckCircle2, Globe, Loader2 } from "lucide-react";
import { PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import type { SubmissionStatus } from "@/lib/data";
import { finalizeRecapAction } from "@/app/actions";

export type RecapRow = {
  id: number;
  judul: string;
  penulis: string;
  institusi: string;
  volume: string;
  skorJuri1: number;
  skorJuri2: number;
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
        skor_akhir: Number(((r.skorJuri1 + r.skorJuri2) / 2).toFixed(2)),
      })),
    );
    setSaving(false);
    setAnnounced(true);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="TAHAP 6 &amp; 7 ALUR ADMIN · REKAP NILAI &amp; PENGUMUMAN PUBLIKASI"
        title="Rekapitulasi Skor Akhir &amp; Penerbitan"
        description="Hitung skor rata-rata dari seluruh juri pada setiap naskah, lalu tetapkan keputusan akhir: Terbit (Lolos), Perlu Revisi, atau Terbit · Karya Terbaik."
        actions={
          <button type="button" disabled={saving} onClick={publishAll} className="btn btn-gold">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />} Simpan &amp; Terbitkan ke Katalog
          </button>
        }
      />

      {announced && (
        <div className="mb-6 flex items-center gap-2.5 rounded-md border border-forest-300 bg-forest-50 p-4 text-xs font-semibold text-forest-900">
          <CheckCircle2 className="size-4 shrink-0 text-forest-700" />
          Keputusan rekapitulasi telah disimpan ke database! Seluruh naskah berstatus Terbit (Lolos / Karya Terbaik) kini otomatis tampil di Katalog Publikasi Beranda.
        </div>
      )}

      <SectionCard
        title="Tabel Perhitungan Skor Akhir (submissions.skor_akhir)"
        description="Skor Akhir = (Skor Juri 1 + Skor Juri 2) ÷ 2"
        action={
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-forest-800">
            <Calculator className="size-3.5" /> Otomatis Terhitung
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Judul Karya Tulis &amp; Penulis</th>
                <th>Juri 1</th>
                <th>Juri 2</th>
                <th>Skor Akhir</th>
                <th>Status Saat Ini</th>
                <th>Keputusan Publikasi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const avg = ((r.skorJuri1 + r.skorJuri2) / 2).toFixed(2);
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-bold text-forest-900">SMPL-{r.id}</td>
                    <td className="max-w-sm">
                      <p className="line-clamp-1 font-semibold text-ink">{r.judul}</p>
                      <p className="text-xs text-muted">
                        {r.penulis} · {r.institusi} ({r.volume})
                      </p>
                    </td>
                    <td className="font-mono text-xs">{r.skorJuri1.toFixed(1)}</td>
                    <td className="font-mono text-xs">{r.skorJuri2.toFixed(1)}</td>
                    <td className="font-mono text-sm font-bold text-forest-900">{avg}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <select
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value as SubmissionStatus)}
                        className="input !py-1.5 !text-xs font-mono"
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
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}

