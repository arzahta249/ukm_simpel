"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Save } from "lucide-react";
import { SectionCard } from "@/components/ui";
import { updatePasswordAction, updateProfileAction } from "@/app/actions";

export function ProfilForms({
  user,
}: {
  user: { nama: string; email: string; institusi: string; nim_nisn: string; no_hp: string };
}) {
  const router = useRouter();
  const [savingBio, setSavingBio] = useState(false);
  const [bioMsg, setBioMsg] = useState<string | null>(null);
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onBioSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingBio(true);
    setBioMsg(null);
    const res = await updateProfileAction(new FormData(e.currentTarget));
    setSavingBio(false);
    setBioMsg(res.message);
    router.refresh();
  }

  async function onPassSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPass(true);
    setPassMsg(null);
    const form = e.currentTarget;
    const res = await updatePasswordAction(new FormData(form));
    setSavingPass(false);
    setPassMsg({ ok: res.ok, text: res.message });
    if (res.ok) form.reset();
  }

  return (
    <>
      <SectionCard title="Biodata Penulis (Tabel users)">
        <form onSubmit={onBioSubmit} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label className="label">Nama Lengkap</label>
            <input name="nama" required className="input" defaultValue={user.nama} />
          </div>
          <div>
            <label className="label">Alamat Email</label>
            <input name="email" type="email" required className="input" defaultValue={user.email} />
          </div>
          <div>
            <label className="label">Institusi / Perguruan Tinggi</label>
            <input name="institusi" required className="input" defaultValue={user.institusi} />
          </div>
          <div>
            <label className="label">NIM / NISN</label>
            <input name="nim_nisn" required className="input" defaultValue={user.nim_nisn} />
          </div>
          <div>
            <label className="label">No. HP / WhatsApp</label>
            <input name="no_hp" className="input" defaultValue={user.no_hp} />
          </div>
          <div className="flex items-end justify-end">
            <button disabled={savingBio} type="submit" className="btn btn-primary">
              {savingBio ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan Biodata
            </button>
          </div>
          {bioMsg && (
            <p className="flex items-center gap-2 rounded border border-forest-300 bg-forest-50 p-3 text-xs font-semibold text-forest-800 sm:col-span-2">
              <CheckCircle2 className="size-4 shrink-0" /> {bioMsg}
            </p>
          )}
        </form>
      </SectionCard>

      <SectionCard title="Keamanan Akun" description="Perbarui kata sandi akun penulis">
        <form onSubmit={onPassSubmit} className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <label className="label">Kata Sandi Saat Ini</label>
            <input name="current" type="password" required className="input" placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Kata Sandi Baru</label>
            <input name="nextPass" type="password" required className="input" placeholder="Min. 6 karakter" />
          </div>
          <div>
            <label className="label">Konfirmasi Sandi Baru</label>
            <input name="confirm" type="password" required className="input" placeholder="••••••••" />
          </div>
          <div className="flex items-center justify-between gap-3 sm:col-span-3">
            {passMsg ? (
              <span className={`text-xs font-semibold ${passMsg.ok ? "text-forest-800" : "text-red-700"}`}>
                {passMsg.text}
              </span>
            ) : (
              <span />
            )}
            <button disabled={savingPass} type="submit" className="btn btn-outline">
              {savingPass ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Perbarui Kata Sandi
            </button>
          </div>
        </form>
      </SectionCard>
    </>
  );
}

