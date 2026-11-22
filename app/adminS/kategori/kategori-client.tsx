"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FolderTree, Loader2, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/lib/data";
import { createCategoryAction, deleteCategoryAction, toggleCategoryAction } from "@/app/actions";

export function KategoriClient({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<number, number>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    await createCategoryAction(new FormData(form));
    form.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="card overflow-hidden xl:col-span-2">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Kategori KTI</th>
                <th>Periode</th>
                <th>Status (Klik untuk ubah)</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-paper text-forest-800">
                        <FolderTree className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{c.nama}</p>
                        <p className="text-xs text-muted">{c.deskripsi}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-sm font-bold text-forest-900">{counts[c.id] ?? 0}</td>
                  <td>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleCategoryAction(c.id);
                        router.refresh();
                      }}
                      className={`rounded px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase ${
                        c.is_active
                          ? "bg-forest-50 text-forest-800 ring-1 ring-forest-300"
                          : "bg-stone-100 text-muted ring-1 ring-stone-300"
                      }`}
                    >
                      {c.is_active ? "● Aktif" : "○ Nonaktif"}
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteCategoryAction(c.id);
                          router.refresh();
                        }}
                        className="rounded p-2 text-muted hover:bg-red-50 hover:text-red-700"
                        aria-label="Hapus"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={onCreate} className="card h-fit p-5 sm:p-6">
        <h2 className="font-sans text-sm font-bold text-forest-950">Tambah Kategori Baru</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Nama Kategori</label>
            <input name="nama" required className="input" placeholder="cth. Tinjauan Pustaka Sistematis" />
          </div>
          <div>
            <label className="label">Deskripsi Ruang Lingkup</label>
            <textarea
              name="deskripsi"
              rows={3}
              required
              className="input resize-none"
              placeholder="Deskripsi singkat jenis naskah"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <input name="is_active" type="checkbox" defaultChecked className="size-4 accent-forest-700" /> Aktifkan kategori
          </label>
          <button disabled={loading} type="submit" className="btn btn-primary w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Simpan Kategori
          </button>
        </div>
      </form>
    </div>
  );
}

