import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { readDb } from "@/lib/db";

export const metadata: Metadata = { title: "Periode Penerimaan Naskah" };
export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const { kategori } = await searchParams;
  const catFilter = kategori ? Number(kategori) : null;

  const db = await readDb();
  const filtered = catFilter ? db.events.filter((e) => e.category_id === catFilter) : db.events;

  return (
    <>
      <section className="border-b border-line-strong bg-sheet py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">JADWAL &amp; EDISI PENERBITAN</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-forest-950 sm:text-5xl">
            Periode Penerimaan Karya Tulis Ilmiah
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Daftar edisi publikasi dan periode pengumpulan naskah ilmiah UKM SIMPEL. Pilih periode yang sedang dibuka untuk melihat cakupan tema, batas halaman, kriteria telaah, dan mengunggah karya Anda.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <Link
              href="/events"
              className={`rounded-md px-3.5 py-1.5 font-mono text-xs font-semibold ${
                !catFilter ? "bg-forest-900 text-white" : "border border-line-strong bg-paper text-ink hover:border-forest-700"
              }`}
            >
              Semua Periode ({db.events.length})
            </Link>
            {db.categories
              .filter((c) => c.is_active)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/events?kategori=${c.id}`}
                  className={`rounded-md px-3.5 py-1.5 font-mono text-xs font-semibold ${
                    catFilter === c.id
                      ? "bg-forest-900 text-white"
                      : "border border-line-strong bg-paper text-ink hover:border-forest-700"
                  }`}
                >
                  {c.nama}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>
    </>
  );
}
