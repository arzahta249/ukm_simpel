"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Award,
  BookOpenCheck,
  CalendarRange,
  ClipboardCheck,
  Compass,
  FileStack,
  FolderTree,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  Trophy,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { Avatar } from "./ui";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; badge?: string };
type NavGroup = { title?: string; items: NavItem[] };

const NAV: Record<"peserta" | "admin", NavGroup[]> = {
  peserta: [
    {
      title: "Menu Penulis",
      items: [
        { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
        { href: "/dashboard/submit", label: "Unggah Naskah Baru", icon: Send },
        { href: "/dashboard/karya", label: "Naskah Saya", icon: FileStack },
      ],
    },
    {
      title: "Akun & Katalog",
      items: [
        { href: "/events", label: "Periode Penerimaan", icon: Compass },
        { href: "/dashboard/profil", label: "Profil Penulis", icon: UserCircle },
        { href: "/", label: "Beranda Publik", icon: Globe },
      ],
    },
  ],
  admin: [
    {
      title: "Redaksi SIMPEL",
      items: [{ href: "/adminS", label: "Ringkasan Redaksi", icon: LayoutDashboard }],
    },
    {
      title: "Periode & Kategori",
      items: [
        { href: "/adminS/events", label: "Periode Penerimaan", icon: CalendarRange },
        { href: "/adminS/kategori", label: "Jenis Naskah", icon: FolderTree },
      ],
    },
    {
      title: "Alur Kurasi Naskah",
      items: [
        { href: "/adminS/naskah", label: "Naskah Masuk & Desk Eval", icon: BookOpenCheck },
        { href: "/adminS/penugasan", label: "Tugaskan Reviewer/Juri", icon: Users },
        { href: "/adminS/penilaian", label: "Penilaian Kriteria", icon: ClipboardCheck },
        { href: "/adminS/rekap", label: "Rekap & Penerbitan", icon: Trophy },
      ],
    },
    {
      title: "Manajemen",
      items: [
        { href: "/adminS/pengguna", label: "Penulis & Reviewer", icon: Award },
        { href: "/", label: "Lihat Portal Publik", icon: Globe },
      ],
    },
  ],
};

export function DashboardShell({
  variant,
  user,
  children,
}: {
  variant: "peserta" | "admin";
  user: { nama: string; email: string; role?: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isAdmin = variant === "admin";
  const root = isAdmin ? "/adminS" : "/dashboard";

  async function logout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className={cn("flex h-full flex-col", isAdmin ? "bg-forest-950 text-forest-100" : "bg-sheet text-ink")}>
      <div className={cn("flex h-16 items-center px-5", isAdmin ? "border-b border-white/10" : "border-b border-line")}>
        <Logo light={isAdmin} size={34} href={root} subtitle={isAdmin ? "Panel Redaksi /adminS" : "Portal Penulis KTI"} />
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3.5 py-5">
        {NAV[variant].map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <p
                className={cn(
                  "mb-2 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
                  isAdmin ? "text-forest-300/70" : "text-muted",
                )}
              >
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.href === root ? pathname === root : item.href !== "/" && pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isAdmin
                          ? active
                            ? "bg-forest-800 text-white"
                            : "text-forest-200/75 hover:bg-white/5 hover:text-white"
                          : active
                            ? "bg-forest-800 text-white"
                            : "text-muted hover:bg-paper hover:text-forest-950",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active && "text-gold-300")} />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("border-t p-4", isAdmin ? "border-white/10" : "border-line")}>
        <div className="mb-3 flex items-center gap-2.5 px-2">
          <Avatar name={user.nama} size="sm" />
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-xs font-semibold", isAdmin ? "text-white" : "text-ink")}>{user.nama}</p>
            <p className={cn("truncate font-mono text-[10.5px]", isAdmin ? "text-forest-300" : "text-muted")}>{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
            isAdmin ? "text-forest-200 hover:bg-white/5 hover:text-white" : "text-muted hover:bg-red-50 hover:text-red-700",
          )}
        >
          <LogOut className="size-4" /> Keluar Sesi
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-64 lg:block", !isAdmin && "border-r border-line")}>
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-forest-950/60" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">{sidebar}</aside>
          <button
            onClick={() => setOpen(false)}
            className="fixed right-4 top-4 flex size-10 items-center justify-center rounded-md bg-white text-ink shadow"
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="flex size-9 items-center justify-center rounded-md border border-line-strong bg-sheet lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="size-5" />
            </button>
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              {isAdmin ? "REDAKSI & KURASI · /adminS" : "PORTAL PENULIS KARYA ILMIAH"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <Link href="/dashboard" className="btn btn-outline btn-sm">
                Portal Penulis
              </Link>
            )}
            {!isAdmin && user.role === "admin" && (
              <Link href="/adminS" className="btn btn-outline btn-sm">
                Panel /adminS
              </Link>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
