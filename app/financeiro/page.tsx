import * as repo from "@/lib/repo";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, Button, Card, PageHeader, Table, Td, Th, EmptyState } from "@/components/ui";
import { createAccount, createLedgerEntry, deleteAccount, deleteLedgerEntry } from "@/lib/actions/financeiro-actions";

export default async function FinanceiroPage() {
  const accounts = await repo.listAccounts();
  const entries = await repo.listLedgerEntries();
  const events = await repo.listEvents();

  const balanceByAccount = new Map<string, number>();
  for (const acc of accounts) balanceByAccount.set(acc.id, 0);
  for (const e of entries) {
    if (e.fromAccountId) {
      balanceByAccount.set(e.fromAccountId, (balanceByAccount.get(e.fromAccountId) ?? 0) - e.amount);
    }
  }

  return (
    <div>
      <PageHeader
        title="Financeiro — Conta Corrente"
        subtitle="Movimentações entre contas, empréstimos e repasses entre eventos e pessoas"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-black/50">{acc.name}</p>
            <p className="mt-1 text-xl font-bold text-[var(--brand-dark)]">
              {formatCurrency(balanceByAccount.get(acc.id) ?? 0)}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        {entries.length === 0 ? (
          <Card>
            <EmptyState>Nenhuma movimentação lançada ainda.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Motivo</Th>
                <Th>Evento</Th>
                <Th>Quem devolve</Th>
                <Th>Conta (de)</Th>
                <Th>Devolução para</Th>
                <Th className="text-right">Valor</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <Td>{formatDate(e.date)}</Td>
                  <Td>{e.reason}</Td>
                  <Td>{e.eventName ? <Badge tone="brand">{e.eventName}</Badge> : "—"}</Td>
                  <Td>{e.whoReturns ?? "—"}</Td>
                  <Td>{e.accountName ?? "—"}</Td>
                  <Td>{e.toAccountLabel ?? "—"}</Td>
                  <Td className="text-right font-medium">{formatCurrency(e.amount)}</Td>
                  <Td className="text-right">
                    <form action={deleteLedgerEntry}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                        remover
                      </button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--brand-dark)]">+ Nova movimentação</h2>
        <form action={createLedgerEntry} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TextField label="Data" name="date" type="date" required />
          <TextField label="Valor (R$)" name="amount" type="number" step="0.01" required />
          <TextField label="Motivo" name="reason" placeholder="Compra insumo" required />
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Evento (opcional)</label>
            <select name="eventId" className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm">
              <option value="">—</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
          <TextField label="Quem devolve" name="whoReturns" placeholder="C6 - Coffee Car" />
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Conta (de)</label>
            <select name="fromAccountId" className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm">
              <option value="">—</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <TextField label="Devolução para" name="toAccountLabel" placeholder="Conta Santander" />
          <TextField label="Observação" name="notes" />
          <div className="col-span-full">
            <Button variant="secondary">+ Adicionar movimentação</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--brand-dark)]">Contas</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {accounts.map((acc) => (
            <span key={acc.id} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-sm">
              {acc.name}
              <form action={deleteAccount}>
                <input type="hidden" name="id" value={acc.id} />
                <button type="submit" className="text-red-600 hover:underline">
                  ×
                </button>
              </form>
            </span>
          ))}
        </div>
        <form action={createAccount} className="flex flex-wrap items-end gap-2">
          <TextField label="Nova conta" name="name" placeholder="Ex: Nubank" width="w-48" />
          <Button variant="secondary">+ Adicionar conta</Button>
        </form>
      </Card>
    </div>
  );
}

function TextField({
  label,
  name,
  type = "text",
  required,
  placeholder,
  step,
  width,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  width?: string;
}) {
  return (
    <div className={width}>
      <label className="mb-1 block text-xs font-medium text-black/60">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
    </div>
  );
}
