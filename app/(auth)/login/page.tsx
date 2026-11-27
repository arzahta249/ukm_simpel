import type { Metadata } from "next";
import { Suspense } from "react";
import { readDb } from "@/lib/db";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "";
  const isAdminGate = next.startsWith("/adminS");
  const isReviewerGate = next.startsWith("/reviewer");

  const reviewers =
    isAdminGate || isReviewerGate
      ? (await readDb()).users
          .filter((u) => u.role === "juri")
          .map((u) => ({
            id: u.id,
            nama: u.nama,
            email: u.email,
            institusi: u.institusi,
            password: u.quick_password || "simpel123",
          }))
      : [];

  return (
    <>
      <p className="eyebrow">
        {isAdminGate
          ? "AKSES PRIVASI · EDITOR (/adminS)"
          : isReviewerGate
            ? "AKSES PRIVASI · REVIEWER (/reviewer)"
            : "AUTENTIKASI PENULIS"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-4xl">
        {isAdminGate
          ? "Masuk Panel Editor"
          : isReviewerGate
            ? "Masuk Portal Reviewer"
            : "Masuk ke Portal Penulis"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isAdminGate || isReviewerGate
          ? "Jalur akses privat untuk Editor dan Dewan Reviewer melalui proteksi middleware."
          : "Masuk dengan akun penulis Anda untuk mengunggah dan memantau perkembangan naskah."}
      </p>
      <Suspense>
        <LoginForm reviewers={reviewers} />
      </Suspense>
    </>
  );
}
