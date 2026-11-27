import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CalendarDays, PenLine, Plus } from "lucide-react";
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
        title="Naskah Saya (Essay, Makalah &amp; Jurnal)"
        description="Kelola draft naskah yang belum diajukan, edit kembali kapan saja, atau pantau status publikasi karya ilmiah Anda."
        actions={
          <Link href="/dashboard/submit" className="btn btn-primary">
            <Plus className="size-4" /> Ajukan Naskah Baru
          </Link>
        }
      />

      {mine.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mine.map((s) => {
            const ev = db.events.find((e) => e.id === s.event_id);
            const isDraft = s.status === "draft";
            return (
              <div key={s.id} className="card card-hover group flex flex-col justify-between overflow-hidden">
                {s.cover_image && (
                  <img src={s.cover_image} alt={s.judul} className="h-36 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                      <StatusBadge status={s.status} />
                      <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
                        {s.topik && (
                          <span className="rounded bg-paper px-2 py-0.5 text-[10.5px] font-semibold text-forest-800">
                            {s.topik}
                          </span>
                        )}
                        <span>SMPL-{s.id}</span>
                      </div>
                    </div>
                    <p className="mt-4 font-mono text-xs font-semibold text-forest-700">
                      {ev?.volume} · {ev?.nama}
                    </p>
                    <Link
                      href={isDraft ? `/dashboard/submit?edit=${s.id}` : `/dashboard/karya/${s.id}`}
                      className="mt-1.5 line-clamp-2 block text-lg font-semibold leading-snug text-forest-950 group-hover:text-forest-700"
                    >
                      {s.judul}
                    </Link>
                    {s.subjudul && <p className="mt-1 line-clamp-1 text-xs font-medium text-ink/70">{s.subjudul}</p>}
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">{s.abstrak}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-2 border-t border-line pt-4 font-mono text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-forest-700" /> {formatShortDate(s.submitted_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      {isDraft && (
                        <Link href={`/dashboard/submit?edit=${s.id}`} className="btn btn-primary btn-sm">
                          <PenLine className="size-3.5" /> Edit Draft
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/karya/${s.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-forest-800 hover:underline"
                      >
                        Detail <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-base font-semibold text-forest-950">Belum ada makalah atau artikel jurnal</p>
          <p className="mt-1 text-xs text-muted">Unggah dokumen PDF atau lengkapi struktur naskah Anda dan simpan sebagai draft.</p>
          <Link href="/dashboard/submit" className="btn btn-primary mt-4">
            <Plus className="size-4" /> Ajukan Naskah Baru
          </Link>
        </div>
      )}
    </>
  );
}
