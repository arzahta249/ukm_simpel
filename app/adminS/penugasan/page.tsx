import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { PenugasanClient } from "./penugasan-client";

export const metadata: Metadata = { title: "Penugasan Reviewer / Juri" };
export const dynamic = "force-dynamic";

export default async function PenugasanJuriPage() {
  const db = await readDb();
  const juries = db.users.filter((u) => u.role === "juri");
  const eligible = db.submissions.filter((s) =>
    ["submitted", "desk_review", "review", "lolos", "juara", "revisi"].includes(s.status),
  );

  const initialMap: Record<number, string[]> = {};
  for (const s of eligible) {
    initialMap[s.id] = db.review_assignments.filter((a) => a.submission_id === s.id).map((a) => a.juri_id);
  }

  const enriched = eligible.map((s) => {
    const author = db.users.find((u) => u.id === s.user_id);
    const ev = db.events.find((e) => e.id === s.event_id);
    return {
      ...s,
      authorName: author?.nama || "Penulis",
      authorInstitusi: author?.institusi || "",
      volume: ev?.volume || "Vol. 04",
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="TAHAP 4 ALUR ADMIN · TABEL REVIEW_ASSIGNMENTS"
        title="Penugasan Reviewer / Juri"
        description="Tugaskan hingga maksimal 4 reviewer/juri untuk setiap naskah yang telah lolos Desk Evaluation."
      />
      <PenugasanClient submissions={enriched} juries={juries} initialMap={initialMap} />
    </>
  );
}
