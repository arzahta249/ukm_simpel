import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-line-strong bg-forest-950 text-forest-100/80">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo light showImage={false} subtitle="Unit Kegiatan Mahasiswa Studi Ilmiah Mahasiswa" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-forest-200/75">
              Portal pengumpulan, kurasi, dan publikasi karya tulis ilmiah mahasiswa Universitas Pancasakti Tegal.
            </p>
            <p className="mt-4 font-mono text-xs text-forest-300">
              Sekretariat: Jl. Halmahera Km. 1, Kota Tegal, Jawa Tengah
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <h4 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-300">
                Publikasi
              </h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/#katalog" className="hover:text-white">Katalog Karya Terbit</Link></li>
                <li><Link href="/events" className="hover:text-white">Periode Penerimaan</Link></li>
                <li><Link href="/#alur" className="hover:text-white">Alur Kurasi &amp; Review</Link></li>
                <li><Link href="/#panduan" className="hover:text-white">Panduan Penulis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-300">
                Portal Penulis
              </h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-white">Registrasi Penulis</Link></li>
                <li><Link href="/login" className="hover:text-white">Masuk Akun</Link></li>
                <li><Link href="/dashboard/submit" className="hover:text-white">Unggah Naskah PDF</Link></li>
                <li><Link href="/dashboard/karya" className="hover:text-white">Pantau Status Naskah</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-300">
                Kontak Redaksi
              </h4>
              <ul className="space-y-2 text-sm">
                <li><span className="font-mono text-xs text-forest-300">simpel@upstegal.ac.id</span></li>
                <li><span className="text-xs text-forest-200/75">Universitas Pancasakti Tegal</span></li>
                <li><span className="text-xs text-forest-200/75">Kota Tegal, Jawa Tengah</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 font-mono text-xs text-forest-300 sm:flex-row sm:items-center">
          <p>© 2026 UKM SIMPEL Universitas Pancasakti Tegal.</p>
          <p>Sistem Informasi Repositori &amp; Publikasi Karya Tulis Ilmiah</p>
        </div>
      </div>
    </footer>
  );
}
