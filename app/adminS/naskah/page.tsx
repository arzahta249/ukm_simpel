import type { Metadata } from "next";
import { FileCheck, Globe } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { stripHtml } from "@/lib/utils";
import { NaskahClient, type IncomingRow } from "./naskah-client";

export const metadata: Metadata = { title: "Naskah Masuk & Verifikasi" };
export const dynamic = "force-dynamic";

export default async function AdminNaskahPage({ searchParams }: PageProps<"/adminS/naskah">) {
  const { status } = await searchParams;
  const db = await readDb();

  const needVerify = db.submissions.filter((s) => ["submitted", "desk_review", "review"].includes(s.status));

  const rows: IncomingRow[] = db.submissions.map((s) => {
    const u = db.users.find((x) => x.id === s.user_id);
    const ev = db.events.find((e) => e.id === s.event_id);
    const cat = db.categories.find((c) => c.id === ev?.category_id);
    const members = db.submission_members.filter((m) => m.submission_id === s.id);
    const files = db.submission_files.filter((f) => f.submission_id === s.id);
    const mainPdf = files.find((f) => f.file_path.startsWith("/uploads/"));
    const hasStructuredText = Boolean(
      s.isi_essay &&
        (stripHtml(s.isi_essay.pendahuluan || "").length > 0 ||
          stripHtml(s.isi_essay.pembahasan || "").length > 0 ||
          stripHtml(s.isi_essay.metode_penelitian || "").length > 0),
    );

    return {
      id: s.id,
      judul: s.judul,
      subjudul: s.subjudul,
      topik: s.topik,
      jenis_riset: s.jenis_riset,
      abstrak: s.abstrak,
      visibilitas: s.visibilitas,
      prodi: s.prodi,
      status: s.status,
      submitted_at: s.submitted_at,
      categoryName: cat?.nama || "Naskah",
      volume: ev?.volume || "",
      authorName: members[0]?.nama || u?.nama || "Penulis",
      authorEmail: members[0]?.email || u?.email || "-",
      authorInstitusi: members[0]?.institusi || u?.institusi || "-",
      memberCount: Math.max(1, members.length),
      fileCount: files.length,
      primaryPdfPath: mainPdf?.file_path,
      hasStructuredText,
    };
  });

  const categoryNames = db.categories.map((c) => c.nama);

  return (
    <>
      <PageHeader
        eyebrow="DATA PENULISAN MASUK · MENU EDITOR"
        title="Naskah Masuk &amp; Verifikasi"
        description="Pantau seluruh data penulisan yang masuk (judul, penulis, email, bidang, PDF, dan struktur), periksa kelayakan, atau hapus naskah bila diperlukan."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card flex items-start gap-3.5 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gold-300 bg-gold-50 text-gold-700">
            <FileCheck className="size-4" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold uppercase text-forest-950">
              {needVerify.length} Naskah Menunggu Tindakan Editor
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Klik <strong>Periksa</strong> untuk melakukan Desk Evaluation atau melihat isi lengkap dan berkas PDF.
            </p>
          </div>
        </div>
        <div className="card flex items-start gap-3.5 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-paper text-forest-800">
            <Globe className="size-4" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold uppercase text-forest-950">Kelola &amp; Hapus Data Masuk</p>
            <p className="mt-0.5 text-xs text-muted">
              Gunakan pencarian, filter jenis naskah/status, atau tombol hapus untuk membersihkan naskah duplikat/tidak valid.
            </p>
          </div>
        </div>
      </div>

      <NaskahClient rows={rows} categories={categoryNames} initialStatus={typeof status === "string" ? status : "all"} />
    </>
  );
}
