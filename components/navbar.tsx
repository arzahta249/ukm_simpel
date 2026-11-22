"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, FileUp, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/#katalog", label: "Karya Terbit" },
  { href: "/events", label: "Periode Unggah" },
  { href: "/#alur", label: "Prosedur & Kurasi" },
  { href: "/#panduan", label: "FAQ" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-forest-800 bg-forest-950 text-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo light size={38} subtitle="Repositori Karya Ilmiah" />

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = l.href === pathname || (l.href === "/events" && pathname.startsWith("/events"));
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
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
          className="flex size-10 items-center justify-center rounded-md border border-white/15 text-white lg:hidden"
          aria-label="Toggle navigasi"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-forest-950 px-4 pb-5 pt-3 lg:hidden">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-forest-100 hover:bg-white/5"
                >
                  {l.label}
                  <ArrowUpRight className="size-4 text-forest-400" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
            <Link href="/login" onClick={() => setOpen(false)} className="btn btn-ghost-light">
              Masuk
            </Link>
            <Link href="/dashboard/submit" onClick={() => setOpen(false)} className="btn btn-gold">
              <FileUp className="size-4" /> Unggah Naskah
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
