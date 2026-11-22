import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <>
      <p className="eyebrow">AUTENTIKASI PENULIS &amp; REDAKSI</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-4xl">Masuk ke Portal SIMPEL</h1>
      <p className="mt-2 text-sm text-muted">Unggah naskah karya tulis ilmiah atau pantau tahapan kurasi.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}

