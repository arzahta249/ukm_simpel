import Link from "next/link";
import { ArrowUpRight, CalendarDays, FileText, Users } from "lucide-react";
import { getCategory, type EventItem } from "@/lib/data";
import { daysLeft, formatShortDate } from "@/lib/utils";
import { EventStatusBadge } from "./ui";

const ACCENTS = ["from-forest-600 to-forest-800", "from-gold-400 to-gold-600", "from-olive-500 to-forest-700", "from-forest-400 to-forest-700"];

export function EventCard({ event, categoryName }: { event: EventItem; categoryName?: string }) {
  const left = daysLeft(event.deadline);
  const name = categoryName ?? getCategory(event.category_id)?.nama ?? "Naskah";
  const open = event.status === "open";
  const pct = open ? Math.min(100, Math.max(6, 100 - (Math.max(left, 0) / 60) * 100)) : 100;
  const urgent = open && left <= 14;

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
            <CalendarDays className="size-3.5 shrink-0 text-forest-700" />
            <span className="truncate">{formatShortDate(event.deadline)}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5">
            <FileText className="size-3.5 shrink-0 text-forest-700" />
            {event.max_halaman} hlm
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5">
            <Users className="size-3.5 shrink-0 text-forest-700" />
            {event.peserta}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className={`font-semibold ${urgent ? "text-red-700" : "text-forest-800"}`}>
              {open ? (left > 0 ? `Sisa ${left} hari lagi` : "Penerimaan berakhir") : "Edisi telah terbit"}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-forest-800 transition-transform group-hover:translate-x-0.5">
              Lihat <ArrowUpRight className="size-3.5" />
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-paper-dark">
            <div
              className={`h-full rounded-full ${urgent ? "bg-red-500" : "bg-gradient-to-r from-forest-400 to-forest-700"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
