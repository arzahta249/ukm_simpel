import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, FileText, Star } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { ReviewerWorkspace } from "./reviewer-workspace";

export const metadata: Metadata = { title: "Tugas Penilaian Reviewer" };
export const dynamic = "force-dynamic";

export default async function ReviewerPage() {
  const [db, session] = await Promise.all([readDb(), getSessionUser()]);
  if (!session || session.role !== "juri") redirect("/login?next=/reviewer");

  const activeJuriId = session.id;

  const myAssignments = db.review_assignments.filter((a) => a.juri_id === activeJuriId);
  const assignedSubIds = new Set(myAssignments.map((a) => a.submission_id));

  const assignedSubmissions = db.submissions
    .filter((s) => assignedSubIds.has(s.id))
    .map((s) => {
      const u = db.users.find((x) => x.id === s.user_id);
      const ev = db.events.find((e) => e.id === s.event_id);
      const cat = db.categories.find((c) => c.id === ev?.category_id);
      const crit = db.criteria.filter((c) => c.event_id === s.event_id);
      const files = db.submission_files.filter((f) => f.submission_id === s.id);
      const members = db.submission_members.filter((m) => m.submission_id === s.id);
      const allAssigns = db.review_assignments.filter((a) => a.submission_id === s.id);
      const assignment = myAssignments.find((a) => a.submission_id === s.id)!;
      const existingReview = db.reviews.find((r) => r.assignment_id === assignment.id) ?? null;

      return {
        ...s,
        authorName: u?.nama || "Penulis",
        authorInstitusi: u?.institusi || "",
        eventName: ev?.nama || "",
        volume: ev?.volume || "",
        maxHalaman: ev?.max_halaman || 15,
        categoryName: cat?.nama || "Naskah",
        assignmentStatus: assignment.status,
        assignedAt: assignment.assigned_at,
        totalReviewers: allAssigns.length,
        completedReviewers: allAssigns.filter((a) => a.status === "dinilai").length,
        existingReview,
        files,
        members,
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

  const doneAssignments = myAssignments.filter((a) => a.status === "dinilai");
  const doneCount = doneAssignments.length;
  const pendingCount = myAssignments.filter((a) => a.status === "pending").length;
  const myScores = doneAssignments
    .map((a) => db.reviews.find((r) => r.assignment_id === a.id)?.total_skor)
    .filter((n): n is number => typeof n === "number");
  const avgGiven = myScores.length ? (myScores.reduce((a, b) => a + b, 0) / myScores.length).toFixed(1) : "—";

  return (
    <>
      <PageHeader
        eyebrow={`PANEL REVIEWER · ${session.nama}`}
        title="Tugas Penilaian Naskah"
        description="Baca abstrak dan berkas PDF naskah yang ditugaskan Editor kepada Anda, lalu berikan skor per kriteria, komentar, dan rekomendasi."
      />

      {/* Indikator Alur 3 Role */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-sheet p-3 sm:grid-cols-4 sm:p-4">
        {[
          { step: "1", title: "Penulis Unggah", sub: "Upload PDF & metadata", active: false },
          { step: "2", title: "Editor Desk Eval", sub: "Cek format & tugaskan", active: false },
          { step: "3", title: "Reviewer Menilai", sub: "Posisi Anda saat ini", active: true },
          { step: "4", title: "Editor Terbitkan", sub: "Rekap & publikasi", active: false },
        ].map((item) => (
          <div
            key={item.step}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${
              item.active ? "bg-forest-950 text-white" : "bg-paper/70 text-muted"
            }`}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                item.active ? "bg-gold-400 text-forest-950" : "bg-sheet text-forest-900 ring-1 ring-line"
              }`}
            >
              {item.step}
            </span>
            <div className="min-w-0">
              <p className={`truncate text-xs font-bold ${item.active ? "text-gold-200" : "text-ink"}`}>{item.title}</p>
              <p className={`truncate text-[10.5px] ${item.active ? "text-forest-200/80" : "text-muted"}`}>
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Ditugaskan"
          value={myAssignments.length}
          icon={<FileText className="size-4" />}
          tone="neutral"
        />
        <StatCard label="Menunggu Nilai" value={pendingCount} icon={<Clock3 className="size-4" />} tone="gold" />
        <StatCard label="Selesai Dinilai" value={doneCount} icon={<CheckCircle2 className="size-4" />} tone="forest" />
        <StatCard label="Rata-rata Skor Anda" value={avgGiven} icon={<Star className="size-4" />} tone="neutral" />
      </div>

      <ReviewerWorkspace juriId={activeJuriId} submissions={assignedSubmissions} />
    </>
  );
}
