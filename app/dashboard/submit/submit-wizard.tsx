"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { cn, daysLeft, formatDate } from "@/lib/utils";
import { submitManuscriptAction } from "@/app/actions";
import type { Category } from "@/lib/data";

type EventOpt = {
  id: number;
  category_id: number;
  category_nama: string;
  nama: string;
  tema: string;
  deadline: string;
  max_anggota: number;
  max_halaman: number;
};
type MemberInput = { nama: string; institusi: string; email: string };
type FileSlot = { key: string; label: string; desc: string; required: boolean };
type FileState = { file: File; errors: string[] };

const STEPS = ["Jenis Naskah", "Metadata Naskah", "Penulis", "Upload PDF", "Konfirmasi"];

/** Validasi sistem sesuai userflow: format, ukuran, nama file */
function validateFile(slot: string, file: File): string[] {
  const errors: string[] = [];
  const max = slot === "naskah" ? 5 : 2;
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    errors.push("Format berkas harus PDF");
  }
  if (file.size > max * 1024 * 1024) {
    errors.push(`Ukuran berkas melebihi batas ${max} MB`);
  }
  if (/\s/.test(file.name)) {
    errors.push("Nama file tidak boleh mengandung spasi");
  }
  if (slot === "naskah" && !/^[A-Za-z]+_[A-Za-z0-9-]+\.pdf$/i.test(file.name)) {
    errors.push("Pola nama file harus NamaKetua_JudulSingkat.pdf");
  }
  return errors;
}

