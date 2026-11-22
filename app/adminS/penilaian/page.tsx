import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { PenilaianClient } from "./penilaian-client";

export const metadata: Metadata = { title: "Lembar Penilaian Reviewer / Juri" };
export const dynamic = "force-dynamic";

export default async function PenilaianJuriPage() {
  const db = await readDb();
  const juries = db.users.filter((u) => u.role === "juri");
  const reviewable = db.submissions
    .filter((s) => ["desk_review", "review", "lolos", "juara", "revisi"].includes(s.status))
    .map((s) => {
      const u = db.users.find((x) => x.id === s.user_id);
      const ev = db.events.find((e) => e.id === s.event_id);
      const crit = db.criteria.filter((c) => c.event_id === s.event_id);
      return {
        ...s,
        authorName: u?.nama || "Penulis",
        authorInstitusi: u?.institusi || "",
        eventName: ev?.nama || "",
        volume: ev?.volume || "",
        criteria: crit.length
          ? crit
          : [
              { id: 1, event_id: s.event_id, nama: "Orisinalitas & Kebaruan Gagasan", bobot: 30 },
              { id: 2, event_id: s.event_id, nama: "Kedalaman Substansi & Relevansi Tema", bobot: 30 },
              { id: 3, event_id: s.event_id, nama: "Ketepatan Metodologi & Referensi", bobot: 20 },
              { id: 4, event_id: s.event_id, nama: "Sistematika & Kaidah Bahasa Ilmiah", bobot: 20 },
            ],
      };
    });

  return (
    <>
      <PageHeader
        eyebrow="TAHAP 5 ALUR ADMIN · TABEL REVIEWS &amp; REVIEW_SCORES"
        title="Lembar Penilaian Reviewer / Juri"
        description="Input skor per kriteria berbobot (0–100), catatan komentar telaah, serta rekomendasi kelayakan terbit."
      />
      <PenilaianClient submissions={reviewable} juries={juries} />
    </>
  );
}
