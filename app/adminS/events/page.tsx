import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { EventStatusBadge, PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { daysLeft, formatShortDate } from "@/lib/utils";
import { EventRowActions } from "./event-actions";

export const metadata: Metadata = { title: "Periode & Event Publikasi" };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const db = await readDb();

  return (
    <>
      <PageHeader
        eyebrow="TAHAP 1 ALUR ADMIN · TABEL EVENTS &amp; CRITERIA"
        title="Periode &amp; Event Penerimaan KTI"
        description="Buat dan kelola periode penerimaan karya tulis ilmiah: tema terbitan, deadline, batas halaman & penulis, serta kriteria penilaian."
        actions={
          <Link href="/adminS/events/baru" className="btn btn-primary">
            <Plus className="size-4" /> Buat Periode / Event
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {db.events.map((e) => {
          const crit = db.criteria.filter((c) => c.event_id === e.id);
          const cat = db.categories.find((c) => c.id === e.category_id);
          const left = daysLeft(e.deadline);
          return (
            <article key={e.id} className="card overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <span className="font-mono text-xs font-semibold text-forest-800">
                    {e.volume} · {cat?.nama}
                  </span>
                  <EventStatusBadge status={e.status} />
                </div>

                <h3 className="mt-3 text-xl font-semibold leading-snug text-forest-950">{e.nama}</h3>
                <p className="mt-1 text-xs text-muted">Tema: {e.tema}</p>
              </div>

              <div className="grid grid-cols-4 border-y border-line bg-paper text-center font-mono">
                {[
                  { v: e.peserta, l: "Naskah" },
                  { v: `${e.max_halaman} hlm`, l: "Maks. Hlm" },
                  { v: `${e.max_anggota} org`, l: "Maks. Penulis" },
                  { v: left > 0 ? `${left} hr` : "Selesai", l: "Sisa Waktu" },
                ].map(({ v, l }) => (
                  <div key={l} className="border-r border-line px-2 py-3 last:border-r-0">
                    <p className="text-sm font-bold text-forest-950">{v}</p>
                    <p className="text-[10px] uppercase text-muted">{l}</p>
                  </div>
                ))}
              </div>

              <div className="p-5 sm:p-6">
                <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Komposisi Kriteria Penilaian (100%)
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {crit.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded border border-line bg-paper/60 px-3 py-1.5 text-xs"
                    >
                      <span className="truncate text-ink">{c.nama}</span>
                      <span className="ml-2 font-mono font-bold text-forest-800">{c.bobot}%</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                  <span className="font-mono text-xs text-muted">Tenggat: {formatShortDate(e.deadline)}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/events/${e.id}`} className="btn btn-outline btn-sm">
                      <Eye className="size-3.5" /> Pratinjau
                    </Link>
                    <EventRowActions eventId={e.id} currentStatus={e.status} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
