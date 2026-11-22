"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { Avatar, SectionCard } from "@/components/ui";
import type { User } from "@/lib/data";
import { formatShortDate } from "@/lib/utils";
import { createStaffOrUserAction, deleteUserAction } from "@/app/actions";

const ROLE_BADGE = {
  admin: "bg-forest-950 text-gold-300",
  juri: "bg-gold-100 text-forest-950 ring-1 ring-gold-300",
  peserta: "bg-forest-50 text-forest-800 ring-1 ring-forest-200",
};

export function PenggunaClient({
  users,
  envAdmins,
}: {
  users: User[];
  envAdmins: Array<{ email: string; nama: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const res = await createStaffOrUserAction(new FormData(form));
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Gagal menambahkan pengguna.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Info 2 Admin dari .env.local */}
      <div className="grid gap-4 sm:grid-cols-2">
        {envAdmins.map((a, idx) => (
          <div key={a.email} className="card flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-forest-950 text-gold-300">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-mono text-[10.5px] font-bold uppercase text-forest-700">
                  ADMIN ENV #{idx + 1} (.env.local)
                </p>
                <p className="text-sm font-semibold text-ink">{a.nama}</p>
                <p className="font-mono text-xs text-muted">{a.email}</p>
              </div>
            </div>
            <span className="rounded bg-forest-950 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-gold-300">
              Aktif
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title={`Daftar Akun Database (${users.length})`} className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama &amp; Email</th>
                  <th>Institusi</th>
                  <th>NIM / NIDN</th>
                  <th>Role</th>
                  <th>Terdaftar</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.nama} size="sm" />
                        <div>
                          <p className="font-semibold text-ink">{u.nama}</p>
                          <p className="font-mono text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-ink">{u.institusi}</td>
                    <td className="font-mono text-xs text-muted">{u.nim_nisn}</td>
                    <td>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase ${ROLE_BADGE[u.role]}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-muted">{formatShortDate(u.created_at)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteUserAction(u.id);
                          router.refresh();
                        }}
                        className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-700"
                        aria-label="Hapus pengguna"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Tambah Reviewer / Pengguna Baru" className="h-fit">
          <form onSubmit={onCreate} className="space-y-4 p-5 sm:p-6">
            <div>
              <label className="label">Nama Lengkap &amp; Gelar</label>
              <input name="nama" required className="input" placeholder="cth. Dr. Ahmad Fauzi, M.Kom." />
            </div>
            <div>
              <label className="label">Email Institusi</label>
              <input name="email" type="email" required className="input" placeholder="nama@upstegal.ac.id" />
            </div>
            <div>
              <label className="label">Institusi</label>
              <input name="institusi" className="input" defaultValue="Universitas Pancasakti Tegal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">NIDN / NIM</label>
                <input name="nim_nisn" className="input" placeholder="NIDN-06..." />
              </div>
              <div>
                <label className="label">Role Akun</label>
                <select name="role" className="input">
                  <option value="juri">Juri / Reviewer</option>
                  <option value="peserta">Penulis / Peserta</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Kata Sandi Awal</label>
              <input name="password" type="password" defaultValue="simpel123" className="input" />
            </div>
            {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
            <button disabled={loading} type="submit" className="btn btn-primary w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Daftarkan ke Database
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}

