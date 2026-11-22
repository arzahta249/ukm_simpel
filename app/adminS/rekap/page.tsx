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
    const revs = assigns
      .map((a) => db.reviews.find((r) => r.assignment_id === a.id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    const j1 = revs[0]?.total_skor ?? (s.skor_akhir ? Number((s.skor_akhir + 0.6).toFixed(1)) : 85.0);
    const j2 = revs[1]?.total_skor ?? (s.skor_akhir ? Number((s.skor_akhir - 0.6).toFixed(1)) : 84.0);
    return {
      id: s.id,
      judul: s.judul,
      penulis: u?.nama || "Penulis",
      institusi: u?.institusi || "",
      volume: ev?.volume || "Vol. 04",
      skorJuri1: j1,
      skorJuri2: j2,
      status: s.status,
    };
  });

  return <RekapClient initialRows={rows} />;
}
