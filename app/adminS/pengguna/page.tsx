import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { readDb } from "@/lib/db";
import { PenggunaClient } from "./pengguna-client";

export const metadata: Metadata = { title: "Manajemen Pengguna & Reviewer" };
export const dynamic = "force-dynamic";

export default async function PenggunaPage() {
  const db = await readDb();
  const envAdmins = [
    {
      email: process.env.ADMIN_1_EMAIL || "admin1@simpel.ac.id",
      nama: process.env.ADMIN_1_NAME || "Admin Redaksi 1",
    },
    {
      email: process.env.ADMIN_2_EMAIL || "admin2@simpel.ac.id",
      nama: process.env.ADMIN_2_NAME || "Admin Redaksi 2",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="TABEL USERS · ROLE: ADMIN (2 ENV), JURI, PESERTA"
        title="Pengguna, Penulis &amp; Dewan Reviewer"
        description="Kelola akun penulis (peserta) dan dewan reviewer/juri di database. Dua akun Admin utama dikonfigurasi melalui variabel lingkungan (.env.local)."
      />
      <PenggunaClient users={db.users} envAdmins={envAdmins} />
    </>
  );
}
