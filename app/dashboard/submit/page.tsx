import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { SubmitWizard } from "./submit-wizard";

export const metadata: Metadata = { title: "Unggah Naskah Baru" };
export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const [db, session] = await Promise.all([readDb(), getSessionUser()]);
  const activeCategories = db.categories.filter((c) => c.is_active);
  const openEvents = db.events
    .filter((e) => e.status === "open")
    .map((e) => {
      const cat = db.categories.find((c) => c.id === e.category_id);
      return {
        id: e.id,
        category_id: e.category_id,
        category_nama: cat?.nama || "Essay",
        nama: e.nama,
        tema: e.tema,
        deadline: e.deadline,
        max_anggota: e.max_anggota,
        max_halaman: e.max_halaman,
      };
    });

  return (
    <>
      <PageHeader
        eyebrow="PENGAJUAN NASKAH PUBLIKASI"
        title="Unggah Naskah (Essay, Makalah, Artikel)"
        description="Pilih jenis naskah yang ingin Anda publikasikan (Essay, Makalah, Artikel Jurnal, Literature Review, atau Proposal), lengkapi metadata, dan unggah dokumen PDF."
      />
      <Suspense>
        <SubmitWizard
          categories={activeCategories}
          events={openEvents}
          defaultAuthor={{
            nama: session?.nama || "",
            institusi: session?.institusi || "Universitas Pancasakti Tegal",
            email: session?.email || "",
          }}
        />
      </Suspense>
    </>
  );
}
