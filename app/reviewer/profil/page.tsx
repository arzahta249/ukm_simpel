import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Avatar, PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { ProfilForms } from "@/app/dashboard/profil/profil-forms";

export const metadata: Metadata = { title: "Profil Reviewer" };
export const dynamic = "force-dynamic";

export default async function ReviewerProfilPage() {
  const [db, session] = await Promise.all([readDb(), getSessionUser()]);
  if (!session || session.role !== "juri") redirect("/login?next=/reviewer/profil");

  const dbUser = db.users.find((u) => u.id === session.id);
  const u = dbUser ?? {
    id: session.id,
    nama: session.nama,
    email: session.email,
    role: session.role,
    institusi: session.institusi || "Universitas Pancasakti Tegal",
    nim_nisn: session.nim_nisn || "-",
    no_hp: session.no_hp || "-",
    created_at: "2026-09-01",
  };

  const myAssignments = db.review_assignments.filter((a) => a.juri_id === u.id);
  const doneCount = myAssignments.filter((a) => a.status === "dinilai").length;

  return (
    <>
      <PageHeader
        eyebrow="IDENTITAS REVIEWER"
        title="Profil &amp; Keamanan Akun Reviewer"
        description="Akun Reviewer dibuat oleh Editor. Anda dapat memperbarui biodata dan mengganti kata sandi Anda di sini."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card h-fit p-6">
          <div className="flex items-center gap-4 border-b border-line pb-5">
            <Avatar name={u.nama} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-forest-950">{u.nama}</h2>
              <p className="truncate text-xs text-muted">{u.institusi}</p>
              <span className="mt-1.5 inline-block rounded border border-gold-300 bg-gold-50 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-forest-950">
                ROLE: REVIEWER / JURI
              </span>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-3 divide-x divide-line border border-line bg-paper py-3 text-center">
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted">Tugas</dt>
              <dd className="font-display text-xl font-semibold text-forest-950">{myAssignments.length}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted">Selesai</dt>
              <dd className="font-display text-xl font-semibold text-forest-950">{doneCount}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted">Terdaftar</dt>
              <dd className="font-mono text-xs font-semibold leading-7 text-forest-900">
                {formatDate(u.created_at, { month: "short", year: "numeric" })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <ProfilForms user={u} />
        </div>
      </div>
    </>
  );
}
