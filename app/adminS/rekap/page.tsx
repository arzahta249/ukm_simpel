import type { Metadata } from "next";
import { readDb } from "@/lib/db";
import { RekapClient, type RecapRow } from "./rekap-client";

export const metadata: Metadata = { title: "Rekapitulasi Skor Akhir & Penerbitan" };
export const dynamic = "force-dynamic";

export default async function RekapNilaiPage() {
  const db = await readDb();

  const rows: RecapRow[] = db.submissions.map((s) => {
    const u = db.users.find((x) => x.id === s.user_id);
    const ev = db.events.find((e) => e.id === s.event_id);
    const assigns = db.review_assignments.filter((a) => a.submission_id === s.id);
    const reviewItems = assigns.map((a) => {
      const reviewer = db.users.find((j) => j.id === a.juri_id);
      const rev = db.reviews.find((r) => r.assignment_id === a.id);
      return {
        reviewerName: reviewer?.nama || "Reviewer",
        status: a.status,
        skor: rev ? rev.total_skor : null,
        rekomendasi: rev ? rev.rekomendasi : null,
      };
    });

    const scored = reviewItems.map((r) => r.skor).filter((n): n is number => n !== null);
    const computedAvg = scored.length
      ? Number((scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(2))
      : s.skor_akhir;

    return {
      id: s.id,
      judul: s.judul,
      penulis: u?.nama || "Penulis",
      institusi: u?.institusi || "",
      volume: ev?.volume || "Vol. 04",
      reviews: reviewItems,
      avgSkor: computedAvg,
      status: s.status,
    };
  });

  return <RekapClient initialRows={rows} />;
}
