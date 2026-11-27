"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  Database,
  FileText,
  Languages,
  Plus,
  Quote,
  Ruler,
  ShieldCheck,
  Sparkles,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RuleGroup = "format" | "isi";

const RULES: Array<{
  id: number;
  group: RuleGroup;
  title: string;
  highlight: string;
  desc: string;
  icon: typeof FileText;
  tone: string;
}> = [
  {
    id: 1,
    group: "format",
    title: "Panjang Tulisan",
    highlight: "250–280 kata",
    desc: "Ringkas, padat, dan langsung ke inti gagasan.",
    icon: FileText,
    tone: "bg-gold-100 text-forest-950",
  },
  {
    id: 3,
    group: "format",
    title: "Jenis & Ukuran Font",
    highlight: "Times New Roman · 12",
    desc: "Gunakan font standar Times New Roman ukuran 12 pt.",
    icon: Type,
    tone: "bg-forest-100 text-forest-900",
  },
  {
    id: 5,
    group: "format",
    title: "Spasi & Margin",
    highlight: "Spasi 1,5 · Margin 3 3 4 4",
    desc: "Jarak antarbaris 1,5 dengan margin 3 cm & 4 cm.",
    icon: Ruler,
    tone: "bg-emerald-100 text-emerald-950",
  },
  {
    id: 2,
    group: "isi",
    title: "Sesuai Data & Jurnal",
    highlight: "Berbasis fakta",
    desc: "Argumen dan pembahasan selaras dengan data/jurnal rujukan.",
    icon: Database,
    tone: "bg-sky-100 text-sky-950",
  },
  {
    id: 7,
    group: "isi",
    title: "Bahasa Indonesia Baik",
    highlight: "Jelas & rapi",
    desc: "Gunakan bahasa Indonesia yang baik, lugas, dan mudah dipahami.",
    icon: Languages,
    tone: "bg-forest-100 text-forest-900",
  },
  {
    id: 8,
    group: "isi",
    title: "Orisinal & Anti-Plagiat",
    highlight: "Karya asli",
    desc: "Tulisan murni hasil pemikiranmu sendiri, bukan plagiarisme.",
    icon: ShieldCheck,
    tone: "bg-gold-100 text-forest-950",
  },
  {
    id: 9,
    group: "isi",
    title: "Cantumkan Referensi",
    highlight: "Sumber jelas",
    desc: "Sertakan daftar sumber referensi yang kamu kutip.",
    icon: Quote,
    tone: "bg-amber-100 text-amber-950",
  },
  {
    id: 10,
    group: "isi",
    title: "Sumber Data Terbaru",
    highlight: "< 3 tahun",
    desc: "Pakai referensi dan data terbaru kurang dari 3 tahun terakhir.",
    icon: CalendarClock,
    tone: "bg-emerald-100 text-emerald-950",
  },
];

const QUICK_SUMMARY = [
  "1. Word 250–280 kata",
  "2. Sesuai data/jurnalnya",
  "3. Font Times New Roman",
  "4. Ukuran font 12",
  "5. Spasi 1,5",
  "6. Margin 3 3 4 4",
  "7. Bahasa Indonesia baik",
  "8. Orisinal (non-plagiat)",
  "9. Ada sumber referensi",
  "10. Sumber data < 3 tahun",
];

