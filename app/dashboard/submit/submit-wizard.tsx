"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  FileUp,
  FlaskConical,
  Globe,
  ImagePlus,
  Loader2,
  Lock,
  Paperclip,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { cn, stripHtml } from "@/lib/utils";
import { submitManuscriptAction } from "@/app/actions";
import type { Category, EssayBody } from "@/lib/data";

type EventOpt = {
  id: number;
  category_id: number;
  category_nama: string;
  nama: string;
  tema: string;
  volume: string;
  deadline: string;
  max_anggota: number;
  max_halaman: number;
};

type MemberInput = { nama: string; institusi: string; email: string };

type DraftInitial = {
  id: number;
  event_id: number;
  judul: string;
  subjudul: string;
  topik: string;
  jenis_riset: string;
  abstrak: string;
  cover_image: string;
  kata_kunci: string;
  prodi: string;
  bio: string;
  isi_essay: EssayBody;
  visibilitas: "publik" | "privat";
  persetujuan_publikasi: boolean;
  pernyataan_orisinalitas: boolean;
  hasExistingFile?: boolean;
  members: MemberInput[];
};

const SECTIONS = [
  { code: "A", label: "Informasi Naskah" },
  { code: "B", label: "Identitas Penulis" },
  { code: "C", label: "Format & Dokumen" },
  { code: "D", label: "Pengaturan Publikasi" },
];

const TOPIK_PRESETS = [
  "Pendidikan",
  "Teknologi & Rekayasa",
  "Kesehatan",
  "Sosial & Humaniora",
  "Ekonomi & Bisnis",
  "Lingkungan",
  "Hukum & Kebijakan",
  "Lainnya",
];

const RISET_PRESETS = [
  "Kuantitatif",
  "Kualitatif",
  "Campuran (Mixed Method)",
  "R&D / Rekayasa Sistem",
  "Studi Kasus / Lapangan",
  "Kajian Literatur Sistematis",
];

const PUBLISH_FLOW = [
  { num: "1", title: "Buat Naskah", desc: "Essay, Makalah, atau Jurnal" },
  { num: "2", title: "Simpan Draft", desc: "Bisa diedit lagi" },
  { num: "3", title: "Ajukan Publikasi", desc: "Kirim ke Editor" },
  { num: "4", title: "Review Naskah", desc: "Cek isi & format" },
  { num: "5", title: "Publikasi", desc: "Tampil di katalog" },
];

