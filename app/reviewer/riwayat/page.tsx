import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, MessageSquareQuote } from "lucide-react";
import { PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Riwayat Penilaian Reviewer" };
export const dynamic = "force-dynamic";

export default async function ReviewerRiwayatPage() {
  const [db, session] = await Promise.all([readDb(), getSessionUser()]);
  if (!session || session.role !== "juri") redirect("/login?next=/reviewer/riwayat");

  const activeJuriId = session.id;

  const completed = db.review_assignments
    .filter((a) => a.juri_id === activeJuriId && a.status === "dinilai")
    .map((a) => {
      const sub = db.submissions.find((s) => s.id === a.submission_id);
      const rev = db.reviews.find((r) => r.assignment_id === a.id);
      const ev = db.events.find((e) => e.id === sub?.event_id);
      const cat = db.categories.find((c) => c.id === ev?.category_id);
      const author = db.users.find((u) => u.id === sub?.user_id);
      const crit = db.criteria.filter((c) => c.event_id === sub?.event_id);
      return { assignment: a, sub, rev, ev, cat, author, crit };
    })
    .filter((x) => x.sub && x.rev);

  return (
    <>
      <PageHeader
        eyebrow="ARSIP PENILAIAN SAYA"
        title="Riwayat Penilaian Reviewer"
        description="Daftar seluruh naskah yang telah Anda nilai beserta rincian skor kriteria, komentar, rekomendasi, dan keputusan akhir Editor."
        actions={
          <Link href="/reviewer" className="btn btn-primary">
            Ke Tugas Penilaian <ArrowRight className="size-4" />
          </Link>
        }
      />

      {completed.length > 0 ? (
        <div className="space-y-5">
          {completed.map(({ assignment, sub, rev, ev, cat, author, crit }) => (
            <SectionCard
              key={assignment.id}
              title={`SMPL-${sub!.id} · ${sub!.judul}`}
              description={`${cat?.nama || "Naskah"} · ${ev?.volume} · Penulis: ${author?.nama} (${author?.institusi})`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={sub!.status} />
                  <span className="rounded-lg bg-forest-950 px-3 py-1 font-mono text-xs font-bold text-gold-300">
                    Skor Anda: {rev!.total_skor}
                  </span>
                </div>
              }
            >
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-12">
                <div className="space-y-2.5 lg:col-span-6">
                  <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-muted">
                    Rincian Nilai per Kriteria
                  </p>
                  {crit.map((c, idx) => {
                    const found = rev!.scores.find((sc) => sc.criteria_id === c.id) ?? rev!.scores[idx];
                    const scoreVal = found?.skor ?? rev!.total_skor;
                    return (
                      <div key={c.id} className="flex items-center gap-3 text-xs">
                        <span className="w-48 shrink-0 truncate font-medium text-ink">{c.nama}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-dark">
                          <div className="h-full rounded-full bg-forest-700" style={{ width: `${scoreVal}%` }} />
                        </div>
                        <span className="w-10 text-right font-mono font-bold text-forest-900">{scoreVal}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-paper p-4 lg:col-span-6">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-forest-800">
                        <MessageSquareQuote className="size-3.5" /> Komentar Telaah Anda
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-forest-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-forest-900">
                        <CheckCircle2 className="size-3" /> Rekomendasi: {rev!.rekomendasi}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink/85">&ldquo;{rev!.komentar}&rdquo;</p>
                  </div>
                  <p className="font-mono text-[11px] text-muted">
                    Ditugaskan: {assignment.assigned_at} · Status naskah saat ini:{" "}
                    <strong className="text-forest-900">{sub!.status.toUpperCase()}</strong>
                  </p>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-base font-semibold text-forest-950">Belum ada riwayat penilaian yang selesai</p>
          <p className="mt-1 text-xs text-muted">
            Setelah Anda menilai naskah di halaman Tugas Penilaian, arsip penilaian Anda akan tercatat di sini.
          </p>
          <Link href="/reviewer" className="btn btn-primary mt-4">
            Buka Tugas Penilaian
          </Link>
        </div>
      )}
    </>
  );
}
