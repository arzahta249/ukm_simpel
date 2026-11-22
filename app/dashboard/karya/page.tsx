import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CalendarDays, Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { formatShortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Naskah Saya" };
export const dynamic = "force-dynamic";

export default async function KaryaPage() {
  const [db, session] = await Promise.all([readDb(), getSessionUser()]);
  if (!session) redirect("/login?next=/dashboard/karya");

  const mine =
    session.role === "admin"
      ? db.submissions
      : db.submissions.filter((s) => s.user_id === session.id);

  return (
    <>
      <PageHeader
        eyebrow="ARSIP PENULIS"
        title="Naskah Saya"
        description="Daftar seluruh karya tulis ilmiah dan essay yang Anda ajukan beserta status evaluasinya."
        actions={
          <Link href="/dashboard/submit" className="btn btn-primary">
            <Plus className="size-4" /> Unggah Naskah Baru
          </Link>
        }
      />

      {mine.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mine.map((s) => {
            const ev = db.events.find((e) => e.id === s.event_id);
            return (
              <Link
                key={s.id}
                href={`/dashboard/karya/${s.id}`}
                className="card card-hover group flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                    <StatusBadge status={s.status} />
                    <span className="font-mono text-xs text-muted">SMPL-{s.id}</span>
                  </div>
                  <p className="mt-4 font-mono text-xs font-semibold text-forest-700">
                    {ev?.volume} · {ev?.nama}
                  </p>
                  <h3 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug text-forest-950 group-hover:text-forest-700">
                    {s.judul}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">{s.abstrak}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line pt-4 font-mono text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-forest-700" /> {formatShortDate(s.submitted_at)}
                  </span>
                  {s.skor_akhir ? (
                    <span className="font-semibold text-forest-900">Skor: {s.skor_akhir}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-forest-800">
                      Detail <ArrowUpRight className="size-3.5" />
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-base font-semibold text-forest-950">Belum ada naskah yang diunggah</p>
          <p className="mt-1 text-xs text-muted">Unggah naskah PDF Anda untuk memulai proses kurasi.</p>
          <Link href="/dashboard/submit" className="btn btn-primary mt-4">
            <Plus className="size-4" /> Unggah Naskah Baru
          </Link>
        </div>
      )}
    </>
  );
}
