import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gold-400/70",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-simpel.jpg"
        alt="Logo UKM SIMPEL"
        fill
        sizes={`${size * 2}px`}
        className="scale-[1.04] object-cover"
        priority
      />
    </span>
  );
}

/**
 * Logo UKM SIMPEL — hanya digunakan pada Navbar (dan header navigasi),
 * tidak ditampilkan besar di dalam isi halaman beranda.
 */
export function Logo({
  light = false,
  size = 38,
  subtitle = "Publikasi Karya Tulis Ilmiah",
  href = "/",
  showImage = true,
}: {
  light?: boolean;
  size?: number;
  subtitle?: string;
  href?: string;
  showImage?: boolean;
}) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3">
      {showImage && <LogoMark size={size} />}
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-lg font-semibold tracking-tight",
            light ? "text-white" : "text-forest-950",
          )}
        >
          SIMPEL<span className="text-gold-400">.</span>
        </span>
        <span
          className={cn(
            "block font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
            light ? "text-forest-200/80" : "text-muted",
          )}
        >
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
