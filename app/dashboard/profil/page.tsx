import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Avatar, PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { ProfilForms } from "./profil-forms";

export const metadata: Metadata = { title: "Profil Penulis" };
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const [db, session] = await Promise.all([readDb(), getSessionUser()]);
  if (!session) redirect("/login?next=/dashboard/profil");

  const dbUser = db.users.find((u) => u.id === session.id);
  const u = dbUser ?? {
    id: session.id,
    nama: session.nama,
    email: session.email,
    role: session.role,
    institusi: session.institusi || "Universitas Pancasakti Tegal",
    nim_nisn: session.nim_nisn || "-",
    no_hp: session.no_hp || "-",
    created_at: "2026-10-01",
  };

  const mySubs = db.submissions.filter((s) => s.user_id === u.id);
  const myPublished = mySubs.filter((s) => s.status === "lolos" || s.status === "juara");

  return (
    <>
      <PageHeader
        eyebrow="IDENTITAS AKADEMIK"
        title="Profil Penulis"
        description="Data penulis yang tercantum pada metadata publikasi karya tulis ilmiah."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card h-fit p-6">
          <div className="flex items-center gap-4 border-b border-line pb-5">
            <Avatar name={u.nama} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-forest-950">{u.nama}</h2>
              <p className="truncate text-xs text-muted">{u.institusi}</p>
              <span className="mt-1.5 inline-block rounded border border-forest-300 bg-forest-50 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-forest-800">
                ROLE: {u.role.toUpperCase()}
              </span>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-3 divide-x divide-line border border-line bg-paper py-3 text-center">
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted">Naskah</dt>
              <dd className="font-display text-xl font-semibold text-forest-950">{mySubs.length}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-muted">Terbit</dt>
              <dd className="font-display text-xl font-semibold text-forest-950">{myPublished.length}</dd>
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
