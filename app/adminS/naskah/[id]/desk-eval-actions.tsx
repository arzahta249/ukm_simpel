"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { STATUS_META, type SubmissionStatus } from "@/lib/data";
import { deskEvaluationAction } from "@/app/actions";

export function DeskEvaluationActions({
  submissionId,
  initialStatus,
}: {
  submissionId: number;
  initialStatus: SubmissionStatus;
}) {
  const router = useRouter();
  const [checks, setChecks] = useState({
    berkas: true,
    orisinalitas: true,
    format: true,
  });
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | "desk_review" | "tidak_lolos">(null);

  const allChecked = checks.berkas && checks.orisinalitas && checks.format;

  async function decide(decision: "desk_review" | "tidak_lolos") {
    setLoading(true);
    await deskEvaluationAction(submissionId, decision, catatan);
    setLoading(false);
    setResult(decision);
    router.refresh();
  }

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-forest-950 px-5 py-4 text-white sm:px-6">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-gold-300">
            TAHAP 2 &amp; 3 ALUR EDITOR · DESK EVALUATION
          </p>
          <h2 className="font-sans text-sm font-bold">Pemeriksaan Kelengkapan, Orisinalitas &amp; Format</h2>
        </div>
        <span className="font-mono text-xs text-forest-200">
          ID #{submissionId} · Status: {STATUS_META[initialStatus].label}
        </span>
      </header>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            { key: "berkas" as const, label: "Berkas PDF Lengkap", sub: "Naskah & lampiran terbaca" },
            { key: "orisinalitas" as const, label: "Surat Orisinalitas Valid", sub: "Bertanda tangan penulis" },
            { key: "format" as const, label: "Format & Tata Tulis Sesuai", sub: "Sesuai pedoman halaman" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-paper p-3 text-xs"
            >
              <input
                type="checkbox"
                checked={checks[item.key]}
                onChange={(e) => setChecks({ ...checks, [item.key]: e.target.checked })}
                className="mt-0.5 size-4 accent-forest-700"
              />
              <div>
                <p className="font-semibold text-ink">{item.label}</p>
                <p className="text-[11px] text-muted">{item.sub}</p>
              </div>
            </label>
          ))}
        </div>

        <div>
          <label className="label">Catatan Editor (disimpan ke status_logs &amp; notifikasi penulis)</label>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="input resize-none"
            placeholder="Tuliskan catatan hasil pemeriksaan kelengkapan atau alasan penolakan apabila tidak lolos…"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => decide("tidak_lolos")}
            className="btn btn-danger"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Tidak Lolos &amp; Kirim Notifikasi
          </button>

          <button
            type="button"
            disabled={!allChecked || loading}
            onClick={() => decide("desk_review")}
            className="btn btn-primary"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Lolos Desk Evaluation → Tugaskan Reviewer
          </button>
        </div>

        {result && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-semibold ${
              result === "desk_review"
                ? "border-forest-300 bg-forest-50 text-forest-900"
                : "border-red-300 bg-red-50 text-red-900"
            }`}
          >
            <Send className="size-4 shrink-0" />
            {result === "desk_review"
              ? "Keputusan tersimpan di database: LOLOS Desk Evaluation. Silakan lanjutkan ke menu Tugaskan Reviewer/Juri."
              : "Keputusan tersimpan di database: TIDAK LOLOS dan log notifikasi penolakan telah dikirim ke penulis."}
          </div>
        )}
      </div>
    </section>
  );
}
