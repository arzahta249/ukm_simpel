import type { EssayBody } from "@/lib/data";
import { sanitizeRichHtml, stripHtml } from "@/lib/utils";

export function EssayContentView({
  isiEssay,
  jenisRiset,
}: {
  isiEssay?: EssayBody;
  jenisRiset?: string;
}) {
  if (!isiEssay) return null;

  const isResearchFormat =
    Boolean(jenisRiset) ||
    stripHtml(isiEssay.metode_penelitian || "").length > 0 ||
    stripHtml(isiEssay.hasil_pembahasan || "").length > 0;

  const sections = isResearchFormat
    ? [
        { key: "pendahuluan", title: "1. Pendahuluan & Rumusan Riset", html: isiEssay.pendahuluan },
        { key: "metode", title: "2. Metode Penelitian", html: isiEssay.metode_penelitian || "" },
        {
          key: "hasil",
          title: "3. Hasil & Pembahasan",
          html: isiEssay.hasil_pembahasan || isiEssay.pembahasan || "",
        },
        { key: "kesimpulan", title: "4. Kesimpulan & Saran", html: isiEssay.kesimpulan },
        { key: "daftar_pustaka", title: "5. Daftar Pustaka", html: isiEssay.daftar_pustaka || "" },
      ]
    : [
        { key: "pendahuluan", title: "1. Pendahuluan & Rumusan Masalah", html: isiEssay.pendahuluan },
        { key: "pembahasan", title: "2. Pembahasan & Kajian Teori", html: isiEssay.pembahasan },
        { key: "kesimpulan", title: "3. Kesimpulan & Saran", html: isiEssay.kesimpulan },
        { key: "daftar_pustaka", title: "4. Daftar Pustaka", html: isiEssay.daftar_pustaka || "" },
      ];

  const nonEmpty = sections.filter(
    (sec) => stripHtml(sec.html).length > 0 || /<img|<table/i.test(sec.html),
  );

  if (nonEmpty.length === 0) return null;

  return (
    <div className="space-y-6">
      {jenisRiset && (
        <div className="inline-flex rounded-lg border border-forest-200 bg-forest-50 px-3 py-1 font-mono text-xs font-semibold text-forest-800">
          Desain / Jenis Riset: {jenisRiset}
        </div>
      )}
      {nonEmpty.map((sec) => (
        <section key={sec.key} className="border-b border-line pb-6 last:border-b-0 last:pb-0">
          <h3 className="font-serif text-lg font-semibold text-forest-950 sm:text-xl">{sec.title}</h3>
          <div
            className="rich-content mt-3"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(sec.html) }}
          />
        </section>
      ))}
    </div>
  );
}
