import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { BookMascot } from "@/components/book-mascot";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      {/* Panel kiri — Editorial Colophon (Tanpa gambar logo besar di tengah) */}
      <aside className="hidden flex-col justify-between border-r border-forest-800 bg-forest-950 p-10 text-white lg:col-span-5 lg:flex xl:p-14">
        <div>
          <Logo light size={36} subtitle="Repositori Karya Tulis Ilmiah" />
        </div>

        <div className="my-auto py-10">
          <div className="-mb-2 max-w-[250px]">
            <BookMascot showBubble={false} />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-gold-300">
            PORTAL KARYA TULIS ILMIAH
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-snug xl:text-4xl">
            Sistem Pengajuan &amp; Publikasi Naskah Ilmiah Mahasiswa.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-forest-100/75">
            Unggah essay, makalah, atau artikel jurnal riset Anda dan pantau seluruh tahapan kurasi secara transparan hingga diterbitkan.
          </p>

          <ul className="mt-8 space-y-3 border-t border-white/10 pt-6 text-xs text-forest-100/85">
            {[
              "Validasi otomatis format PDF, ukuran, dan penamaan berkas",
              "Desk evaluation orisinalitas dan format oleh editor",
              "Telaah substansi oleh tim reviewer/juri (maks. 4 orang per naskah)",
              "Riwayat status dan catatan revisi terekam lengkap",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-gold-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-white/10 pt-5 font-mono text-xs text-forest-300">
          UKM Studi Ilmiah Mahasiswa (SIMPEL) · Universitas Pancasakti Tegal
        </div>
      </aside>

      {/* Panel kanan — Form */}
      <main className="flex flex-col bg-paper lg:col-span-7">
        <div className="flex items-center justify-between border-b border-line bg-sheet px-5 py-4 sm:px-8">
          <div className="lg:hidden">
            <Logo size={32} />
          </div>
          <Link href="/" className="ml-auto font-mono text-xs font-semibold text-forest-800 hover:underline">
            ← Kembali ke Beranda
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
