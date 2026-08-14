import Link from "next/link";
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-black/10 bg-white shadow-sm ${className}`}>{children}</div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-dark)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-black/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative" | "brand" | "warning";
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "text-[var(--foreground)]",
    positive: "text-emerald-700",
    negative: "text-red-700",
    brand: "text-[var(--brand-dark)]",
    warning: "text-amber-700",
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-black/50">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClasses[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-black/40">{hint}</p>}
    </Card>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning" | "brand";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-black/5 text-black/70",
    positive: "bg-emerald-100 text-emerald-800",
    negative: "bg-red-100 text-red-800",
    warning: "bg-amber-100 text-amber-800",
    brand: "bg-[var(--brand)]/15 text-[var(--brand-dark)]",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const variants: Record<string, string> = {
    primary: "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]",
    secondary: "bg-black/5 text-black/80 hover:bg-black/10",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  type = "submit",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  type?: "submit" | "button";
}) {
  const variants: Record<string, string> = {
    primary: "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]",
    secondary: "bg-black/5 text-black/80 hover:bg-black/10",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
      <table className="w-full min-w-max text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`border-b border-black/10 bg-black/[0.03] px-3 py-2 text-left font-semibold text-black/70 ${className}`}>
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`border-b border-black/5 px-3 py-2 align-top ${className}`}>
      {children}
    </td>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-3 py-6 text-center text-sm text-black/40">{children}</p>;
}