export function PanduanFaqSection({
  faqs,
}: {
  faqs: Array<{ q: string; a: string }>;
}) {
  const [tab, setTab] = useState<"semua" | "format" | "isi">("semua");
  const [checked, setChecked] = useState<string[]>([]);

  const visibleRules = tab === "semua" ? RULES : RULES.filter((r) => r.group === tab);
  const progress = Math.round((checked.length / QUICK_SUMMARY.length) * 100);

  function toggleItem(item: string) {
    setChecked((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }

  return (
    <section id="panduan" className="scroll-mt-24 border-t border-line bg-sheet/70 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Ramah */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-gold-50 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-forest-900">
              <Sparkles className="size-3.5 text-gold-600" /> Panduan Essay &amp; FAQ
            </span>
            <h2 className="mt-3 text-3xl font-semibold text-forest-950 sm:text-5xl">
              Panduan Penulisan Essay,{" "}
              <span className="italic text-forest-700">gampang kok!</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Khusus untuk penulisan <strong>Essay KTI UKM SIMPEL</strong>, pastikan 10 ketentuan simpel ini sudah beres sebelum dokumenmu dikirim.
            </p>
          </div>
          <Link href="/dashboard/submit" className="btn btn-primary self-start md:self-auto">
            Siap Unggah Essay <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Kartu Ketentuan + Ceklis Interaktif */}
        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Kiri: Kartu Visual Friendly */}
          <div className="lg:col-span-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-2xl border border-line bg-paper p-1">
                {[
                  { id: "semua" as const, label: "Semua Aturan" },
                  { id: "format" as const, label: "Format Word" },
                  { id: "isi" as const, label: "Isi & Referensi" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
                      tab === t.id
                        ? "bg-forest-950 text-white shadow-soft"
                        : "text-muted hover:text-forest-950",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs text-muted">Ringkas · Mudah dibaca dalam 10 detik</span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {visibleRules.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={rule.id}
                    className="group flex items-start gap-3.5 rounded-2xl border border-line bg-sheet p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-400 hover:shadow-lift"
                  >
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                        rule.tone,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <p className="text-xs font-semibold text-muted">{rule.title}</p>
                        <span className="rounded-full bg-paper px-2.5 py-0.5 font-mono text-[11px] font-bold text-forest-900 ring-1 ring-line">
                          {rule.highlight}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{rule.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kanan: Mini Ceklis Interaktif "Cek 10 Poin" */}
          <div className="lg:col-span-4">
            <div className="flex h-full flex-col justify-between rounded-3xl border border-line-strong bg-gradient-to-b from-paper to-gold-50/50 p-5 shadow-soft sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-950">
                    <BookOpen className="size-4 text-forest-700" /> Ceklis Cepat Essay (10 Poin)
                  </span>
                  <span className="rounded-full bg-forest-950 px-2.5 py-0.5 font-mono text-[11px] font-bold text-gold-300">
                    {checked.length}/10
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Klik untuk menandai poin yang sudah siap di dokumenmu:
                </p>

                {/* Progress Bar */}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-dark">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forest-500 to-gold-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <ul className="mt-4 space-y-1.5">
                  {QUICK_SUMMARY.map((item) => {
                    const isDone = checked.includes(item);
                    return (
                      <li key={item}>
                        <button
                          type="button"
                          onClick={() => toggleItem(item)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors",
                            isDone
                              ? "bg-forest-100/80 text-forest-950"
                              : "bg-sheet/80 text-ink/85 hover:bg-sheet",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-md transition-colors",
                              isDone
                                ? "bg-forest-700 text-white"
                                : "border border-line-strong bg-white",
                            )}
                          >
                            {isDone && <Check className="size-3" />}
                          </span>
                          <span className={isDone ? "line-through opacity-75" : ""}>{item}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {checked.length === QUICK_SUMMARY.length && (
                <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-900">
                  Mantap! Semua syarat sudah beres — naskahmu siap diunggah.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tanya Jawab (FAQ) */}
        <div className="mt-10 grid gap-3.5 md:grid-cols-2">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-line bg-sheet shadow-soft transition-all open:border-forest-500 open:bg-paper/40 [&_summary::-webkit-details-marker]:hidden"
              open={i === 0}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[15px] font-bold text-forest-950 sm:px-6 sm:py-5">
                <span className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-gold-100 font-mono text-xs font-bold text-forest-950 group-open:bg-forest-950 group-open:text-gold-300">
                    0{i + 1}
                  </span>
                  {f.q}
                </span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-800 transition-transform duration-300 group-open:rotate-45 group-open:bg-forest-800 group-open:text-white">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="px-5 pb-5 pl-[3.75rem] text-sm leading-relaxed text-muted sm:px-6 sm:pl-[4.25rem]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
