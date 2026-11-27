"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { uploadRevisionAction } from "@/app/actions";

export function RevisionUploadBox({ submissionId }: { submissionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("submission_id", String(submissionId));
    const res = await uploadRevisionAction(fd);
    setLoading(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error || "Gagal mengunggah revisi." });
      return;
    }
    setMsg({
      ok: true,
      text: "Naskah revisi PDF berhasil diunggah! Status kembali ke peninjauan Reviewer.",
    });
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-orange-300 bg-orange-50/70 p-5 sm:p-6"
    >
      <div>
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-orange-800">
          TINDAK LANJUT PENULIS · UNGGAH REVISI
        </p>
        <h3 className="mt-1 text-base font-semibold text-forest-950">
          Naskah Memerlukan Revisi Sebelum Diterbitkan
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Baca catatan komentar Reviewer di bawah, perbaiki berkas Anda, lalu unggah versi PDF terbaru (maks. 5 MB).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">File PDF Revisi Terbaru</label>
          <input name="file_revisi" type="file" accept="application/pdf" required className="input !py-2 text-xs" />
        </div>
        <div>
          <label className="label">Ringkasan Perbaikan (untuk Reviewer &amp; Editor)</label>
          <input
            name="catatan"
            className="input text-xs"
            placeholder="cth. Menambahkan referensi terbaru & memperbaiki metodologi"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {msg ? (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              msg.ok ? "text-forest-800" : "text-red-700"
            }`}
          >
            {msg.ok && <CheckCircle2 className="size-4" />}
            {msg.text}
          </span>
        ) : (
          <span />
        )}
        <button disabled={loading} type="submit" className="btn btn-primary btn-sm">
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Kirim Revisi PDF
        </button>
      </div>
    </form>
  );
}
