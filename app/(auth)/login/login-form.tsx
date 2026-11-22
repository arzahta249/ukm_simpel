"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { loginAction } from "@/app/actions";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const next = params.get("next") ?? "";
  const isAdminTarget = next.startsWith("/adminS");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (next) formData.set("next", next);

    const res = await loginAction(formData);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Gagal masuk. Periksa kembali kredensial Anda.");
      return;
    }

    router.push(res.redirectTo || "/dashboard");
    router.refresh();
  }

  return (
    <>
      {isAdminTarget && (
        <div className="mt-5 rounded-md border border-gold-400 bg-gold-50 p-4 text-xs text-forest-950">
          <div className="flex items-center gap-2 font-mono font-bold uppercase text-forest-900">
            <ShieldCheck className="size-4 text-forest-800" />
            <span>Akses Panel Redaksi (/adminS)</span>
          </div>
          <p className="mt-1 text-muted">
            Silakan masuk menggunakan salah satu dari 2 akun Admin yang terdaftar di <code>.env.local</code>:
          </p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin1@simpel.ac.id");
                setPassword("adminsimpel1");
              }}
              className="rounded border border-line-strong bg-sheet px-3 py-2 text-left font-mono text-[11px] hover:border-forest-700"
            >
              <strong className="block text-forest-900">Admin 1 (Klik isi otomatis)</strong>
              <span className="text-muted">admin1@simpel.ac.id</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("admin2@simpel.ac.id");
                setPassword("adminsimpel2");
              }}
              className="rounded border border-line-strong bg-sheet px-3 py-2 text-left font-mono text-[11px] hover:border-forest-700"
            >
              <strong className="block text-forest-900">Admin 2 (Klik isi otomatis)</strong>
              <span className="text-muted">admin2@simpel.ac.id</span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="label">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAdminTarget ? "admin1@simpel.ac.id" : "nama@upstegal.ac.id"}
              className="input !pl-10"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="label !mb-0">
              Kata Sandi
            </label>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input !px-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label="Tampilkan sandi"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

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
              {isAdminTarget ? "Masuk ke Panel Redaksi (/adminS)" : "Masuk ke Portal"}{" "}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {!isAdminTarget && (
        <p className="mt-7 text-center text-sm text-muted">
          Belum memiliki akun penulis?{" "}
          <Link href="/register" className="font-semibold text-forest-800 hover:underline">
            Registrasi Akun Baru
          </Link>
        </p>
      )}
    </>
  );
}
