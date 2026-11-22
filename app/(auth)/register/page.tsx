import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Daftar Akun" };

export default function RegisterPage() {
  return (
    <>
      <p className="eyebrow">REGISTRASI PENULIS</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-950 sm:text-4xl">Buat Akun Penulis KTI</h1>
      <p className="mt-2 text-sm text-muted">Tautan verifikasi akun akan dikirim ke alamat email Anda.</p>
      <RegisterForm />
    </>
  );
}