export function SubmitWizard({
  categories,
  events,
  defaultAuthor,
  initialDraft,
}: {
  categories: Category[];
  events: EventOpt[];
  defaultAuthor: MemberInput;
  initialDraft?: DraftInitial;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const paramEventId = Number(params.get("event"));
  const initialEventObj =
    events.find((e) => e.id === (initialDraft?.event_id ?? paramEventId)) ?? events[0];

  const [step, setStep] = useState(0);
  const [selectedCatId, setSelectedCatId] = useState<number>(
    initialEventObj?.category_id ?? categories[0]?.id ?? 2,
  );
  const [eventId, setEventId] = useState<number | null>(initialEventObj?.id ?? null);

  // A. Informasi Naskah (Makalah vs Artikel Jurnal Riset)
  const [judul, setJudul] = useState(initialDraft?.judul ?? "");
  const [subjudul, setSubjudul] = useState(initialDraft?.subjudul ?? "");
  const [topik, setTopik] = useState(initialDraft?.topik ?? "Pendidikan");
  const [jenisRiset, setJenisRiset] = useState(initialDraft?.jenis_riset ?? "Kuantitatif");
  const [abstrak, setAbstrak] = useState(initialDraft?.abstrak ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(initialDraft?.cover_image ?? "");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [keywords, setKeywords] = useState<string[]>(
    initialDraft?.kata_kunci
      ? initialDraft.kata_kunci
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
      : [],
  );
  const [kwInput, setKwInput] = useState("");

  // B. Identitas Penulis
  const [membersList, setMembers] = useState<MemberInput[]>(
    initialDraft?.members.length ? initialDraft.members : [defaultAuthor],
  );
  const [prodi, setProdi] = useState(initialDraft?.prodi ?? "");
  const [bio, setBio] = useState(initialDraft?.bio ?? "");

  // C. Berkas PDF & Struktur Naskah (Makalah vs Artikel Jurnal IMRAD)
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extraPdfFile, setExtraPdfFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const extraPdfRef = useRef<HTMLInputElement>(null);
  const [pendahuluan, setPendahuluan] = useState(initialDraft?.isi_essay.pendahuluan ?? "");
  const [metodePenelitian, setMetodePenelitian] = useState(initialDraft?.isi_essay.metode_penelitian ?? "");
  const [hasilPembahasan, setHasilPembahasan] = useState(initialDraft?.isi_essay.hasil_pembahasan ?? "");
  const [pembahasan, setPembahasan] = useState(initialDraft?.isi_essay.pembahasan ?? "");
  const [kesimpulan, setKesimpulan] = useState(initialDraft?.isi_essay.kesimpulan ?? "");
  const [daftarPustaka, setDaftarPustaka] = useState(initialDraft?.isi_essay.daftar_pustaka ?? "");

  // D. Pengaturan Publikasi
  const [visibilitas, setVisibilitas] = useState<"publik" | "privat">(
    initialDraft?.visibilitas ?? "publik",
  );
  const [agreePublish, setAgreePublish] = useState(initialDraft?.persetujuan_publikasi ?? false);
  const [agreeOriginal, setAgreeOriginal] = useState(initialDraft?.pernyataan_orisinalitas ?? false);

  const [submitting, setSubmitting] = useState<"draft" | "submit" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<{ id: number; mode: "draft" | "submit" } | null>(null);

  const selectedCat = categories.find((c) => c.id === selectedCatId) ?? categories[0];
  const categoryEvents = events.filter((e) => e.category_id === selectedCatId);
  const displayedEvents = categoryEvents.length > 0 ? categoryEvents : events;
  const event = events.find((e) => e.id === eventId) ?? displayedEvents[0];
  const jenisLabel = selectedCat?.nama || event?.category_nama || "Essay";
  const isEssay = jenisLabel.toLowerCase().includes("essay");
  const isResearch =
    jenisLabel.toLowerCase().includes("jurnal") || jenisLabel.toLowerCase().includes("artikel");

  const infoComplete = judul.trim().length > 0 && topik.trim().length > 0 && abstrak.trim().length > 0;
  const authorComplete = Boolean(membersList[0]?.nama.trim() && membersList[0]?.email.trim());

  const hasStructuredContent = isEssay
    ? false
    : isResearch
      ? stripHtml(pendahuluan).length > 0 &&
        stripHtml(metodePenelitian).length > 0 &&
        stripHtml(hasilPembahasan).length > 0 &&
        stripHtml(kesimpulan).length > 0
      : stripHtml(pendahuluan).length > 0 &&
        stripHtml(pembahasan).length > 0 &&
        stripHtml(kesimpulan).length > 0;

  const bodyComplete = Boolean(pdfFile) || Boolean(initialDraft?.hasExistingFile) || hasStructuredContent;
  const publishReady = infoComplete && authorComplete && bodyComplete && agreePublish && agreeOriginal;

  function selectCategory(catId: number) {
    setSelectedCatId(catId);
    const matching = events.filter((e) => e.category_id === catId);
    if (matching.length > 0) setEventId(matching[0].id);
    else if (events[0]) setEventId(events[0].id);
  }

  function addKeyword() {
    const k = kwInput.trim().replace(/,$/, "");
    if (k && !keywords.includes(k) && keywords.length < 8) setKeywords([...keywords, k]);
    setKwInput("");
  }

  function onPickCover(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Sampul naskah harus berupa gambar (PNG, JPG, atau WEBP).");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg("Ukuran gambar sampul maksimal 3 MB.");
      return;
    }
    setErrorMsg(null);
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function onPickPdf(file: File, target: "main" | "extra") {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Berkas yang diunggah harus berformat PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Ukuran berkas PDF maksimal 10 MB.");
      return;
    }
    setErrorMsg(null);
    if (target === "main") setPdfFile(file);
    else setExtraPdfFile(file);
  }

  async function saveSubmission(mode: "draft" | "submit") {
    if (!event) {
      setErrorMsg("Belum ada periode penerimaan yang dibuka.");
      return;
    }
    if (!judul.trim()) {
      setErrorMsg(`Judul ${jenisLabel} wajib diisi terlebih dahulu sebelum menyimpan.`);
      setStep(0);
      return;
    }
    if (mode === "submit") {
      if (!infoComplete) {
        setErrorMsg("Lengkapi Judul, Kategori Bidang, dan Ringkasan/Abstrak di bagian A.");
        setStep(0);
        return;
      }
      if (!authorComplete) {
        setErrorMsg("Lengkapi Nama Penulis dan Email di bagian B.");
        setStep(1);
        return;
      }
      if (!bodyComplete) {
        setErrorMsg(
          isEssay
            ? "Unggah berkas PDF Essay Anda di bagian C sebelum mengajukan publikasi."
            : isResearch
              ? "Unggah PDF Artikel Jurnal Anda atau lengkapi struktur riset IMRAD di bagian C."
              : "Unggah PDF Makalah Anda atau lengkapi struktur makalah di bagian C.",
        );
        setStep(2);
        return;
      }
      if (!agreePublish || !agreeOriginal) {
        setErrorMsg("Centang Persetujuan Publikasi dan Pernyataan Orisinalitas di bagian D.");
        setStep(3);
        return;
      }
    }

    setSubmitting(mode);
    setErrorMsg(null);

    const fd = new FormData();
    if (initialDraft?.id) fd.set("submission_id", String(initialDraft.id));
    fd.set("action_mode", mode);
    fd.set("event_id", String(event.id));
    fd.set("judul", judul);
    fd.set("subjudul", subjudul);
    fd.set("topik", topik);
    if (isResearch) fd.set("jenis_riset", jenisRiset);
    fd.set("abstrak", abstrak);
    fd.set("kata_kunci", keywords.join(", "));
    fd.set("prodi", prodi);
    fd.set("bio", bio);
    fd.set("visibilitas", visibilitas);
    fd.set("persetujuan_publikasi", String(agreePublish));
    fd.set("pernyataan_orisinalitas", String(agreeOriginal));
    fd.set("existing_cover", coverFile ? "" : coverPreview);
    if (coverFile) fd.set("cover_file", coverFile);
    fd.set("members", JSON.stringify(membersList));
    fd.set(
      "isi_essay",
      isEssay
        ? "{}"
        : JSON.stringify({
            pendahuluan,
            metode_penelitian: isResearch ? metodePenelitian : "",
            hasil_pembahasan: isResearch ? hasilPembahasan : "",
            pembahasan: isResearch ? hasilPembahasan : pembahasan,
            kesimpulan,
            daftar_pustaka: daftarPustaka,
          }),
    );
    if (pdfFile) fd.set("file_naskah", pdfFile);
    if (extraPdfFile) fd.set("file_identitas", extraPdfFile);

    const res = await submitManuscriptAction(fd);
    setSubmitting(null);

    if (!res.ok) {
      setErrorMsg(res.error || "Gagal menyimpan naskah.");
      return;
    }

    setSavedResult({ id: res.submissionId ?? initialDraft?.id ?? 101, mode });
    router.refresh();
  }

  if (savedResult) {
    const isDraft = savedResult.mode === "draft";
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-forest-300 bg-forest-50 text-forest-800">
          {isDraft ? <Save className="size-7" /> : <FileCheck2 className="size-7" />}
        </span>
        <h2 className="mt-5 text-2xl font-semibold text-forest-950">
          {isDraft
            ? `Draft ${jenisLabel} Berhasil Disimpan`
            : `${jenisLabel} Berhasil Diajukan untuk Publikasi`}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {isDraft
            ? "Naskah Anda tersimpan aman sebagai draft. Anda dapat melanjutkan mengedit atau mengajukannya ke Editor kapan saja."
            : "Naskah Anda telah dikirim ke Editor untuk diperiksa format, referensi, dan orisinalitasnya sebelum dipublikasikan."}
        </p>
        <div className="mx-auto mt-6 max-w-xs rounded-xl border border-line bg-paper p-4 text-left">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Kode Naskah</p>
          <p className="mt-0.5 font-mono text-lg font-bold text-forest-900">SMPL-2026-0{savedResult.id}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {isDraft && (
            <Link
              href={`/dashboard/submit?edit=${savedResult.id}`}
              onClick={() => setSavedResult(null)}
              className="btn btn-outline"
            >
              Lanjutkan Edit Draft
            </Link>
          )}
          <Link href={`/dashboard/karya/${savedResult.id}`} className="btn btn-primary">
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
    <div className="space-y-6">
      {/* Tampilan Alur 5 Langkah Publish */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-sheet p-3 sm:grid-cols-5 sm:p-4">
        {PUBLISH_FLOW.map((f, idx) => {
          const active =
            (idx === 0 && step < 3) || (idx === 1 && Boolean(initialDraft)) || (idx === 2 && step === 3);
          return (
            <div
              key={f.num}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors",
                active ? "bg-forest-950 text-white" : "bg-paper/70 text-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold",
                  active ? "bg-gold-400 text-forest-950" : "bg-sheet text-forest-900 ring-1 ring-line",
                )}
              >
                {f.num}
              </span>
              <div className="min-w-0">
                <p className={cn("truncate text-xs font-bold", active ? "text-gold-200" : "text-ink")}>{f.title}</p>
                <p className={cn("truncate text-[10.5px]", active ? "text-forest-200/80" : "text-muted")}>
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_310px]">
        <div className="card overflow-hidden">
          {/* Tab Navigasi A, B, C, D */}
          <div className="border-b border-line bg-paper px-4 py-3.5 sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SECTIONS.map((sec, i) => {
                const done = [infoComplete, authorComplete, bodyComplete, publishReady][i];
                const active = step === i;
                return (
                  <button
                    key={sec.code}
                    type="button"
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                      active
                        ? "border-forest-800 bg-forest-950 text-white shadow-soft"
                        : done
                          ? "border-forest-300 bg-forest-50/70 text-forest-950"
                          : "border-line bg-sheet text-muted hover:border-forest-400",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold",
                        active
                          ? "bg-gold-400 text-forest-950"
                          : done
                            ? "bg-forest-700 text-white"
                            : "bg-paper text-muted",
                      )}
                    >
                      {done && !active ? <Check className="size-3.5" /> : sec.code}
                    </span>
                    <span className="truncate text-xs font-bold">{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {/* BAGIAN A — INFORMASI NASKAH (MAKALAH vs ARTIKEL JURNAL RISET) */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="eyebrow">A. INFORMASI {jenisLabel.toUpperCase()}</p>
                  <h2 className="mt-1 text-xl font-semibold text-forest-950">
                    Jenis Naskah, Format &amp; Identitas Karya
                  </h2>
                </div>

                {/* Pilihan Jenis: Essay, Makalah, Artikel Jurnal */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {categories.map((cat) => {
                    const active = selectedCatId === cat.id;
                    const catIsResearch = cat.nama.toLowerCase().includes("jurnal");
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => selectCategory(cat.id)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                          active
                            ? "border-forest-800 bg-forest-50/80 ring-1 ring-forest-700"
                            : "border-line bg-sheet hover:border-forest-500",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl",
                            active ? "bg-forest-950 text-gold-300" : "bg-paper text-forest-700",
                          )}
                        >
                          {catIsResearch ? <FlaskConical className="size-4" /> : <BookOpen className="size-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-forest-950">{cat.nama}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted">{cat.deskripsi}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="label" htmlFor="periode-select">
                    Periode / Edisi Penerimaan ({jenisLabel})
                  </label>
                  <select
                    id="periode-select"
                    className="input bg-sheet"
                    value={event?.id ?? ""}
                    onChange={(e) => setEventId(Number(e.target.value))}
                  >
                    {displayedEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.nama} ({ev.volume})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="judul">
                    Judul {jenisLabel} <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="judul"
                    className="input"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder={
                      isResearch
                        ? "cth. Analisis Efektivitas Sistem Deteksi Dini Kualitas Air Berbasis IoT"
                        : "cth. Strategi Transformasi Digital bagi UMKM Pesisir di Era Ekonomi Sirkular"
                    }
                  />
                </div>

                <div>
                  <label className="label" htmlFor="subjudul">
                    Subjudul <span className="font-normal text-muted">(opsional · penjelasan singkat)</span>
                  </label>
                  <input
                    id="subjudul"
                    className="input"
                    value={subjudul}
                    onChange={(e) => setSubjudul(e.target.value)}
                    placeholder="Keterangan tambahan atau fokus kajian"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      Bidang Keilmuan / Kategori <span className="text-red-700">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {TOPIK_PRESETS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopik(t)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                            topik === t
                              ? "border-forest-800 bg-forest-950 text-white"
                              : "border-line bg-sheet text-ink hover:border-forest-500",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isResearch && (
                    <div>
                      <label className="label" htmlFor="jenis-riset">
                        Desain / Metode Riset <span className="text-red-700">*</span>
                      </label>
                      <select
                        id="jenis-riset"
                        value={jenisRiset}
                        onChange={(e) => setJenisRiset(e.target.value)}
                        className="input bg-sheet"
                      >
                        {RISET_PRESETS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-muted">
                        Format Artikel Jurnal mengikuti kaidah riset IMRAD (Metode, Hasil, &amp; Pembahasan).
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="abstrak">
                    {isResearch ? "Abstrak Penelitian" : "Ringkasan / Gambaran Makalah"}{" "}
                    <span className="text-red-700">*</span>
                  </label>
                  <textarea
                    id="abstrak"
                    rows={4}
                    className="input resize-y"
                    value={abstrak}
                    onChange={(e) => setAbstrak(e.target.value)}
                    placeholder={
                      isResearch
                        ? "Ringkasan tujuan penelitian, metode yang digunakan, temuan utama, serta kesimpulan riset..."
                        : "Tuliskan gambaran singkat rumusan masalah, pokok bahasan teori, dan kesimpulan makalah..."
                    }
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      Gambar Sampul <span className="font-normal text-muted">(opsional)</span>
                    </label>
                    {coverPreview ? (
                      <div className="relative overflow-hidden rounded-xl border border-line bg-paper">
                        <img src={coverPreview} alt="Sampul naskah" className="h-36 w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 border-t border-line bg-sheet px-3 py-2 text-xs">
                          <span className="truncate font-mono text-muted">
                            {coverFile?.name || "Sampul tersimpan"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCoverFile(null);
                              setCoverPreview("");
                            }}
                            className="font-semibold text-red-700 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-paper/60 px-4 py-6 text-center transition-colors hover:border-forest-700"
                      >
                        <ImagePlus className="size-6 text-forest-700" />
                        <span className="mt-2 text-xs font-semibold text-ink">Pilih Gambar Sampul</span>
                        <span className="mt-0.5 font-mono text-[11px] text-muted">JPG / PNG / WEBP · maks. 3 MB</span>
                      </button>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPickCover(f);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="kw">
                      Kata Kunci / Tag <span className="font-normal text-muted">(opsional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="kw"
                        className="input"
                        value={kwInput}
                        onChange={(e) => setKwInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addKeyword();
                          }
                        }}
                        placeholder={isResearch ? "IoT, kualitas air, sensor" : "transformasi digital, UMKM"}
                      />
                      <button type="button" onClick={addKeyword} className="btn btn-outline shrink-0">
                        Tambah
                      </button>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {keywords.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1.5 rounded-full border border-forest-300 bg-forest-50 px-3 py-1 font-mono text-xs text-forest-900"
                        >
                          #{k}
                          <button
                            type="button"
                            onClick={() => setKeywords(keywords.filter((x) => x !== k))}
                            aria-label={`Hapus ${k}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BAGIAN B — IDENTITAS PENULIS */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="eyebrow">B. IDENTITAS PENULIS</p>
                  <h2 className="mt-1 text-xl font-semibold text-forest-950">
                    {isEssay
                      ? "Identitas Penulis Essay (Maks. 6 Penulis)"
                      : isResearch
                        ? "Identitas Peneliti Utama &amp; Ko-autor"
                        : "Identitas Penulis Makalah"}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Nama dan email otomatis terisi dari profil akun Anda. Kolom tambahan bersifat opsional.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
                  <p className="mb-3 font-mono text-xs font-bold uppercase text-forest-900">
                    {isResearch ? "Peneliti Utama / Korespondensi" : "Penulis Utama"}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">
                        Nama Penulis <span className="text-red-700">*</span>
                      </label>
                      <input
                        required
                        className="input bg-white"
                        value={membersList[0]?.nama ?? ""}
                        onChange={(e) =>
                          setMembers(
                            membersList.map((m, idx) => (idx === 0 ? { ...m, nama: e.target.value } : m)),
                          )
                        }
                        placeholder="Nama lengkap yang ditampilkan"
                      />
                    </div>
                    <div>
                      <label className="label">
                        Email <span className="text-red-700">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        className="input bg-white"
                        value={membersList[0]?.email ?? ""}
                        onChange={(e) =>
                          setMembers(
                            membersList.map((m, idx) => (idx === 0 ? { ...m, email: e.target.value } : m)),
                          )
                        }
                        placeholder="email@upstegal.ac.id"
                      />
                    </div>
                    <div>
                      <label className="label">
                        Institusi / Afiliasi <span className="font-normal text-muted">(opsional)</span>
                      </label>
                      <input
                        className="input bg-white"
                        value={membersList[0]?.institusi ?? ""}
                        onChange={(e) =>
                          setMembers(
                            membersList.map((m, idx) => (idx === 0 ? { ...m, institusi: e.target.value } : m)),
                          )
                        }
                        placeholder="Universitas / Organisasi"
                      />
                    </div>
                    <div>
                      <label className="label">
                        Program Studi <span className="font-normal text-muted">(opsional)</span>
                      </label>
                      <input
                        className="input bg-white"
                        value={prodi}
                        onChange={(e) => setProdi(e.target.value)}
                        placeholder="cth. Teknik Informatika / Pendidikan Bahasa"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">
                        Bio Singkat Penulis <span className="font-normal text-muted">(opsional)</span>
                      </label>
                      <textarea
                        rows={3}
                        className="input resize-none bg-white"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Deskripsi singkat bidang riset atau aktivitas akademik Anda..."
                      />
                    </div>
                  </div>
                </div>

                {/* Ko-autor / Anggota Tim */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted">
                      {isResearch
                        ? `Tim Peneliti / Ko-autor (opsional · maks. ${event?.max_anggota ?? 4} orang)`
                        : `Rekan Penulis Kelompok (opsional · maks. ${isEssay ? Math.max(6, event?.max_anggota ?? 6) : (event?.max_anggota ?? 4)} orang)`}
                    </p>
                    {membersList.length < (isEssay ? Math.max(6, event?.max_anggota ?? 6) : (event?.max_anggota ?? 4)) && (
                      <button
                        type="button"
                        onClick={() =>
                          setMembers([...membersList, { nama: "", institusi: "Universitas Pancasakti Tegal", email: "" }])
                        }
                        className="btn btn-outline btn-sm"
                      >
                        <Plus className="size-3.5" /> Tambah Penulis
                      </button>
                    )}
                  </div>

                  {membersList.slice(1).map((m, idx) => {
                    const realIdx = idx + 1;
                    return (
                      <div key={realIdx} className="rounded-xl border border-line bg-paper/60 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-forest-800">
                            {isResearch ? `Ko-autor #${idx + 1}` : `Penulis Anggota #${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMembers(membersList.filter((_, j) => j !== realIdx))}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
                          >
                            <Trash2 className="size-3.5" /> Hapus
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <input
                            className="input bg-white"
                            value={m.nama}
                            onChange={(e) =>
                              setMembers(
                                membersList.map((x, j) => (j === realIdx ? { ...x, nama: e.target.value } : x)),
                              )
                            }
                            placeholder="Nama lengkap"
                          />
                          <input
                            className="input bg-white"
                            value={m.institusi}
                            onChange={(e) =>
                              setMembers(
                                membersList.map((x, j) => (j === realIdx ? { ...x, institusi: e.target.value } : x)),
                              )
                            }
                            placeholder="Institusi"
                          />
                          <input
                            type="email"
                            className="input bg-white"
                            value={m.email}
                            onChange={(e) =>
                              setMembers(
                                membersList.map((x, j) => (j === realIdx ? { ...x, email: e.target.value } : x)),
                              )
                            }
                            placeholder="Email"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BAGIAN C — FORMAT & DOKUMEN NASKAH (ESSAY PDF-ONLY vs MAKALAH vs ARTIKEL JURNAL RISET) */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="eyebrow">
                    C.{" "}
                    {isEssay
                      ? "UNGGAH BERKAS ESSAY (PDF)"
                      : isResearch
                        ? "FORMAT ARTIKEL JURNAL (RISET / IMRAD)"
                        : "FORMAT & DOKUMEN MAKALAH"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-forest-950">
                    {isEssay
                      ? "Unggah Dokumen PDF Essay Anda"
                      : `Unggah Dokumen PDF atau Lengkapi Struktur ${jenisLabel}`}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {isEssay
                      ? "Untuk kategori Essay, Anda cukup mengunggah file PDF naskah essay Anda beserta lampiran pendukung bila ada."
                      : isResearch
                        ? "Unggah berkas PDF hasil riset Anda (bebas penamaan file), dan/atau lengkapi komponen riset IMRAD di bawah ini agar lebih cepat ditelaah Editor & Reviewer."
                        : "Unggah berkas PDF makalah Anda (bebas penamaan file), dan/atau lengkapi bagian pokok makalah secara ringkas di bawah ini."}
                  </p>
                </div>

                {/* Upload Berkas PDF Utama & Pendukung */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-paper p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-forest-950">
                      <FileUp className="size-4 text-forest-700" /> Berkas Naskah {jenisLabel} (PDF)
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      PDF · maks. 10 MB · bebas nama file. {initialDraft?.hasExistingFile ? "(Sudah ada berkas tersimpan)" : ""}
                    </p>
                    {pdfFile ? (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-forest-300 bg-forest-50 px-3 py-2 text-xs">
                        <span className="flex min-w-0 items-center gap-2 font-mono text-forest-900">
                          <FileText className="size-4 shrink-0 text-forest-700" />
                          <span className="truncate">{pdfFile.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setPdfFile(null)}
                          className="shrink-0 font-semibold text-red-700 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="btn btn-primary btn-sm mt-3 w-full"
                      >
                        <FileUp className="size-3.5" /> Pilih File PDF Naskah
                      </button>
                    )}
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPickPdf(f, "main");
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div className="rounded-xl border border-line bg-paper p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-forest-950">
                      <Paperclip className="size-4 text-forest-700" />{" "}
                      {isResearch ? "Lampiran Riset / Instrumen (Opsional)" : "Lampiran Pendukung (Opsional)"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {isResearch
                        ? "PDF instrumen, tabel data, atau surat orisinalitas · maks. 10 MB"
                        : "Surat pernyataan orisinalitas atau lampiran tambahan · maks. 10 MB"}
                    </p>
                    {extraPdfFile ? (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-forest-300 bg-forest-50 px-3 py-2 text-xs">
                        <span className="flex min-w-0 items-center gap-2 font-mono text-forest-900">
                          <FileText className="size-4 shrink-0 text-forest-700" />
                          <span className="truncate">{extraPdfFile.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setExtraPdfFile(null)}
                          className="shrink-0 font-semibold text-red-700 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => extraPdfRef.current?.click()}
                        className="btn btn-outline btn-sm mt-3 w-full bg-white"
                      >
                        Pilih File Pendukung
                      </button>
                    )}
                    <input
                      ref={extraPdfRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPickPdf(f, "extra");
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>

                {/* Struktur Format Terstruktur (Hanya untuk Makalah & Artikel Jurnal Riset — Dihapus untuk Essay) */}
                {!isEssay && (
                  <div className="space-y-5 border-t border-line pt-5">
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-forest-800">
                      {isResearch
                        ? "Struktur Artikel Jurnal / Riset (IMRAD) — Opsional jika PDF sudah lengkap"
                        : "Struktur Makalah Akademik — Opsional jika PDF sudah lengkap"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Gunakan Rich Text Editor di bawah ini apabila ingin menampilkan ringkasan atau isi naskah secara langsung di halaman baca.
                    </p>
                  </div>

                  {isResearch ? (
                    <>
                      <RichTextEditor
                        label="1. Pendahuluan & Rumusan Riset"
                        hint="Latar belakang masalah penelitian, gap riset terdahulu, dan tujuan penelitian."
                        placeholder="Tuliskan latar belakang dan tujuan penelitian Anda..."
                        value={pendahuluan}
                        onChange={setPendahuluan}
                        minHeight={140}
                      />
                      <RichTextEditor
                        label="2. Metode Penelitian"
                        hint="Jelaskan desain riset, populasi/sampel, instrumen pengumpulan data, dan teknik analisis."
                        placeholder="Uraikan metode penelitian yang digunakan..."
                        value={metodePenelitian}
                        onChange={setMetodePenelitian}
                        minHeight={160}
                      />
                      <RichTextEditor
                        label="3. Hasil & Pembahasan"
                        hint="Paparkan data hasil penelitian (dapat disertai tabel/gambar) serta analisis perbandingannya."
                        placeholder="Tuliskan temuan riset dan pembahasannya..."
                        value={hasilPembahasan}
                        onChange={setHasilPembahasan}
                        minHeight={180}
                      />
                      <RichTextEditor
                        label="4. Kesimpulan & Saran"
                        hint="Simpulkan jawaban atas rumusan masalah riset dan implikasi praktisnya."
                        placeholder="Tuliskan kesimpulan penelitian..."
                        value={kesimpulan}
                        onChange={setKesimpulan}
                        minHeight={120}
                      />
                      <RichTextEditor
                        label="5. Daftar Pustaka"
                        hint="Daftar rujukan jurnal/buku primer (APA/IEEE)."
                        placeholder="Tuliskan referensi ilmiah..."
                        value={daftarPustaka}
                        onChange={setDaftarPustaka}
                        minHeight={110}
                      />
                    </>
                  ) : (
                    <>
                      <RichTextEditor
                        label="1. Pendahuluan & Rumusan Masalah"
                        hint="Latar belakang topik makalah, rumusan masalah, dan tujuan penulisan."
                        placeholder="Tuliskan pendahuluan dan rumusan masalah makalah..."
                        value={pendahuluan}
                        onChange={setPendahuluan}
                        minHeight={140}
                      />
                      <RichTextEditor
                        label="2. Pembahasan & Kajian Teori"
                        hint="Paparkan landasan teori serta analisis sistematis terhadap topik makalah."
                        placeholder="Tuliskan pokok pembahasan makalah..."
                        value={pembahasan}
                        onChange={setPembahasan}
                        minHeight={190}
                      />
                      <RichTextEditor
                        label="3. Kesimpulan & Saran"
                        hint="Ringkasan hasil kajian makalah serta rekomendasi."
                        placeholder="Tuliskan kesimpulan makalah..."
                        value={kesimpulan}
                        onChange={setKesimpulan}
                        minHeight={120}
                      />
                      <RichTextEditor
                        label="4. Daftar Pustaka"
                        hint="Sumber rujukan buku, artikel, atau dokumen resmi yang digunakan."
                        placeholder="Tuliskan daftar pustaka..."
                        value={daftarPustaka}
                        onChange={setDaftarPustaka}
                        minHeight={110}
                      />
                    </>
                  )}
                  </div>
                )}
              </div>
            )}

            {/* BAGIAN D — PENGATURAN PUBLIKASI */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="eyebrow">D. PENGATURAN PUBLIKASI</p>
                  <h2 className="mt-1 text-xl font-semibold text-forest-950">Pratinjau &amp; Pengiriman Naskah</h2>
                </div>

                {/* Kartu Ringkasan */}
                <div className="overflow-hidden rounded-2xl border border-line bg-paper">
                  {coverPreview && (
                    <img src={coverPreview} alt="Sampul naskah" className="h-44 w-full object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="rounded bg-forest-950 px-2 py-0.5 font-bold text-gold-300">{jenisLabel}</span>
                      <span className="rounded bg-sheet px-2 py-0.5 font-semibold text-forest-800 ring-1 ring-line">
                        {topik || "Kategori belum dipilih"}
                      </span>
                      {isResearch && (
                        <span className="rounded bg-gold-50 px-2 py-0.5 font-semibold text-forest-900 ring-1 ring-gold-300">
                          Riset: {jenisRiset}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2.5 text-xl font-semibold text-forest-950">
                      {judul || `Judul ${jenisLabel} belum diisi`}
                    </h3>
                    {subjudul && <p className="mt-1 text-sm text-muted">{subjudul}</p>}
                    <p className="mt-2 text-xs leading-relaxed text-ink/80">
                      {abstrak || "Ringkasan / abstrak belum diisi."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 font-mono text-xs text-muted">
                      <span>
                        Penulis: <strong className="text-ink">{membersList[0]?.nama || "—"}</strong>
                        {prodi ? ` · ${prodi}` : ""}
                      </span>
                      <span>
                        {pdfFile
                          ? `PDF: ${pdfFile.name}`
                          : initialDraft?.hasExistingFile
                            ? "PDF tersimpan"
                            : "Format teks terstruktur"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visibilitas */}
                <div>
                  <label className="label">Visibilitas Setelah Diterbitkan</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setVisibilitas("publik")}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                        visibilitas === "publik"
                          ? "border-forest-800 bg-forest-50/70 ring-1 ring-forest-700"
                          : "border-line bg-sheet hover:border-forest-400",
                      )}
                    >
                      <Globe className="mt-0.5 size-5 shrink-0 text-forest-700" />
                      <div>
                        <p className="text-sm font-bold text-forest-950">Publik</p>
                        <p className="mt-0.5 text-xs text-muted">
                          Jika disetujui Editor, naskah tampil di halaman Katalog Publik dan dapat diakses pembaca.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisibilitas("privat")}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                        visibilitas === "privat"
                          ? "border-forest-800 bg-forest-50/70 ring-1 ring-forest-700"
                          : "border-line bg-sheet hover:border-forest-400",
                      )}
                    >
                      <Lock className="mt-0.5 size-5 shrink-0 text-forest-700" />
                      <div>
                        <p className="text-sm font-bold text-forest-950">Privat</p>
                        <p className="mt-0.5 text-xs text-muted">
                          Tersimpan sebagai arsip internal untuk Penulis, Editor, dan Reviewer (tidak tampil di beranda umum).
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Pernyataan Wajib */}
                <div className="space-y-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-forest-950">
                    <input
                      type="checkbox"
                      checked={agreePublish}
                      onChange={(e) => setAgreePublish(e.target.checked)}
                      className="mt-0.5 size-4 accent-forest-700"
                    />
                    <span>
                      <strong>Persetujuan Publikasi:</strong> Saya menyetujui ketentuan kurasi dan publikasi karya ilmiah UKM SIMPEL.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-forest-950">
                    <input
                      type="checkbox"
                      checked={agreeOriginal}
                      onChange={(e) => setAgreeOriginal(e.target.checked)}
                      className="mt-0.5 size-4 accent-forest-700"
                    />
                    <span>
                      <strong>Pernyataan Orisinalitas:</strong> Saya menyatakan naskah ini karya orisinal bebas plagiarisme.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="mt-5 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Footer Aksi */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="btn btn-outline btn-sm"
              >
                <ArrowLeft className="size-4" /> Sebelumnya
              </button>
              {step < SECTIONS.length - 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(SECTIONS.length - 1, s + 1))}
                  className="btn btn-outline btn-sm"
                >
                  Lanjut Bagian {SECTIONS[step + 1].code} <ArrowRight className="size-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void saveSubmission("draft")}
                disabled={submitting !== null || !judul.trim()}
                className="btn btn-outline"
              >
                {submitting === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Simpan Draft
              </button>
              <button
                type="button"
                onClick={() => void saveSubmission("submit")}
                disabled={submitting !== null}
                className="btn btn-gold"
              >
                {submitting === "submit" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Ajukan Publikasi
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Checklist & Panduan */}
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-line bg-forest-950 p-4 text-white">
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-gold-300">
                {jenisLabel} · {topik || "Pilih Bidang"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                {judul || `${jenisLabel} Baru`}
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-forest-200">
                <Eye className="size-3.5" /> Visibilitas: {visibilitas === "publik" ? "Publik" : "Privat"}
              </p>
            </div>
            <ul className="space-y-2.5 p-4 text-xs">
              {[
                [`A. Informasi ${jenisLabel}`, infoComplete, 0],
                ["B. Identitas penulis (nama & email)", authorComplete, 1],
                [
                  isEssay
                    ? "C. Unggah PDF Essay"
                    : isResearch
                      ? "C. PDF atau struktur riset IMRAD"
                      : "C. PDF atau struktur makalah",
                  bodyComplete,
                  2,
                ],
                ["D. Persetujuan & pernyataan orisinalitas", agreePublish && agreeOriginal, 3],
              ].map(([label, ok, targetStep]) => (
                <li key={String(label)}>
                  <button
                    type="button"
                    onClick={() => setStep(Number(targetStep))}
                    className="flex w-full items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-paper"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded",
                        ok ? "bg-forest-700 text-white" : "border border-line-strong",
                      )}
                    >
                      {ok ? <Check className="size-3" /> : null}
                    </span>
                    <span className={ok ? "font-medium text-ink" : "text-muted"}>{String(label)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4 text-xs">
            <p className="flex items-center gap-1.5 font-mono font-bold uppercase text-forest-900">
              {isResearch ? <FlaskConical className="size-3.5 text-forest-700" /> : <BookOpen className="size-3.5 text-forest-700" />}
              Format {jenisLabel}
            </p>
            <p className="mt-1.5 leading-relaxed text-muted">
              {isEssay
                ? "Untuk Essay, cukup unggah berkas PDF Essay Anda di bagian C tanpa perlu mengisi kotak konten isi essay."
                : isResearch
                  ? "Artikel Jurnal berfokus pada hasil riset ilmiah (desain riset, metode penelitian, hasil & pembahasan, kesimpulan). Anda dapat langsung mengunggah PDF riset atau menulis ringkasan IMRAD."
                  : "Makalah membahas kajian topik akademik secara sistematis (rumusan masalah, pembahasan teori, kesimpulan). Unggah PDF makalah Anda atau lengkapi struktur ringkasnya."}
            </p>
          </div>

          {publishReady && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-950">
              <p className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="size-4 text-emerald-700" /> Siap Diajukan ke Editor!
              </p>
              <p className="mt-1 text-emerald-900/80">
                Seluruh syarat wajib telah lengkap. Klik <strong>Ajukan Publikasi</strong> untuk mengirim ke Editor.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
