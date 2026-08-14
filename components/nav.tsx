"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth-actions";

const links = [
  { href: "/dashboard", label: "Resumo" },
  { href: "/eventos", label: "Eventos" },
  { href: "/insumos", label: "Custos & Insumos" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/staff", label: "Staff" },
  { href: "/contas-a-pagar", label: "A Pagar" },
  { href: "/contas-a-receber", label: "A Receber" },
];

export function Nav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  return (
    <header className="border-b border-black/10 bg-[var(--brand-dark)] text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">☕ Coffee Car — Gestão</span>
        </div>
        <nav className="flex flex-wrap gap-1">
          {links.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <form action={signOutAction} className="flex items-center gap-3">
          {userName && <span className="text-xs text-white/70">{userName}</span>}
          <button className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
