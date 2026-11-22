"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { EventStatus } from "@/lib/data";
import { deleteEventAction, updateEventStatusAction } from "@/app/actions";

export function EventRowActions({
  eventId,
  currentStatus,
}: {
  eventId: number;
  currentStatus: EventStatus;
}) {
  const router = useRouter();

  async function onStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateEventStatusAction(eventId, e.target.value as EventStatus);
    router.refresh();
  }

  async function onDelete() {
    await deleteEventAction(eventId);
    router.refresh();
  }

  return (
    <>
      <select
        value={currentStatus}
        onChange={onStatusChange}
        className="input !w-auto !py-1 !text-xs font-mono"
        aria-label="Ubah status periode"
      >
        <option value="open">Buka Penerimaan</option>
        <option value="review">Tahap Kurasi</option>
        <option value="announced">Telah Terbit</option>
        <option value="closed">Tutup</option>
        <option value="draft">Draft</option>
      </select>
      <button
        type="button"
        onClick={onDelete}
        className="rounded border border-line p-1.5 text-muted hover:bg-red-50 hover:text-red-700"
        aria-label="Hapus periode"
      >
        <Trash2 className="size-3.5" />
      </button>
    </>
  );
}

