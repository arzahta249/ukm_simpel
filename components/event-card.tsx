import Link from "next/link";
import { ArrowUpRight, CalendarDays, FileText, Users } from "lucide-react";
import { getCategory, type EventItem } from "@/lib/data";
import { daysLeft, formatShortDate } from "@/lib/utils";
import { EventStatusBadge } from "./ui";

export function EventCard({ event }: { event: EventItem }) {
  const left = daysLeft(event.deadline);
  const cat = getCategory(event.category_id);

  return (
    <Link href={`/events/${event.id}`} className="card card-hover group flex flex-col justify-between p-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5">
          <span className="font-mono text-xs font-semibold text-forest-800">
            {event.volume} · {cat?.nama}
          </span>
          <EventStatusBadge status={event.status} />
        </div>

        <h3 className="mt-4 text-xl font-semibold leading-snug text-forest-950 group-hover:text-forest-700">
          {event.nama}
        </h3>

        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted">Tema Cakupan</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-ink/85">{event.tema}</p>
      </div>

      <div className="mt-6 pt-4 border-t border-line">
        <div className="grid grid-cols-3 gap-2 font-mono text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0 text-forest-700" />
            <span className="truncate">{formatShortDate(event.deadline)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="size-3.5 shrink-0 text-forest-700" />
            Maks {event.max_halaman} hlm
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0 text-forest-700" />
            {event.peserta} naskah
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-md bg-paper px-3 py-2 text-xs">
          <span className="font-mono text-muted">
            {event.status === "open"
              ? left > 0
                ? `Batas unggah ${left} hari lagi`
                : "Batas unggah berakhir"
              : "Edisi telah terbit"}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-forest-800 group-hover:translate-x-0.5 transition-transform">
            Detail <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
