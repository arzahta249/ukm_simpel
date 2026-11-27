"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Rocket, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createEventAction } from "@/app/actions";
import type { EventStatus } from "@/lib/data";

type Crit = { nama: string; bobot: number };

export function EventForm({ categories }: { categories: { id: number; nama: string }[] }) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 1);
  const [volume, setVolume] = useState("Vol. 05 · No. 02");
  const [tema, setTema] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [maxHalaman, setMaxHalaman] = useState(15);
  const [maxAnggota, setMaxAnggota] = useState(3);

  const [crit, setCrit] = useState<Crit[]>([
    { nama: "Orisinalitas & Kebaruan Gagasan", bobot: 30 },
    { nama: "Kedalaman Substansi & Relevansi Tema", bobot: 30 },
    { nama: "Ketepatan Metodologi & Referensi", bobot: 20 },
    { nama: "Sistematika & Kaidah Bahasa Ilmiah", bobot: 20 },
  ]);
  const [loading, setLoading] = useState(false);

  const total = crit.reduce((a, c) => a + (Number(c.bobot) || 0), 0);
  const valid = total === 100 && crit.every((c) => c.nama.trim()) && nama.trim().length > 3 && tema.trim().length > 3;

  async function save(status: EventStatus) {
    if (!valid) return;
    setLoading(true);
    await createEventAction({
      category_id: categoryId,
      nama,
      tema,
      deskripsi,
      deadline: "2099-12-31",
      max_halaman: maxHalaman,
      max_anggota: maxAnggota,
      volume,
      status,
      criteria: crit,
    });
    setLoading(false);
    router.push("/adminS/events");
    router.refresh();
  }

  return (
    <form
      className="grid gap-6 xl:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        save("open");
      }}
    >
      <div className="space-y-6 xl:col-span-2">
        <section className="card p-5 sm:p-7">
          <h2 className="font-sans text-sm font-bold text-forest-950">Metadata Periode Penerimaan (Tabel events)</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nama Periode / Edisi Publikasi</label>
              <input
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="input"
                placeholder="cth. Publikasi Karya Tulis Ilmiah Mahasiswa — Edisi Genap 2027"
              />
            </div>
            <div>
              <label className="label">Jenis Naskah (Essay, Makalah, Artikel Jurnal)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="input"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Volume / Nomor Terbitan</label>
              <input
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="input"
                placeholder="Vol. 05 · No. 02"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tema Cakupan</label>
              <input
                required
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="input"
                placeholder="cth. Inovasi Teknologi Tepat Guna dan Pemberdayaan Masyarakat"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Deskripsi &amp; Pedoman Penulis</label>
              <textarea
                rows={4}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="input resize-none"
                placeholder="Jelaskan ruang lingkup topik, aturan format penulisan, dan persyaratan berkas…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <div>
                <label className="label">Maks. Halaman</label>
                <input
                  type="number"
                  min={1}
                  value={maxHalaman}
                  onChange={(e) => setMaxHalaman(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Maks. Penulis</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxAnggota}
                  onChange={(e) => setMaxAnggota(Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-sans text-sm font-bold text-forest-950">Rubrik Kriteria Penilaian (Tabel criteria)</h2>
              <p className="mt-0.5 text-xs text-muted">Digunakan reviewer/juri saat menilai naskah (0–100 per kriteria).</p>
            </div>
            <span
              className={cn(
                "rounded px-2.5 py-1 font-mono text-xs font-bold",
                total === 100
                  ? "bg-forest-50 text-forest-800 ring-1 ring-forest-300"
                  : "bg-red-50 text-red-800 ring-1 ring-red-300",
              )}
            >
              Total Bobot: {total}%
            </span>
          </div>

          <div className="mt-5 space-y-2.5">
            {crit.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-md border border-line bg-paper p-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded bg-forest-900 font-mono text-xs font-bold text-white">
                  0{i + 1}
                </span>
                <input
                  className="input"
                  value={c.nama}
                  placeholder="Nama kriteria penilaian"
                  onChange={(e) => setCrit(crit.map((x, j) => (j === i ? { ...x, nama: e.target.value } : x)))}
                />
                <div className="relative w-24 shrink-0">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="input !pr-7 text-right font-mono font-bold"
                    value={c.bobot}
                    onChange={(e) =>
                      setCrit(crit.map((x, j) => (j === i ? { ...x, bobot: Number(e.target.value) } : x)))
                    }
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCrit(crit.filter((_, j) => j !== i))}
                  disabled={crit.length <= 1}
                  className="text-muted hover:text-red-700 disabled:opacity-30"
                  aria-label="Hapus kriteria"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCrit([...crit, { nama: "", bobot: 0 }])}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong py-2.5 text-xs font-semibold text-muted hover:border-forest-700 hover:text-forest-800"
          >
            <Plus className="size-4" /> Tambah Komponen Kriteria
          </button>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="card p-5">
          <h3 className="font-sans text-sm font-bold text-forest-950">Status Penerbitan Periode</h3>
          <p className="mt-1 text-xs text-muted">
            Periode berstatus <strong>Open</strong> akan langsung muncul pada halaman Beranda dan formulir unggah penulis.
          </p>
          <div className="mt-4 space-y-2">
            <button type="submit" disabled={!valid || loading} className="btn btn-primary w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />} Buka Penerimaan Naskah
            </button>
            <button
              type="button"
              disabled={!valid || loading}
              onClick={() => save("draft")}
              className="btn btn-outline w-full"
            >
              <Save className="size-4" /> Simpan sebagai Draft
            </button>
          </div>
          {!valid && (
            <p className="mt-3 font-mono text-xs text-red-700">
              Pastikan nama, tema, dan total bobot kriteria tepat 100%.
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}
