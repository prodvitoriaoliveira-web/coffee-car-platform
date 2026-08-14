"use client";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions/login-action";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, { error: null });
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl">☕</div>
          <h1 className="mt-2 text-xl font-bold text-[var(--brand-dark)]">Coffee Car — Gestão</h1>
          <p className="mt-1 text-sm text-black/50">Entre com seu e-mail e senha</p>
        </div>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black/70">E-mail</label>
            <input type="email" name="email" required autoComplete="email"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              placeholder="voce@exemplo.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black/70">Senha</label>
            <input type="password" name="password" required autoComplete="current-password"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              placeholder="••••••••" />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button type="submit" disabled={pending}
            className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-dark)] disabled:opacity-60">
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-black/40">
          Contas de acesso são criadas por um administrador. Veja o README para os logins iniciais de demonstração.
        </p>
      </div>
    </div>
  );
}
