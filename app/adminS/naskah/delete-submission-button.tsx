"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteSubmissionAction } from "@/app/actions";

export function DeleteSubmissionButton({
  submissionId,
  label = "Hapus",
  redirectTo,
  compact = false,
}: {
  submissionId: number;
  label?: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    const res = await deleteSubmissionAction(submissionId);
    setLoading(false);
    if (!res.ok) {
      setConfirming(false);
      return;
    }
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-2 py-1">
        <span className="font-mono text-[11px] font-bold text-red-900">Hapus?</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => void onDelete()}
          className="rounded-lg bg-red-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : "Ya"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setConfirming(false)}
          className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-ink ring-1 ring-line hover:bg-paper"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={
        compact
          ? "inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50/70 p-2 text-red-700 transition-colors hover:bg-red-100"
          : "btn btn-sm border border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
      }
      title="Hapus naskah ini"
      aria-label="Hapus naskah"
    >
      <Trash2 className="size-3.5" />
      {!compact && <span>{label}</span>}
    </button>
  );
}
