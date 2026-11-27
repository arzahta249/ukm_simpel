"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Award, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { loginAction } from "@/app/actions";

type StaffRole = "admin" | "juri";

export interface PrivateReviewerOption {
  id: string;
  nama: string;
  email: string;
  institusi: string;
  password: string;
}

export function LoginForm({ reviewers = [] }: { reviewers?: PrivateReviewerOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const passwordRef = useRef<HTMLInputElement>(null);

  const isReviewerNext = next.startsWith("/reviewer");
  const isAdminNext = next.startsWith("/adminS");
  const isPrivateGate = isAdminNext || isReviewerNext;

  const [staffRole, setStaffRole] = useState<StaffRole>(isReviewerNext ? "juri" : "admin");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isReviewerNext) setStaffRole("juri");
    else if (isAdminNext) setStaffRole("admin");
    setError(null);
  }, [isAdminNext, isReviewerNext]);

  function switchStaffRole(role: StaffRole) {
    setStaffRole(role);
    setError(null);
    if (role === "juri" && email.endsWith("@simpel.ac.id")) {
      setEmail("");
      setPassword("");
    }
    if (role === "admin" && reviewers.some((r) => r.email === email)) {
      setEmail("");
      setPassword("");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (isPrivateGate) {
      formData.set("login_role", staffRole);
      formData.set("next", staffRole === "juri" ? (isReviewerNext ? next : "/reviewer") : isAdminNext ? next : "/adminS");
    } else {
      formData.set("login_role", "peserta");
      if (next) formData.set("next", next);
    }

    const res = await loginAction(formData);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Gagal masuk. Periksa kembali kredensial Anda.");
      return;
    }

    const fallback = isPrivateGate ? (staffRole === "juri" ? "/reviewer" : "/adminS") : "/dashboard";
    router.push(res.redirectTo || fallback);
    router.refresh();
  }

  return (
    <>
      {isPrivateGate && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-sheet p-1.5">
            <button
              type="button"
              onClick={() => switchStaffRole("admin")}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                staffRole === "admin"
                  ? "bg-forest-950 text-white shadow-soft"
                  : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              <ShieldCheck className={`size-3.5 ${staffRole === "admin" ? "text-gold-300" : ""}`} />
              Editor (/adminS)
            </button>
            <button
              type="button"
              onClick={() => switchStaffRole("juri")}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                staffRole === "juri"
                  ? "bg-forest-950 text-white shadow-soft"
                  : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              <Award className={`size-3.5 ${staffRole === "juri" ? "text-gold-300" : ""}`} />
              Reviewer (/reviewer)
            </button>
          </div>

          {staffRole === "admin" ? (
            <div className="mt-4 rounded-xl border border-gold-400 bg-gold-50 p-4 text-xs text-forest-950">
              <div className="flex items-center gap-2 font-mono font-bold uppercase text-forest-900">
                <ShieldCheck className="size-4 text-forest-800" />
                <span>Akses Privasi Editor (/adminS)</span>
              </div>
              <p className="mt-1 text-muted">
                Masuk menggunakan salah satu dari 2 akun Editor yang terdaftar di <code>.env.local</code>:
              </p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin1@simpel.ac.id");
                    setPassword("adminsimpel1");
                  }}
                  className="rounded-lg border border-line-strong bg-sheet px-3 py-2 text-left font-mono text-[11px] hover:border-forest-700"
                >
                  <strong className="block text-forest-900">Editor 1 (Klik isi otomatis)</strong>
                  <span className="text-muted">admin1@simpel.ac.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin2@simpel.ac.id");
                    setPassword("adminsimpel2");
                  }}
                  className="rounded-lg border border-line-strong bg-sheet px-3 py-2 text-left font-mono text-[11px] hover:border-forest-700"
                >
                  <strong className="block text-forest-900">Editor 2 (Klik isi otomatis)</strong>
                  <span className="text-muted">admin2@simpel.ac.id</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-gold-400 bg-gold-50 p-4 text-xs text-forest-950">
              <div className="flex items-center justify-between gap-2 font-mono font-bold uppercase text-forest-900">
                <span className="flex items-center gap-2">
                  <Award className="size-4 text-forest-800" />
                  <span>Akun Reviewer Dari Editor ({reviewers.length})</span>
                </span>
              </div>
              {reviewers.length > 0 ? (
                <>
                  <p className="mt-1 text-muted">
                    Pilih akun Reviewer yang sudah dibuat Editor untuk mengisi email &amp; kata sandi otomatis:
                  </p>
                  <div className="mt-2.5 grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {reviewers.map((rev) => {
                      const selected = email.toLowerCase() === rev.email.toLowerCase();
                      return (
                        <button
                          key={rev.id}
                          type="button"
                          onClick={() => {
                            setEmail(rev.email);
                            setPassword(rev.password);
                            setError(null);
                          }}
                          className={`rounded-lg border px-3 py-2 text-left text-[11px] transition-colors ${
                            selected
                              ? "border-forest-800 bg-forest-950 text-white"
                              : "border-line-strong bg-sheet hover:border-forest-700"
                          }`}
                        >
                          <strong className={`block truncate ${selected ? "text-gold-300" : "text-forest-900"}`}>
                            {rev.nama}
                          </strong>
                          <span className={`block truncate font-mono ${selected ? "text-forest-200" : "text-muted"}`}>
                            {rev.email}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="mt-1.5 leading-relaxed text-forest-900/90">
                  Belum ada akun Reviewer terdaftar. Editor perlu membuat akun Reviewer terlebih dahulu melalui{" "}
                  <code>/adminS/pengguna</code>.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
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
              placeholder={
                isPrivateGate
                  ? staffRole === "admin"
                    ? "admin1@simpel.ac.id"
                    : "reviewer@upstegal.ac.id"
                  : "nama@upstegal.ac.id"
              }
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
              ref={passwordRef}
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
          <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800">
            {error}
          </p>
        )}

        <button disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {isPrivateGate
                ? staffRole === "admin"
                  ? "Masuk ke Panel Editor (/adminS)"
                  : "Masuk ke Portal Reviewer (/reviewer)"
                : "Masuk sebagai Penulis"}{" "}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {!isPrivateGate && (
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
