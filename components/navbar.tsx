"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, FileUp, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/#katalog", label: "Karya Terbit" },
  { href: "/events", label: "Periode Unggah" },
  { href: "/#alur", label: "Cara Kerja" },
  { href: "/#panduan", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <nav className="relative mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-forest-950/95 px-3 shadow-pop backdrop-blur-xl sm:h-16 sm:px-5">
        <Logo light size={36} subtitle="Repositori Karya Ilmiah" />

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = mounted && (l.href === pathname || (l.href === "/events" && pathname.startsWith("/events")));
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-white/10 text-gold-300" : "text-forest-100/85 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link href="/login" className="btn btn-ghost-light btn-sm">
            Masuk
          </Link>
          <Link href="/dashboard/submit" className="btn btn-gold btn-sm">
            <FileUp className="size-3.5" /> Unggah Naskah
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="flex size-10 items-center justify-center rounded-xl border border-white/15 text-white transition-colors hover:bg-white/10 lg:hidden"
          aria-label="Buka atau tutup menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {open && (
          <div className="rise absolute inset-x-0 top-[calc(100%+0.5rem)] rounded-2xl border border-white/10 bg-forest-950 p-3 shadow-pop lg:hidden">
            <ul className="space-y-1">
              {links.map((l) => {
                const active = l.href === pathname;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors",
                        active ? "bg-white/10 text-gold-300" : "text-forest-100 hover:bg-white/5",
                      )}
                    >
                      {l.label}
                      <ArrowUpRight className="size-4 text-forest-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="btn btn-ghost-light">
                Masuk
              </Link>
              <Link href="/dashboard/submit" onClick={() => setOpen(false)} className="btn btn-gold">
                <FileUp className="size-4" /> Unggah
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
