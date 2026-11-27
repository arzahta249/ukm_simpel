import Link from "next/link";
import { ArrowUpRight, BookMarked, FileText, Users } from "lucide-react";
import { formatEventPages, getCategory, type EventItem } from "@/lib/data";
import { EventStatusBadge } from "./ui";

const ACCENTS = ["from-forest-600 to-forest-800", "from-gold-400 to-gold-600", "from-olive-500 to-forest-700", "from-forest-400 to-forest-700"];

export function EventCard({ event, categoryName }: { event: EventItem; categoryName?: string }) {
  const name = categoryName ?? getCategory(event.category_id)?.nama ?? "Naskah";
  const open = event.status === "open";

  return (
    <Link
      href={`/events/${event.id}`}
      className="card card-hover group relative flex flex-col overflow-hidden"
    >
      <div className={`h-2 bg-gradient-to-r ${ACCENTS[event.id % ACCENTS.length]}`} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-forest-50 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-forest-800 ring-1 ring-inset ring-forest-200">
            {name}
          </span>
          <EventStatusBadge status={event.status} />
        </div>

        <p className="mt-4 font-mono text-[11px] font-semibold text-gold-700">{event.volume}</p>
        <h3 className="mt-1 text-xl font-semibold leading-snug text-forest-950 transition-colors group-hover:text-forest-700">
          {event.nama}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{event.tema}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-[11px] text-muted">
          <span className="flex items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5">
            <BookMarked className="size-3.5 shrink-0 text-forest-700" />
            <span className="truncate">{event.max_anggota} penulis</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5">
            <FileText className="size-3.5 shrink-0 text-forest-700" />
            {formatEventPages(event, "hlm")}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5">
            <Users className="size-3.5 shrink-0 text-forest-700" />
            {event.peserta}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-line pt-3 text-xs">
            <span className="font-semibold text-forest-800">
              {open ? "Penerimaan naskah terbuka" : "Edisi telah terbit"}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-forest-800 transition-transform group-hover:translate-x-0.5">
              Lihat <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
