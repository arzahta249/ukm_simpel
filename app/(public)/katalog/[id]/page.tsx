import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, MessageSquareQuote } from "lucide-react";
import { EssayContentView } from "@/components/essay-content-view";
import { Avatar, SectionCard, StatusBadge } from "@/components/ui";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KatalogDetailPage({ params }: PageProps<"/katalog/[id]">) {
  const { id } = await params;
  const [db, session] = await Promise.all([readDb(), getSessionUser()]);
  const s = db.submissions.find((x) => x.id === Number(id));
  if (!s) notFound();

  const canViewPrivate =
    s.visibilitas !== "privat" ||
    (session && (session.id === s.user_id || session.role === "admin" || session.role === "juri"));
  if (!canViewPrivate) notFound();

  const ev = db.events.find((e) => e.id === s.event_id);
  const cat = db.categories.find((c) => c.id === ev?.category_id);
  const author = db.users.find((u) => u.id === s.user_id);
  const memberList = db.submission_members.filter((m) => m.submission_id === s.id);
  const fileList = db.submission_files.filter((f) => f.submission_id === s.id);
  const assignIds = db.review_assignments.filter((a) => a.submission_id === s.id).map((a) => a.id);
  const subReviews = db.reviews.filter((r) => assignIds.includes(r.assignment_id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/#katalog"
        className="mb-6 inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted hover:text-forest-800"
      >
        <ArrowLeft className="size-3.5" /> Kembali ke Katalog Karya Terbit
      </Link>

      <article className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-forest-950 px-6 py-3.5 text-white">
          <span className="font-mono text-xs text-gold-300">
            {ev?.volume} · {cat?.nama ?? "Karya Ilmiah"}
            {s.topik ? ` · ${s.topik}` : ""}
          </span>
          <span className="font-mono text-xs text-forest-200">KODE ARSIP: SMPL-2026-0{s.id}</span>
        </div>

        {s.cover_image && (
          <img src={s.cover_image} alt={s.judul} className="h-60 w-full object-cover sm:h-72" />
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={s.status} />
            <span className="font-mono text-xs text-muted">Diterbitkan {formatDate(s.submitted_at)}</span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold leading-snug text-forest-950 sm:text-4xl">{s.judul}</h1>
          {s.subjudul && <p className="mt-2 text-base text-muted sm:text-lg">{s.subjudul}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-line py-3 text-xs text-muted">
            <span>
              Penulis Utama: <strong className="text-ink">{memberList[0]?.nama || author?.nama}</strong>
            </span>
            {(memberList[0]?.institusi || author?.institusi) && (
              <>
                <span>·</span>
                <span>{memberList[0]?.institusi || author?.institusi}</span>
              </>
            )}
            {s.prodi && (
              <>
                <span>·</span>
                <span>{s.prodi}</span>
              </>
            )}
            {s.skor_akhir && (
              <>
                <span>·</span>
                <span className="font-mono font-bold text-forest-800">Skor Kurasi: {s.skor_akhir} / 100</span>
              </>
            )}
          </div>

          <div className="mt-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-forest-800">
              Deskripsi Singkat
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/90 sm:text-base">{s.abstrak}</p>
          </div>

          {s.kata_kunci && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {s.kata_kunci
                .split(",")
                .filter(Boolean)
                .map((k) => (
                  <span
                    key={k}
                    className="rounded border border-line bg-paper px-2.5 py-1 font-mono text-xs text-forest-900"
                  >
                    #{k.trim()}
                  </span>
                ))}
            </div>
          )}

          {s.isi_essay && (
            <div className="mt-8 border-t border-line pt-7">
              <EssayContentView isiEssay={s.isi_essay} jenisRiset={s.jenis_riset} />
            </div>
          )}
        </div>
      </article>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {fileList.length > 0 && (
            <SectionCard title="Lampiran Berkas Naskah">
              <ul className="divide-y divide-line">
                {fileList.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md border border-line bg-paper text-forest-800">
                        <FileText className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{f.jenis_berkas}</p>
                        <p className="font-mono text-xs text-muted">
                          {f.size} · versi {f.versi}
                        </p>
                      </div>
                    </div>
                    {f.file_path.startsWith("/uploads/") ? (
                      <a href={f.file_path} download className="btn btn-outline btn-sm">
                        <Download className="size-3.5" /> Unduh PDF
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-muted">Tersimpan di Arsip SIMPEL</span>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {subReviews.length > 0 && (
            <SectionCard title="Catatan Kurasi Reviewer" action={<MessageSquareQuote className="size-4 text-muted" />}>
              <div className="space-y-3 p-6">
                {subReviews.map((r, i) => (
                  <blockquote key={r.id} className="border-l-2 border-forest-700 bg-paper p-4">
                    <p className="text-sm leading-relaxed text-ink/85">&ldquo;{r.komentar}&rdquo;</p>
                    <footer className="mt-1.5 font-mono text-xs text-muted">
                      — Reviewer 0{i + 1} · Skor {r.total_skor} ({r.rekomendasi})
                    </footer>
                  </blockquote>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        <SectionCard title="Profil Penulis" className="h-fit">
          <ul className="divide-y divide-line">
            {(memberList.length
              ? memberList
              : [
                  {
                    id: 1,
                    nama: author?.nama || "Penulis SIMPEL",
                    institusi: author?.institusi || "Universitas Pancasakti Tegal",
                    email: author?.email || "",
                    peran: "Ketua" as const,
                  },
                ]
            ).map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={m.nama} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{m.nama}</p>
                  <p className="truncate text-[11px] text-muted">{m.institusi}</p>
                </div>
                <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-forest-900">
                  {m.peran}
                </span>
              </li>
            ))}
          </ul>
          {s.bio && (
            <div className="border-t border-line px-5 py-4 text-xs leading-relaxed text-muted">
              <p className="mb-1 font-mono text-[10px] font-bold uppercase text-forest-800">Bio Penulis</p>
              <p>{s.bio}</p>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
