"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, UserCheck, Users } from "lucide-react";
import { Avatar, SectionCard, StatusBadge } from "@/components/ui";
import type { Submission, User } from "@/lib/data";
import { assignJuriAction } from "@/app/actions";

const MAX_REVIEWERS = 4;

type EnrichedSub = Submission & { authorName: string; authorInstitusi: string; volume: string };

export function PenugasanClient({
  submissions,
  juries,
  initialMap,
}: {
  submissions: EnrichedSub[];
  juries: User[];
  initialMap: Record<number, string[]>;
}) {
  const router = useRouter();
  const [assignMap, setAssignMap] = useState<Record<number, string[]>>(initialMap);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [errorMap, setErrorMap] = useState<Record<number, string>>({});

  function toggleJuri(subId: number, juriId: string) {
    const current = assignMap[subId] ?? [];
    if (!current.includes(juriId) && current.length >= MAX_REVIEWERS) {
      setErrorMap({ ...errorMap, [subId]: `Maksimal ${MAX_REVIEWERS} reviewer per naskah.` });
      return;
    }
    const next = current.includes(juriId) ? current.filter((x) => x !== juriId) : [...current, juriId];
    setAssignMap({ ...assignMap, [subId]: next });
    setSavedId(null);
    if (errorMap[subId]) {
      const copy = { ...errorMap };
      delete copy[subId];
      setErrorMap(copy);
    }
  }

  async function save(subId: number) {
    const selected = assignMap[subId] ?? [];
    if (selected.length < 1 || selected.length > MAX_REVIEWERS) return;
    setSavingId(subId);
    const res = await assignJuriAction(subId, selected);
    setSavingId(null);
    if (!res.ok) {
      setErrorMap({ ...errorMap, [subId]: res.error || "Gagal menyimpan penugasan." });
      return;
    }
    setSavedId(subId);
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {juries.map((j) => {
          const totalAssigned = Object.values(assignMap).filter((list) => list.includes(j.id)).length;
          return (
            <div key={j.id} className="card flex items-center gap-3.5 p-4">
              <Avatar name={j.nama} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{j.nama}</p>
                <p className="font-mono text-xs text-muted">{j.nim_nisn}</p>
              </div>
              <div className="text-right">
                <span className="font-display text-2xl font-semibold text-forest-900">{totalAssigned}</span>
                <p className="font-mono text-[10px] uppercase text-muted">Naskah</p>
              </div>
            </div>
          );
        })}
      </div>

      <SectionCard
        title="Matriks Penugasan Reviewer per Naskah"
        description={`Pilih 1 hingga maksimal ${MAX_REVIEWERS} reviewer/juri pada setiap naskah lalu simpan penugasan ke database`}
      >
        <div className="divide-y divide-line">
          {submissions.map((s) => {
            const selected = assignMap[s.id] ?? [];
            const validCount = selected.length >= 1 && selected.length <= MAX_REVIEWERS;
            const full = selected.length >= MAX_REVIEWERS;

            return (
              <div key={s.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-forest-800">SMPL-{s.id}</span>
                      <StatusBadge status={s.status} />
                      <span className="font-mono text-xs text-muted">· {s.volume}</span>
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-forest-950">{s.judul}</h3>
                    <p className="mt-0.5 text-xs text-muted">
                      Penulis: {s.authorName} ({s.authorInstitusi})
                    </p>
                  </div>

                  <span
                    className={`rounded px-2.5 py-1 font-mono text-xs font-bold ${
                      validCount
                        ? "bg-forest-50 text-forest-800 ring-1 ring-forest-300"
                        : "bg-amber-50 text-amber-900 ring-1 ring-amber-300"
                    }`}
                  >
                    <Users className="mr-1 inline size-3.5" />
                    {selected.length} / {MAX_REVIEWERS} Reviewer Terpilih
                  </span>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {juries.map((j) => {
                    const active = selected.includes(j.id);
                    const disabled = !active && full;
                    return (
                      <button
                        key={j.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleJuri(s.id, j.id)}
                        className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-xs transition-colors ${
                          active
                            ? "border-forest-700 bg-forest-50/80 text-forest-950"
                            : disabled
                              ? "cursor-not-allowed border-line bg-paper/30 text-muted opacity-50"
                              : "border-line bg-paper/50 text-muted hover:border-forest-400"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{j.nama}</p>
                          <p className="truncate font-mono text-[10.5px] text-muted">{j.email}</p>
                        </div>
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded ${
                            active ? "bg-forest-700 text-white" : "border border-line-strong bg-white"
                          }`}
                        >
                          {active && <Check className="size-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted">
                    {selected.length === 0
                      ? `Pilih 1 hingga maksimal ${MAX_REVIEWERS} reviewer.`
                      : full
                        ? `Batas maksimal ${MAX_REVIEWERS} reviewer tercapai.`
                        : `${selected.length} reviewer terpilih (maksimal ${MAX_REVIEWERS} orang per naskah).`}
                  </p>
                  <button
                    type="button"
                    disabled={!validCount || savingId === s.id}
                    onClick={() => save(s.id)}
                    className="btn btn-primary btn-sm"
                  >
                    {savingId === s.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="size-3.5" />
                    )}{" "}
                    Simpan Penugasan
                  </button>
                </div>

                {errorMap[s.id] && (
                  <p className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 font-mono text-xs text-red-800">
                    {errorMap[s.id]}
                  </p>
                )}

                {savedId === s.id && (
                  <p className="mt-3 rounded-xl border border-forest-300 bg-forest-50 px-3 py-2 font-mono text-xs text-forest-800">
                    ✓ Penugasan {selected.length} reviewer untuk naskah SMPL-{s.id} telah disimpan ke database.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </>
  );
}
