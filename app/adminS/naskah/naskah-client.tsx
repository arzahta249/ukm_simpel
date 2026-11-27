"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Download, FileText, Globe, Lock, Search } from "lucide-react";
import { Avatar, StatusBadge } from "@/components/ui";
import type { SubmissionStatus } from "@/lib/data";
import { formatShortDate } from "@/lib/utils";
import { DeleteSubmissionButton } from "./delete-submission-button";

export interface IncomingRow {
  id: number;
  judul: string;
  subjudul?: string;
  topik?: string;
  jenis_riset?: string;
  abstrak: string;
  visibilitas?: "publik" | "privat";
  prodi?: string;
  status: SubmissionStatus;
  submitted_at: string;
  categoryName: string;
  volume: string;
  authorName: string;
  authorEmail: string;
  authorInstitusi: string;
  memberCount: number;
  fileCount: number;
  primaryPdfPath?: string;
  hasStructuredText: boolean;
}

const FILTER_STATUSES: Array<{ key: "all" | SubmissionStatus; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "submitted", label: "Menunggu" },
  { key: "desk_review", label: "Desk Eval" },
  { key: "review", label: "Ditinjau" },
  { key: "revisi", label: "Revisi" },
  { key: "lolos", label: "Terbit" },
  { key: "juara", label: "Pilihan Editor" },
  { key: "tidak_lolos", label: "Ditolak" },
  { key: "draft", label: "Draft" },
];

export function NaskahClient({
  rows,
  categories,
  initialStatus = "all",
}: {
  rows: IncomingRow[];
  categories: string[];
  initialStatus?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = rows.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchCat = catFilter === "all" || r.categoryName === catFilter;
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      r.judul.toLowerCase().includes(q) ||
      (r.subjudul || "").toLowerCase().includes(q) ||
      (r.topik || "").toLowerCase().includes(q) ||
      r.authorName.toLowerCase().includes(q) ||
      r.authorEmail.toLowerCase().includes(q) ||
      `smpl-${r.id}`.includes(q);
    return matchStatus && matchCat && matchQ;
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul, penulis, email, bidang, atau SMPL-..."
            className="input !pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCatFilter(c)}
              className={`rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                catFilter === c
                  ? "bg-forest-800 text-white"
                  : "border border-line-strong bg-sheet text-muted hover:border-forest-700"
              }`}
            >
              {c === "all" ? "Semua Jenis" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTER_STATUSES.map((f) => {
          const isCurrent = statusFilter === f.key;
          const cnt = f.key === "all" ? rows.length : rows.filter((r) => r.status === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                isCurrent
                  ? "bg-forest-950 text-white"
                  : "border border-line-strong bg-sheet text-muted hover:border-forest-700"
              }`}
            >
              {f.label} ({cnt})
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        {filtered.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Data Penulisan &amp; Jenis</th>
                    <th>Identitas Penulis</th>
                    <th>Berkas &amp; Visibilitas</th>
                    <th>Status</th>
                    <th className="text-right">Aksi Editor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs font-semibold text-forest-900">SMPL-{s.id}</td>
                      <td className="max-w-sm">
                        <Link
                          href={`/adminS/naskah/${s.id}`}
                          className="line-clamp-1 font-semibold text-ink hover:text-forest-700"
                        >
                          {s.judul}
                        </Link>
                        {s.subjudul && <p className="line-clamp-1 text-xs text-muted">{s.subjudul}</p>}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
                          <span className="rounded bg-forest-50 px-1.5 py-0.5 font-bold text-forest-800">
                            {s.categoryName}
                          </span>
                          {s.topik && (
                            <span className="rounded bg-paper px-1.5 py-0.5 text-muted ring-1 ring-line">
                              {s.topik}
                            </span>
                          )}
                          {s.jenis_riset && (
                            <span className="rounded bg-gold-50 px-1.5 py-0.5 text-forest-900">
                              {s.jenis_riset}
                            </span>
                          )}
                          <span className="text-muted">· {formatShortDate(s.submitted_at)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={s.authorName} size="sm" />
                          <div className="leading-tight">
                            <p className="text-xs font-semibold text-ink">
                              {s.authorName}{" "}
                              {s.memberCount > 1 && (
                                <span className="font-mono text-[10px] text-forest-700">+{s.memberCount - 1}</span>
                              )}
                            </p>
                            <p className="font-mono text-[10.5px] text-muted">{s.authorEmail}</p>
                            <p className="text-[11px] text-muted">
                              {s.authorInstitusi}
                              {s.prodi ? ` · ${s.prodi}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <FileText className="size-3.5 text-forest-700" />
                            <span>{s.fileCount} PDF</span>
                            {s.primaryPdfPath && (
                              <a
                                href={s.primaryPdfPath}
                                download
                                className="text-forest-800 underline hover:text-forest-600"
                                title="Unduh PDF"
                              >
                                <Download className="inline size-3" />
                              </a>
                            )}
                          </div>
                          {s.hasStructuredText && (
                            <span className="inline-block rounded bg-paper px-1.5 py-0.5 text-[10px] text-forest-800 ring-1 ring-line">
                              Ada Struktur Teks
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-[10.5px] text-muted">
                            {s.visibilitas === "privat" ? (
                              <>
                                <Lock className="size-3" /> Privat
                              </>
                            ) : (
                              <>
                                <Globe className="size-3" /> Publik
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link href={`/adminS/naskah/${s.id}`} className="btn btn-outline btn-sm">
                            Periksa <ArrowUpRight className="size-3.5" />
                          </Link>
                          <DeleteSubmissionButton submissionId={s.id} compact />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line md:hidden">
              {filtered.map((s) => (
                <div key={s.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-forest-800">
                      SMPL-{s.id} · {s.categoryName}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <Link href={`/adminS/naskah/${s.id}`} className="mt-2 block text-sm font-semibold text-forest-950">
                    {s.judul}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {s.authorName} ({s.authorEmail}) · {s.topik || s.volume}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                    <span className="font-mono text-[11px] text-muted">
                      {s.fileCount} PDF · {formatShortDate(s.submitted_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/adminS/naskah/${s.id}`} className="btn btn-outline btn-sm">
                        Periksa <ArrowUpRight className="size-3.5" />
                      </Link>
                      <DeleteSubmissionButton submissionId={s.id} compact />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-10 text-center text-xs text-muted">
            Tidak ada data penulisan yang cocok dengan pencarian atau filter.
          </div>
        )}
      </div>

      <p className="mt-4 font-mono text-xs text-muted">
        Menampilkan {filtered.length} dari {rows.length} naskah masuk.
      </p>
    </>
  );
}
