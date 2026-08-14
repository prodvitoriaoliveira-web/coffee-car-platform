import * as repo from "@/lib/repo";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, Button, Card, PageHeader, StatTile, Table, Td, Th, EmptyState } from "@/components/ui";
import { createReceivable, deleteReceivable, toggleReceivableReceived } from "@/lib/actions/contas-actions";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  CARTAO: "Cartão",
  TRANSFERENCIA: "Transferência",
  BOLETO: "Boleto",
  OUTRO: "Outro",
};

export default async function ContasAReceberPage() {
  const receivables = await repo.listReceivables();
  const events = await repo.listEvents();

  const totalPendente = receivables.filter((r) => r.status === "PENDENTE").reduce((s, r) => s + r.amount, 0);
  const totalRecebido = receivables.filter((r) => r.status === "RECEBIDO").reduce((s, r) => s + r.amount, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <PageHeader title="Contas a Receber" subtitle="Vendas, repasses de parceiros e outros recebimentos" />

      <div className="grid grid-cols-2 gap-4">
        <StatTile label="Pendente" value={formatCurrency(totalPendente)} tone="warning" />
        <StatTile label="Recebido" value={formatCurrency(totalRecebido)} tone="positive" />
      </div>

      <div className="mt-6">
        {receivables.length === 0 ? (
          <Card>
            <EmptyState>Nenhuma conta a receber cadastrada.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Descrição</Th>
                <Th>Cliente/Pagador</Th>
                <Th>Evento/venda</Th>
                <Th>Vencimento</Th>
                <Th>Forma de receb.</Th>
                <Th className="text-right">Valor</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((r) => {
                const overdue = r.status === "PENDENTE" && r.dueDate && new Date(r.dueDate) < today;
                return (
                  <tr key={r.id}>
                    <Td>{r.description}</Td>
                    <Td>{r.payer ?? "—"}</Td>
                    <Td>{r.eventName ?? "—"}</Td>
                    <Td>{formatDate(r.dueDate)}</Td>
                    <Td>{r.paymentMethod ? PAYMENT_METHOD_LABEL[r.paymentMethod] ?? r.paymentMethod : "—"}</Td>
                    <Td className="text-right font-medium">{formatCurrency(r.amount)}</Td>
                    <Td>
                      <form action={toggleReceivableReceived}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value={r.status} />
                        <button type="submit">
                          <Badge tone={r.status === "RECEBIDO" ? "positive" : overdue ? "negative" : "warning"}>
                            {r.status === "RECEBIDO" ? "Recebido" : overdue ? "Atrasado" : "Pendente"}
                          </Badge>
                        </button>
                      </form>
                      {r.status === "RECEBIDO" && r.receivedDate && (
                        <p className="mt-1 text-[11px] text-black/40">{formatDate(r.receivedDate)}</p>
                      )}
                    </Td>
                    <Td className="text-right">
                      <form action={deleteReceivable}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          remover
                        </button>
                      </form>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--brand-dark)]">+ Nova conta a receber</h2>
        <form action={createReceivable} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TextField label="Descrição" name="description" required />
          <TextField label="Cliente/Pagador" name="payer" />
          <TextField label="Valor (R$)" name="amount" type="number" step="0.01" required />
          <TextField label="Vencimento" name="dueDate" type="date" />
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Forma de recebimento</label>
            <select name="paymentMethod" className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm">
              <option value="">—</option>
              {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
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
          <TextField label="Observação" name="notes" />
          <div className="col-span-full">
            <Button variant="secondary">+ Adicionar</Button>
          </div>
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
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-black/60">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        step={step}
        className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
    </div>
  );
}
