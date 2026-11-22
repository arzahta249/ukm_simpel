"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { registerAction } from "@/app/actions";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await registerAction(formData);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Registrasi gagal.");
      return;
    }

    router.push(res.redirectTo || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4">
      <div>
        <label className="label" htmlFor="nama">
          Nama Lengkap
        </label>
        <input id="nama" name="nama" required className="input" placeholder="Sesuai KTM / identitas resmi" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="institusi">
            Institusi / Kampus
          </label>
          <input id="institusi" name="institusi" required className="input" placeholder="Universitas Pancasakti Tegal" />
        </div>
        <div>
          <label className="label" htmlFor="nim_nisn">
            NIM / NISN
          </label>
          <input id="nim_nisn" name="nim_nisn" required className="input" placeholder="2201010023" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">
            Alamat Email
          </label>
          <input id="email" name="email" type="email" required className="input" placeholder="nama@email.com" />
        </div>
        <div>
          <label className="label" htmlFor="no_hp">
            No. HP / WhatsApp
          </label>
          <input id="no_hp" name="no_hp" required className="input" placeholder="08xxxxxxxxxx" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">
            Kata Sandi
          </label>
          <input id="password" name="password" type="password" required className="input" placeholder="Min. 6 karakter" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Ulangi Kata Sandi
          </label>
          <input id="confirm" name="confirm" type="password" required className="input" placeholder="••••••••" />
        </div>
      </div>

      <label className="flex items-start gap-2.5 pt-1 text-xs leading-relaxed text-muted">
        <input type="checkbox" required className="mt-0.5 size-4 accent-forest-700" />
        <span>
          Saya menyetujui{" "}
          <Link href="/#panduan" className="font-semibold text-forest-800">
            pedoman publikasi ilmiah
          </Link>{" "}
          dan menjamin keaslian data penulis yang saya isi.
        </span>
      </label>

      {error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800">
          {error}
        </p>
      )}

      <button disabled={loading} className="btn btn-primary btn-lg w-full">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Daftar &amp; Masuk ke Portal <ArrowRight className="size-4" />
          </>
        )}
      </button>

      <p className="pt-2 text-center text-sm text-muted">
        Sudah memiliki akun?{" "}
        <Link href="/login" className="font-semibold text-forest-800 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