export function SubmitWizard({
  categories,
  events,
  defaultAuthor,
}: {
  categories: Category[];
  events: EventOpt[];
  defaultAuthor: MemberInput;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const paramEventId = Number(params.get("event"));
  const initialEventObj = events.find((e) => e.id === paramEventId) ?? events[0];

  const [step, setStep] = useState(paramEventId ? 1 : 0);
  const [selectedCatId, setSelectedCatId] = useState<number>(
    initialEventObj?.category_id ?? categories[0]?.id ?? 1,
  );
  const [eventId, setEventId] = useState<number | null>(initialEventObj?.id ?? null);
  const [judul, setJudul] = useState("");
  const [abstrak, setAbstrak] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [membersList, setMembers] = useState<MemberInput[]>([defaultAuthor]);
  const [uploads, setUploads] = useState<Record<string, FileState>>({});
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const selectedCat = categories.find((c) => c.id === selectedCatId) ?? categories[0];
  const categoryEvents = events.filter((e) => e.category_id === selectedCatId);
  const displayedEvents = categoryEvents.length > 0 ? categoryEvents : events;
  const event = events.find((e) => e.id === eventId) ?? displayedEvents[0];

  const jenisLabel = selectedCat?.nama || event?.category_nama || "Essay";

  const fileSlots: FileSlot[] = [
    {
      key: "naskah",
      label: `Berkas Naskah ${jenisLabel} (PDF)`,
      desc: "PDF · maks 5 MB · NamaKetua_JudulSingkat.pdf",
      required: true,
    },
    {
      key: "orisinalitas",
      label: "Surat Pernyataan Orisinalitas",
      desc: "PDF · maks 2 MB · bertanda tangan penulis utama",
      required: true,
    },
    {
      key: "identitas",
      label: "Lampiran Data / KTM Penulis",
      desc: "PDF · maks 2 MB · opsional",
      required: false,
    },
  ];

  const abstrakWords = abstrak.trim() ? abstrak.trim().split(/\s+/).length : 0;

  const canNext = [
    !!event && !!selectedCat,
    judul.trim().length >= 10 && abstrakWords >= 30 && keywords.length >= 3,
    membersList.every((m) => m.nama && m.institusi && m.email),
    fileSlots.filter((s) => s.required).every((s) => uploads[s.key] && uploads[s.key].errors.length === 0) &&
      Object.values(uploads).every((u) => u.errors.length === 0),
    agree,
  ][step];

  function selectCategory(catId: number) {
    setSelectedCatId(catId);
    const matching = events.filter((e) => e.category_id === catId);
    if (matching.length > 0) {
      setEventId(matching[0].id);
    } else if (events[0]) {
      setEventId(events[0].id);
    }
  }

  function addKeyword() {
    const k = kwInput.trim().replace(/,$/, "");
    if (k && !keywords.includes(k) && keywords.length < 6) setKeywords([...keywords, k]);
    setKwInput("");
  }

  async function submit() {
    if (!event) return;
    setSubmitting(true);
    setErrorMsg(null);

    const fd = new FormData();
    fd.set("event_id", String(event.id));
    fd.set("judul", judul);
    fd.set("abstrak", abstrak);
    fd.set("kata_kunci", keywords.join(", "));
    fd.set("members", JSON.stringify(membersList));
    if (uploads.naskah?.file) fd.set("file_naskah", uploads.naskah.file);
    if (uploads.orisinalitas?.file) fd.set("file_orisinalitas", uploads.orisinalitas.file);
    if (uploads.identitas?.file) fd.set("file_identitas", uploads.identitas.file);

    const res = await submitManuscriptAction(fd);
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || "Gagal menyimpan naskah.");
      return;
    }

    setCreatedId(res.submissionId ?? 111);
    router.refresh();
  }

  if (createdId) {
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-md border border-forest-300 bg-forest-50 text-forest-800">
          <FileCheck2 className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold text-forest-950">
          Naskah {jenisLabel} Berhasil Dikirim ke Redaksi
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Status naskah kini tercatat di database sebagai <strong className="font-mono text-sky-800">submitted</strong>. Redaksi akan memeriksa kelengkapan berkas dan melakukan <em>desk evaluation</em>.
        </p>
        <div className="mx-auto mt-6 max-w-xs border border-line bg-paper p-4 text-left">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Kode Registrasi Naskah</p>
          <p className="mt-0.5 font-mono text-lg font-bold text-forest-900">SMPL-2026-0{createdId}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link href={`/dashboard/karya/${createdId}`} className="btn btn-primary">
            Lihat Rincian Naskah
          </Link>
          <Link href="/dashboard/karya" className="btn btn-outline">
            Daftar Naskah Saya
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-paper px-4 py-4 sm:px-6">
          <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    "flex w-full flex-col items-start rounded-md border p-2 text-left transition-colors sm:flex-row sm:items-center sm:gap-2",
                    i < step && "cursor-pointer border-forest-300 bg-forest-50/70",
                    i === step && "border-forest-800 bg-forest-950 text-white",
                    i > step && "border-line bg-sheet text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold",
                      i < step && "bg-forest-700 text-white",
                      i === step && "bg-gold-400 text-forest-950",
                      i > step && "bg-paper text-muted",
                    )}
                  >
                    {i < step ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className="mt-1 truncate text-[11px] font-semibold sm:mt-0 sm:text-xs">{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-5 sm:p-7">
          <h2 className="text-xl font-semibold text-forest-950">
            Tahap 0{step + 1}: {STEPS[step]}
          </h2>

          {/* STEP 0 — Pilih Jenis Naskah (Essay, Makalah, Artikel Jurnal, dll.) & Periode */}
          {step === 0 && (
            <div className="mt-5 space-y-6">
              <div>
                <p className="label">1. Pilih Jenis Naskah yang Ingin Diunggah</p>
                <p className="mb-3 text-xs text-muted">
                  Tentukan bentuk naskah yang akan Anda publikasikan ke repositori UKM SIMPEL:
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((cat) => {
                    const active = selectedCatId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => selectCategory(cat.id)}
                        className={cn(
                          "flex flex-col justify-between rounded-md border p-4 text-left transition-colors",
                          active
                            ? "border-forest-700 bg-forest-50/80 ring-1 ring-forest-700"
                            : "border-line bg-sheet hover:border-forest-400",
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-sans text-sm font-bold text-forest-950">
                              <BookOpen className="size-4 text-forest-700" />
                              {cat.nama}
                            </span>
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full",
                                active ? "bg-forest-700 text-white" : "border border-line-strong",
                              )}
                            >
                              {active && <Check className="size-3" />}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted">{cat.deskripsi}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-line pt-5">
                <p className="label">2. Pilih Periode / Edisi Penerimaan Naskah ({jenisLabel})</p>
                {categoryEvents.length === 0 && (
                  <p className="mb-3 rounded border border-gold-300 bg-gold-50 p-2.5 text-xs text-forest-950">
                    Menampilkan periode penerimaan umum yang dapat menerima naskah <strong>{jenisLabel}</strong>:
                  </p>
                )}
                <div className="grid gap-3">
                  {displayedEvents.map((e) => (
                    <label
                      key={e.id}
                      className={cn(
                        "flex cursor-pointer flex-col justify-between gap-3 rounded-md border p-4 transition-colors sm:flex-row sm:items-start",
                        event?.id === e.id ? "border-forest-700 bg-forest-50/60" : "border-line hover:border-forest-400",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="event"
                          className="mt-1 size-4 accent-forest-700"
                          checked={event?.id === e.id}
                          onChange={() => setEventId(e.id)}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-forest-900 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-gold-300">
                              {jenisLabel}
                            </span>
                            <p className="font-semibold text-ink">{e.nama}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted">Tema: {e.tema}</p>
                          <div className="mt-2.5 flex flex-wrap gap-1.5 font-mono text-[11px]">
                            <span className="rounded border border-line bg-sheet px-2 py-0.5 text-muted">
                              Tenggat {formatDate(e.deadline)}
                            </span>
                            <span className="rounded border border-line bg-sheet px-2 py-0.5 text-muted">
                              Maks {e.max_anggota} penulis
                            </span>
                            <span className="rounded border border-line bg-sheet px-2 py-0.5 text-muted">
                              Maks {e.max_halaman} hlm
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="self-start rounded border border-forest-300 bg-forest-50 px-2.5 py-1 font-mono text-xs font-semibold text-forest-800">
                        {daysLeft(e.deadline)} hari
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-5 space-y-5">
              <div>
                <label className="label" htmlFor="judul">
                  Judul {jenisLabel}
                </label>
                <input
                  id="judul"
                  className="input"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder={`Tuliskan judul lengkap naskah ${jenisLabel.toLowerCase()} Anda`}
                />
                <p className="hint">Minimal 10 karakter, ditulis sesuai kaidah Bahasa Indonesia ilmiah.</p>
              </div>
              <div>
                <div className="flex items-end justify-between">
                  <label className="label" htmlFor="abstrak">
                    Abstrak / Ringkasan Naskah
                  </label>
                  <span
                    className={cn(
                      "mb-1.5 font-mono text-xs font-semibold",
                      abstrakWords > 300 ? "text-red-700" : abstrakWords >= 30 ? "text-forest-700" : "text-muted",
                    )}
                  >
                    {abstrakWords} / 300 kata (min. 30)
                  </span>
                </div>
                <textarea
                  id="abstrak"
                  rows={6}
                  className="input resize-none leading-relaxed"
                  value={abstrak}
                  onChange={(e) => setAbstrak(e.target.value)}
                  placeholder="Memuat latar belakang masalah, tujuan, metode/pembahasan, dan simpulan utama…"
                />
              </div>
              <div>
                <label className="label" htmlFor="kw">
                  Kata Kunci <span className="font-normal text-muted">(3–6 kata kunci)</span>
                </label>
                <div className="input flex flex-wrap items-center gap-1.5 !py-1.5">
                  {keywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded border border-forest-300 bg-forest-50 py-0.5 pl-2.5 pr-1 font-mono text-xs font-semibold text-forest-900"
                    >
                      {k}
                      <button
                        type="button"
                        onClick={() => setKeywords(keywords.filter((x) => x !== k))}
                        className="rounded p-0.5 hover:bg-forest-200"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="kw"
                    value={kwInput}
                    onChange={(e) => setKwInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    onBlur={addKeyword}
                    className="min-w-36 flex-1 bg-transparent py-1 text-sm outline-none"
                    placeholder={keywords.length ? "" : "Ketik kata kunci lalu tekan Enter"}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && event && (
            <div className="mt-5 space-y-4">
              <p className="text-xs text-muted">
                Maksimal <strong className="text-ink">{event.max_anggota} penulis</strong> untuk naskah {jenisLabel} pada periode ini. Penulis pertama tercatat sebagai Ketua / Penulis Utama.
              </p>
              {membersList.map((m, i) => (
                <div key={i} className="rounded-md border border-line bg-paper/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded px-2.5 py-0.5 font-mono text-xs font-bold",
                        i === 0 ? "bg-gold-100 text-forest-950" : "border border-line bg-sheet text-muted",
                      )}
                    >
                      {i === 0 ? "Penulis Utama (Ketua)" : `Penulis Pendamping ${i}`}
                    </span>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => setMembers(membersList.filter((_, j) => j !== i))}
                        className="text-muted hover:text-red-700"
                        aria-label="Hapus penulis"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(["nama", "institusi", "email"] as const).map((field) => (
                      <input
                        key={field}
                        className="input"
                        placeholder={field === "nama" ? "Nama lengkap" : field === "institusi" ? "Institusi" : "Email aktif"}
                        value={m[field]}
                        onChange={(e) =>
                          setMembers(membersList.map((x, j) => (j === i ? { ...x, [field]: e.target.value } : x)))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
              {membersList.length < event.max_anggota && (
                <button
                  type="button"
                  onClick={() => setMembers([...membersList, { nama: "", institusi: "", email: "" }])}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong py-3 text-xs font-semibold text-muted hover:border-forest-700 hover:text-forest-800"
                >
                  <Plus className="size-4" /> Tambah Penulis Pendamping
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="mt-5 space-y-4">
              {fileSlots.map((slot) => (
                <UploadSlot
                  key={slot.key}
                  slot={slot}
                  state={uploads[slot.key]}
                  onFile={(file) =>
                    setUploads({ ...uploads, [slot.key]: { file, errors: validateFile(slot.key, file) } })
                  }
                  onClear={() => {
                    const next = { ...uploads };
                    delete next[slot.key];
                    setUploads(next);
                  }}
                />
              ))}
            </div>
          )}

          {step === 4 && event && (
            <div className="mt-5 space-y-4">
              <dl className="divide-y divide-line border border-line">
                {[
                  ["Jenis Naskah", jenisLabel],
                  ["Periode Publikasi", event.nama],
                  ["Judul Naskah", judul],
                  ["Kata Kunci", keywords.join(", ")],
                  ["Susunan Penulis", membersList.map((m) => m.nama).join(", ")],
                  ["Berkas Tervalidasi", Object.values(uploads).map((u) => u.file.name).join(", ")],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-4">
                    <dt className="font-mono text-xs uppercase text-muted">{k}</dt>
                    <dd className="text-sm font-medium text-ink sm:col-span-3">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="border border-line bg-paper p-4">
                <p className="font-mono text-xs uppercase text-muted">Abstrak</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{abstrak}</p>
              </div>
              <label className="flex items-start gap-3 border border-gold-300 bg-gold-50 p-4 text-xs leading-relaxed text-forest-950">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 size-4 accent-forest-700"
                />
                <span>
                  Saya menyatakan bahwa naskah {jenisLabel.toLowerCase()} ini merupakan karya orisinal, belum pernah diterbitkan pada media lain, dan siap mengikuti proses evaluasi redaksi UKM SIMPEL.
                </span>
              </label>
              {errorMsg && (
                <p className="rounded border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800">
                  {errorMsg}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-paper px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="btn btn-outline"
          >
            <ArrowLeft className="size-4" /> Sebelumnya
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="btn btn-primary"
            >
              Lanjutkan <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canNext || submitting}
              className="btn btn-gold"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Konfirmasi &amp; Kirim {jenisLabel} <CheckCircle2 className="size-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-forest-950 p-4 text-white">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-gold-300">
              Jenis Naskah: {jenisLabel}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug">{event?.nama ?? "Belum dipilih"}</p>
            {event && <p className="mt-1 font-mono text-xs text-forest-200">Tenggat {formatDate(event.deadline)}</p>}
          </div>
          <ul className="space-y-2.5 p-4 text-xs">
            {[
              [`Jenis: ${jenisLabel}`, !!selectedCat],
              ["Judul & abstrak (≥ 30 kata)", judul.length >= 10 && abstrakWords >= 30],
              ["Kata kunci (3–6 kata)", keywords.length >= 3],
              ["Susunan penulis lengkap", membersList.every((m) => m.nama && m.email)],
              [`PDF ${jenisLabel} lolos validasi`, !!uploads.naskah && !uploads.naskah.errors.length],
              ["Surat orisinalitas lolos validasi", !!uploads.orisinalitas && !uploads.orisinalitas.errors.length],
            ].map(([l, ok]) => (
              <li key={String(l)} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded",
                    ok ? "bg-forest-700 text-white" : "border border-line-strong",
                  )}
                >
                  {ok ? <Check className="size-3" /> : null}
                </span>
                <span className={ok ? "font-medium text-ink" : "text-muted"}>{l}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4 text-xs">
          <p className="font-mono font-bold uppercase text-forest-900">Aturan Validasi Sistem</p>
          <p className="mt-1.5 leading-relaxed text-muted">
            Penamaan berkas {jenisLabel.toLowerCase()} wajib berformat{" "}
            <code className="rounded bg-paper px-1 font-mono text-forest-900">NamaKetua_JudulSingkat.pdf</code> tanpa spasi.
          </p>
        </div>
      </aside>
    </div>
  );
}

function UploadSlot({
  slot,
  state,
  onFile,
  onClear,
}: {
  slot: FileSlot;
  state?: FileState;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const failed = state && state.errors.length > 0;

  return (
    <div>
      <p className="label">
        {slot.label}{" "}
        {slot.required ? <span className="text-red-700">*</span> : <span className="font-normal text-muted">(opsional)</span>}
      </p>
      {!state ? (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center rounded-md border border-dashed px-5 py-7 text-center transition-colors",
            drag ? "border-forest-700 bg-forest-50" : "border-line-strong bg-paper/60 hover:border-forest-700",
          )}
        >
          <UploadCloud className="size-6 text-forest-700" />
          <p className="mt-2 text-xs font-semibold text-ink">
            Tarik berkas PDF ke sini atau <span className="text-forest-800 underline">pilih dari perangkat</span>
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted">{slot.desc}</p>
        </button>
      ) : (
        <div
          className={cn(
            "rounded-md border p-4",
            failed ? "border-red-300 bg-red-50/70" : "border-forest-300 bg-forest-50/60",
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded",
                failed ? "bg-red-100 text-red-800" : "bg-forest-100 text-forest-800",
              )}
            >
              {failed ? <AlertTriangle className="size-4" /> : <FileText className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{state.file.name}</p>
              <p className="font-mono text-[11px] text-muted">
                {(state.file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                {failed ? "Gagal Validasi Sistem" : "Lolos Validasi Sistem"}
              </p>
            </div>
            <button type="button" onClick={() => ref.current?.click()} className="btn btn-outline btn-sm">
              <FileUp className="size-3.5" /> Ganti
            </button>
            <button
              type="button"
              onClick={onClear}
              className="text-muted hover:text-red-700"
              aria-label="Hapus berkas"
            >
              <X className="size-4" />
            </button>
          </div>
          {failed && (
            <ul className="mt-3 space-y-1 border-t border-red-200 pt-2.5 font-mono text-xs text-red-800">
              {state.errors.map((e) => (
                <li key={e}>• {e} (Perbaiki dan unggah ulang)</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
