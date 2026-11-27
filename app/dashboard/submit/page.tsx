import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { SubmitWizard } from "./submit-wizard";

export const metadata: Metadata = { title: "Unggah & Publikasikan Naskah" };
export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; event?: string }>;
}) {
  const [db, session, sp] = await Promise.all([readDb(), getSessionUser(), searchParams]);
  const activeCategories = db.categories.filter((c) => c.is_active);
  const openEvents = db.events
    .filter((e) => e.status === "open")
    .map((e) => {
      const cat = db.categories.find((c) => c.id === e.category_id);
      return {
        id: e.id,
        category_id: e.category_id,
        category_nama: cat?.nama || "Makalah",
        nama: e.nama,
        tema: e.tema,
        volume: e.volume,
        deadline: e.deadline,
        max_anggota: e.max_anggota,
        max_halaman: e.max_halaman,
      };
    });

  const editId = Number(sp.edit || 0);
  const draftSub =
    editId > 0
      ? db.submissions.find(
          (s) => s.id === editId && (!session || s.user_id === session.id || session.role === "admin"),
        )
      : undefined;
  const draftMembers = draftSub
    ? db.submission_members.filter((m) => m.submission_id === draftSub.id)
    : [];
  const draftFiles = draftSub
    ? db.submission_files.filter((f) => f.submission_id === draftSub.id)
    : [];

  return (
    <>
      <PageHeader
        eyebrow={draftSub ? `EDIT DRAFT · SMPL-${draftSub.id}` : "ALUR PUBLIKASI ESSAY, MAKALAH & ARTIKEL JURNAL"}
        title={draftSub ? "Edit Draft Naskah" : "Ajukan Essay, Makalah, atau Artikel Jurnal"}
        description="Pilih jenis naskah (Essay, Makalah, atau Artikel Jurnal Riset), lengkapi format sesuai jenisnya, lalu simpan draft atau ajukan publikasi."
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
          initialDraft={
            draftSub
              ? {
                  id: draftSub.id,
                  event_id: draftSub.event_id,
                  judul: draftSub.judul,
                  subjudul: draftSub.subjudul || "",
                  topik: draftSub.topik || "Pendidikan",
                  jenis_riset: draftSub.jenis_riset || "Kuantitatif",
                  abstrak: draftSub.abstrak,
                  cover_image: draftSub.cover_image || "",
                  kata_kunci: draftSub.kata_kunci,
                  prodi: draftSub.prodi || "",
                  bio: draftSub.bio || "",
                  isi_essay: draftSub.isi_essay || {
                    pendahuluan: "",
                    metode_penelitian: "",
                    hasil_pembahasan: "",
                    pembahasan: "",
                    kesimpulan: "",
                    daftar_pustaka: "",
                  },
                  visibilitas: draftSub.visibilitas || "publik",
                  persetujuan_publikasi: Boolean(draftSub.persetujuan_publikasi),
                  pernyataan_orisinalitas: Boolean(draftSub.pernyataan_orisinalitas),
                  hasExistingFile: draftFiles.length > 0,
                  members: draftMembers.map((m) => ({
                    nama: m.nama,
                    institusi: m.institusi,
                    email: m.email,
                  })),
                }
              : undefined
          }
        />
      </Suspense>
    </>
  );
}
