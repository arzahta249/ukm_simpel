"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react";
import { SectionCard, StatusBadge } from "@/components/ui";
import type { Criteria, Submission, User } from "@/lib/data";
import { submitReviewAction } from "@/app/actions";

type ReviewableSub = Submission & {
  authorName: string;
  authorInstitusi: string;
  eventName: string;
  volume: string;
  criteria: Criteria[];
};

export function PenilaianClient({
  submissions,
  juries,
}: {
  submissions: ReviewableSub[];
  juries: User[];
}) {
  const router = useRouter();
  const [selectedSubId, setSelectedSubId] = useState<number>(submissions[0]?.id ?? 101);
  const [selectedJuriId, setSelectedJuriId] = useState<string>(juries[0]?.id ?? "j-1");
  const [scores, setScores] = useState<Record<number, number>>({ 0: 88, 1: 86, 2: 84, 3: 87 });
  const [komentar, setKomentar] = useState(
    "Substansi kajian relevan dengan tema terbitan dan didukung analisis yang runtut. Layak diterbitkan pada repositori ilmiah SIMPEL.",
  );
  const [rekomendasi, setRekomendasi] = useState<"Lolos" | "Revisi" | "Tidak Lolos">("Lolos");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const sub = submissions.find((s) => s.id === selectedSubId) ?? submissions[0];
  if (!sub) {
    return <div className="card p-8 text-center text-sm text-muted">Belum ada naskah pada tahap penilaian.</div>;
  }

  const crit = sub.criteria;
  const weightedTotal = crit.reduce((acc, c, idx) => {
    const val = scores[idx] ?? 85;
    return acc + (val * c.bobot) / 100;
  }, 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    await submitReviewAction({
      submission_id: sub.id,
      juri_id: selectedJuriId,
      scores: crit.map((c, idx) => ({ criteria_id: c.id, skor: scores[idx] ?? 85 })),
      total_skor: weightedTotal,
      komentar,
      rekomendasi,
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-5">
        <div className="card p-4">
          <label className="label">Bertindak Sebagai Reviewer / Juri</label>
          <select
            value={selectedJuriId}
            onChange={(e) => {
              setSelectedJuriId(e.target.value);
              setSaved(false);
            }}
            className="input"
          >
            {juries.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama} ({j.nim_nisn})
              </option>
            ))}
          </select>
        </div>

        <SectionCard title="Daftar Naskah Ditugaskan">
          <ul className="divide-y divide-line">
            {submissions.map((item) => {
              const active = item.id === sub.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubId(item.id);
                      setSaved(false);
                    }}
                    className={`w-full p-4 text-left transition-colors ${
                      active ? "bg-forest-50/90" : "hover:bg-paper"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-forest-800">SMPL-{item.id}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-forest-950">{item.judul}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted">
                      <span>Penulis: {item.authorName}</span>
                      {item.skor_akhir && (
                        <span className="font-mono font-bold text-forest-800">Rata-rata: {item.skor_akhir}</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <div className="xl:col-span-7">
        <SectionCard
          title={`Formulir Penilaian · SMPL-${sub.id}`}
          description={`${sub.eventName} (${sub.volume})`}
          action={
            <span className="rounded-lg bg-forest-950 px-3 py-1 font-mono text-xs font-bold text-gold-300">
              Total Tertimbang: {weightedTotal.toFixed(1)}
            </span>
          }
        >
          <form className="space-y-5 p-5 sm:p-6" onSubmit={onSubmit}>
            <div className="rounded-xl border border-line bg-paper p-4">
              <p className="text-sm font-semibold text-forest-950">{sub.judul}</p>
              <p className="mt-1 text-xs text-muted">
                Penulis: {sub.authorName} ({sub.authorInstitusi})
              </p>
            </div>

            <div className="space-y-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-forest-800">
                Skor Per Kriteria (review_scores)
              </p>
              {crit.map((c, idx) => {
                const val = scores[idx] ?? 85;
                return (
                  <div key={c.id} className="rounded-xl border border-line bg-sheet p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">{c.nama}</p>
                        <p className="font-mono text-xs text-muted">Bobot Kriteria: {c.bobot}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
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
                      value={val}
                      onChange={(e) => setScores({ ...scores, [idx]: Number(e.target.value) })}
                      className="mt-3 w-full accent-forest-700"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="label">Komentar &amp; Catatan Telaah Reviewer (reviews.komentar)</label>
              <textarea
                rows={4}
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                className="input resize-none"
                placeholder="Tuliskan masukan konstruktif untuk penulis…"
              />
            </div>

            <div>
              <label className="label">Rekomendasi Keputusan (reviews.rekomendasi)</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(["Lolos", "Revisi", "Tidak Lolos"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRekomendasi(r)}
                    className={`rounded-xl border py-2.5 font-mono text-xs font-bold transition-colors ${
                      rekomendasi === r
                        ? "border-forest-800 bg-forest-950 text-gold-300"
                        : "border-line bg-paper text-muted hover:text-ink"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="font-mono text-xs text-muted">
                Skor Akhir Juri Ini: <strong className="text-forest-950">{weightedTotal.toFixed(2)}</strong>
              </div>
              <button disabled={loading} type="submit" className="btn btn-primary">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />} Simpan Penilaian Juri
              </button>
            </div>

            {saved && (
              <p className="flex items-center gap-2 rounded-xl border border-forest-300 bg-forest-50 p-3 font-mono text-xs font-semibold text-forest-800">
                <CheckCircle2 className="size-4 shrink-0" />
                Skor ({weightedTotal.toFixed(2)}) dan rekomendasi ({rekomendasi}) berhasil disimpan ke database!
              </p>
            )}
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
