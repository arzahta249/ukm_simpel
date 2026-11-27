import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { KategoriClient } from "./kategori-client";

export const metadata: Metadata = { title: "Kategori Karya Tulis Ilmiah" };
export const dynamic = "force-dynamic";

export default async function KategoriPage() {
  const db = await readDb();
  const counts: Record<number, number> = {};
  for (const c of db.categories) {
    counts[c.id] = db.events.filter((e) => e.category_id === c.id).length;
  }

  return (
    <>
      <PageHeader
        eyebrow="TABEL CATEGORIES · JENIS NASKAH"
        title="Jenis Naskah (Essay, Makalah &amp; Artikel Jurnal)"
        description="Kelola jenis naskah yang dapat dipilih penulis saat mengunggah dokumen (Essay, Makalah Akademik, dan Artikel Jurnal Riset)."
      />
      <KategoriClient categories={db.categories} counts={counts} />
    </>
  );
}
