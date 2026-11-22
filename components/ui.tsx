import type { ReactNode } from "react";
import { EVENT_STATUS_META, STATUS_META, type EventStatus, type SubmissionStatus } from "@/lib/data";
import { cn, initials } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold ring-1 ring-inset",
        meta.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function EventStatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  const meta = EVENT_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold ring-1 ring-inset",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

const AVATAR_TONES = [
  "bg-forest-100 text-forest-900 ring-1 ring-forest-300",
  "bg-gold-100 text-forest-950 ring-1 ring-gold-300",
  "bg-paper-dark text-forest-900 ring-1 ring-line-strong",
];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const tone = AVATAR_TONES[name.length % AVATAR_TONES.length];
  const sz = size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-14 text-base" : "size-9 text-xs";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-mono font-bold", tone, sz, className)}>
      {initials(name)}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-forest-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  tone = "forest",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  tone?: "forest" | "gold" | "neutral";
}) {
  const tones = {
    forest: "bg-forest-50 text-forest-800 border-forest-200",
    gold: "bg-gold-50 text-gold-700 border-gold-200",
    neutral: "bg-paper text-forest-900 border-line",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-forest-950">{value}</p>
        </div>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border", tones[tone])}>{icon}</span>
      </div>
      {trend && <p className="mt-3 border-t border-line pt-2.5 font-mono text-[11px] text-muted">{trend}</p>}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "forest" }: { value: number; className?: string; tone?: "forest" | "gold" }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-paper-dark", className)}>
      <div
        className={cn("h-full rounded-full", tone === "gold" ? "bg-gold-500" : "bg-forest-700")}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-sans text-sm font-bold tracking-normal text-forest-950">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
