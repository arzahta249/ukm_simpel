import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { Reveal } from "@/components/reveal";
import { readDb } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Periode Penerimaan Naskah" };
export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const { kategori } = await searchParams;
  const catFilter = kategori ? Number(kategori) : null;

  const db = await readDb();
  const filtered = catFilter ? db.events.filter((e) => e.category_id === catFilter) : db.events;
  const catName = (id: number) => db.categories.find((c) => c.id === id)?.nama;

  const chip = (active: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-xs font-bold transition-colors",
      active
        ? "bg-forest-900 text-white shadow-soft"
        : "border border-line-strong bg-sheet text-ink hover:border-forest-600 hover:bg-forest-50",
    );

  return (
    <>
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div aria-hidden className="bg-dots absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow rise">Periode penerimaan</p>
          <h1 className="rise mt-2 max-w-3xl text-4xl font-semibold leading-tight text-forest-950 sm:text-6xl" style={{ animationDelay: "80ms" }}>
            Pilih periode, lalu kirim tulisanmu.
          </h1>
          <p className="rise mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base" style={{ animationDelay: "160ms" }}>
            Setiap periode punya tema, batas halaman, dan tenggat sendiri. Baca dulu ketentuannya, lalu unggah naskahmu.
          </p>

          <div className="rise mt-7 flex flex-wrap gap-2" style={{ animationDelay: "240ms" }}>
            <Link href="/events" className={chip(!catFilter)}>
              Semua ({db.events.length})
            </Link>
            {db.categories
              .filter((c) => c.is_active)
              .map((c) => (
                <Link key={c.id} href={`/events?kategori=${c.id}`} className={chip(catFilter === c.id)}>
                  {c.nama}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {filtered.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e, i) => (
              <Reveal key={e.id} delay={(i % 3) * 80}>
                <EventCard event={e} categoryName={catName(e.category_id)} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line-strong bg-sheet p-12 text-center">
            <p className="text-lg font-semibold text-forest-950">Belum ada periode untuk jenis naskah ini</p>
            <Link href="/events" className="btn btn-outline mt-4">
              Lihat semua periode
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
