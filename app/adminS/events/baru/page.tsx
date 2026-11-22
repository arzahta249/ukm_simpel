import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { EventForm } from "./event-form";

export const metadata: Metadata = { title: "Buat Periode Penerimaan" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const db = await readDb();
  const activeCategories = db.categories.filter((c) => c.is_active).map(({ id, nama }) => ({ id, nama }));

  return (
    <>
      <Link
        href="/adminS/events"
        className="mb-5 inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted hover:text-forest-800"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke daftar periode
      </Link>
      <PageHeader
        eyebrow="LANGKAH 1 ALUR ADMIN · ADMIN BUAT EVENT"
        title="Buat Periode / Event Publikasi Baru"
        description="Tetapkan tema terbitan, tenggat unggah (deadline), batas halaman & penulis, serta kriteria penilaian berbobot 100%."
      />
      <EventForm categories={activeCategories} />
    </>
  );
}
