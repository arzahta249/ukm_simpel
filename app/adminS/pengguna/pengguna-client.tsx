"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { Avatar, SectionCard } from "@/components/ui";
import type { Role, User } from "@/lib/data";
import { formatShortDate } from "@/lib/utils";
import { createStaffOrUserAction, deleteUserAction, resetUserPasswordAction } from "@/app/actions";

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-forest-950 text-gold-300",
  juri: "bg-gold-100 text-forest-950 ring-1 ring-gold-300",
  peserta: "bg-forest-50 text-forest-800 ring-1 ring-forest-200",
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Editor",
  juri: "Reviewer",
  peserta: "Penulis",
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
  const [showPass, setShowPass] = useState(false);
  const [filterRole, setFilterRole] = useState<"all" | "juri" | "peserta">("all");
  const [lastCredentials, setLastCredentials] = useState<{
    title: string;
    nama: string;
    email: string;
    password: string;
    role: Role;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPass, setNewPass] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const filteredUsers =
    filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  const reviewerCount = users.filter((u) => u.role === "juri").length;
  const penulisCount = users.filter((u) => u.role === "peserta").length;

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
    if (res.created) {
      setLastCredentials({
        title: `Akun ${ROLE_LABEL[res.created.role]} Berhasil Dibuat`,
        nama: res.created.nama,
        email: res.created.email,
        password: res.created.password,
        role: res.created.role,
      });
      setCopied(false);
    }
    form.reset();
    router.refresh();
  }

  async function onResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetLoading(true);
    setError(null);
    const res = await resetUserPasswordAction(resetTarget.id, newPass);
    setResetLoading(false);
    if (!res.ok) {
      setError(res.error || "Gagal mengatur ulang kata sandi.");
      return;
    }
    if (res.reset) {
      setLastCredentials({
        title: "Kata Sandi Berhasil Diatur Ulang",
        nama: res.reset.nama,
        email: res.reset.email,
        password: res.reset.password,
        role: resetTarget.role,
      });
      setCopied(false);
    }
    setResetTarget(null);
    setNewPass("");
    router.refresh();
  }

  async function copyCredentials() {
    if (!lastCredentials) return;
    const portalPath =
      lastCredentials.role === "juri" ? "/reviewer" : "/login";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = [
      `Akses Login ${ROLE_LABEL[lastCredentials.role]} SIMPEL UPS Tegal`,
      `Nama: ${lastCredentials.nama}`,
      `Email: ${lastCredentials.email}`,
      `Kata Sandi: ${lastCredentials.password}`,
      `Link Portal: ${origin}${portalPath}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {envAdmins.map((a, idx) => (
          <div key={a.email} className="card flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest-950 text-gold-300">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-mono text-[10.5px] font-bold uppercase text-forest-700">
                  EDITOR ENV #{idx + 1} (.env.local)
                </p>
                <p className="text-sm font-semibold text-ink">{a.nama}</p>
                <p className="font-mono text-xs text-muted">{a.email}</p>
              </div>
            </div>
            <span className="rounded-lg bg-forest-950 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-gold-300">
              Aktif
            </span>
          </div>
        ))}
      </div>

      {lastCredentials && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase text-emerald-800">
                {lastCredentials.title}
              </p>
              <p className="mt-1 text-sm font-semibold text-forest-950">
                {lastCredentials.nama} ({ROLE_LABEL[lastCredentials.role]})
              </p>
              <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-forest-900">
                <span>
                  Email: <strong>{lastCredentials.email}</strong>
                </span>
                <span>
                  Sandi: <strong>{lastCredentials.password}</strong>
                </span>
                <span>
                  Portal:{" "}
                  <strong>
                    {lastCredentials.role === "juri" ? "/reviewer" : "/login"}
                  </strong>
                </span>
              </div>
            </div>
            <button type="button" onClick={copyCredentials} className="btn btn-primary btn-sm">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Tersalin" : "Salin Kredensial Login"}
            </button>
          </div>
        </div>
      )}

      {resetTarget && (
        <form
          onSubmit={onResetPassword}
          className="rounded-2xl border border-gold-400 bg-gold-50 p-4 sm:flex sm:items-end sm:justify-between sm:gap-4"
        >
          <div className="flex-1">
            <p className="font-mono text-[11px] font-bold uppercase text-forest-900">
              Atur Ulang Kata Sandi · {resetTarget.nama} ({ROLE_LABEL[resetTarget.role]})
            </p>
            <p className="mt-0.5 text-xs text-muted">{resetTarget.email}</p>
            <input
              type="text"
              required
              minLength={6}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Masukkan kata sandi baru (minimal 6 karakter)"
              className="input mt-2.5 bg-white"
            />
          </div>
          <div className="mt-3 flex gap-2 sm:mt-0">
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setNewPass("");
              }}
              className="btn btn-outline btn-sm"
            >
              Batal
            </button>
            <button disabled={resetLoading} type="submit" className="btn btn-primary btn-sm">
              {resetLoading ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
              Simpan Sandi Baru
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title={`Daftar Akun Database (${filteredUsers.length})`}
          className="xl:col-span-2"
          action={
            <div className="flex gap-1 rounded-xl border border-line bg-paper p-1">
              {[
                { id: "all" as const, label: `Semua (${users.length})` },
                { id: "juri" as const, label: `Reviewer (${reviewerCount})` },
                { id: "peserta" as const, label: `Penulis (${penulisCount})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterRole(t.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    filterRole === t.id ? "bg-forest-950 text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        >
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
                {filteredUsers.map((u) => (
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
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-muted">{formatShortDate(u.created_at)}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setResetTarget(u);
                            setNewPass("");
                            setError(null);
                          }}
                          className="rounded p-1.5 text-muted hover:bg-gold-50 hover:text-forest-900"
                          title="Atur ulang kata sandi"
                          aria-label="Atur ulang kata sandi"
                        >
                          <KeyRound className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteUserAction(u.id);
                            router.refresh();
                          }}
                          className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-700"
                          title="Hapus akun"
                          aria-label="Hapus pengguna"
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
        </SectionCard>

        <SectionCard title="Buat Akun Reviewer / Penulis Baru" className="h-fit">
          <form onSubmit={onCreate} className="space-y-4 p-5 sm:p-6">
            <p className="rounded-xl border border-gold-300 bg-gold-50 p-3 text-xs leading-relaxed text-forest-950">
              Akun <strong>Reviewer</strong> bersifat privat dan dapat masuk langsung melalui jalur middleware{" "}
              <code>/reviewer</code> atau <code>/adminS/reviewer</code> (maupun panel privasi <code>/adminS</code>).
            </p>
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
                <select name="role" defaultValue="juri" className="input">
                  <option value="juri">Reviewer / Juri</option>
                  <option value="peserta">Penulis / Peserta</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Kata Sandi Awal (Min. 6 karakter)</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  minLength={6}
                  required
                  defaultValue="simpel123"
                  className="input !pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label="Lihat sandi"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
            <button disabled={loading} type="submit" className="btn btn-primary w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Buat Akun &amp; Simpan
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
