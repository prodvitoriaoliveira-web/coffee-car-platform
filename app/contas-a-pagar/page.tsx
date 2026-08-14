import * as repo from "@/lib/repo";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, Button, Card, PageHeader, StatTile, Table, Td, Th, EmptyState } from "@/components/ui";
import { createPayable, deletePayable, togglePayablePaid } from "@/lib/actions/contas-actions";

const CATEGORY_LABEL: Record<string, string> = {
  FORNECEDOR: "Fornecedor",
  ALUGUEL: "Aluguel",
  EQUIPE: "Equipe",
  IMPOSTOS: "Impostos",
  MARKETING: "Marketing",
  OUTRO: "Outro",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  CARTAO: "Cartão",
  TRANSFERENCIA: "Transferência",
  BOLETO: "Boleto",
  OUTRO: "Outro",
};

export default async function ContasAPagarPage() {
  const payables = await repo.listPayables();
  const events = await repo.listEvents();

  const totalPendente = payables.filter((p) => p.status === "PENDENTE").reduce((s, p) => s + p.amount, 0);
  const totalPago = payables.filter((p) => p.status === "PAGO").reduce((s, p) => s + p.amount, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <PageHeader title="Contas a Pagar" subtitle="Fornecedores, aluguéis, staff e outras obrigações" />

      <div className="grid grid-cols-2 gap-4">
        <StatTile label="Pendente" value={formatCurrency(totalPendente)} tone="negative" />
        <StatTile label="Pago" value={formatCurrency(totalPago)} tone="positive" />
      </div>

      <div className="mt-6">
        {payables.length === 0 ? (
          <Card>
            <EmptyState>Nenhuma conta a pagar cadastrada.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Descrição</Th>
                <Th>Fornecedor</Th>
                <Th>Categoria</Th>
                <Th>Centro de custo</Th>
                <Th>Evento</Th>
                <Th>Vencimento</Th>
                <Th>Forma de pgto.</Th>
                <Th className="text-right">Valor</Th>
                <Th>Status</Th>
                <Th>Anexo</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {payables.map((p) => {
                const overdue = p.status === "PENDENTE" && p.dueDate && new Date(p.dueDate) < today;
                return (
                  <tr key={p.id}>
                    <Td>{p.description}</Td>
                    <Td>{p.supplier ?? "—"}</Td>
                    <Td>{p.category ? CATEGORY_LABEL[p.category] ?? p.category : "—"}</Td>
                    <Td>{p.costCenter ?? "—"}</Td>
                    <Td>{p.eventName ?? "—"}</Td>
                    <Td>{formatDate(p.dueDate)}</Td>
                    <Td>{p.paymentMethod ? PAYMENT_METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod : "—"}</Td>
                    <Td className="text-right font-medium">{formatCurrency(p.amount)}</Td>
                    <Td>
                      <form action={togglePayablePaid}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value={p.status} />
                        <button type="submit">
                          <Badge tone={p.status === "PAGO" ? "positive" : overdue ? "negative" : "warning"}>
                            {p.status === "PAGO" ? "Pago" : overdue ? "Atrasado" : "Pendente"}
                          </Badge>
                        </button>
                      </form>
                      {p.status === "PAGO" && p.paidDate && (
                        <p className="mt-1 text-[11px] text-black/40">{formatDate(p.paidDate)}</p>
                      )}
                    </Td>
                    <Td>
                      {p.attachmentUrl ? (
                        <a
                          href={p.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[var(--brand)] hover:underline"
                        >
                          ver nota
                        </a>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-right">
                      <form action={deletePayable}>
                        <input type="hidden" name="id" value={p.id} />
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
        <h2 className="mb-3 text-sm font-semibold text-[var(--brand-dark)]">+ Nova conta a pagar</h2>
        <form action={createPayable} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TextField label="Descrição" name="description" required />
          <TextField label="Fornecedor" name="supplier" />
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Categoria</label>
            <select name="category" className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm">
              <option value="">—</option>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <TextField label="Centro de custo" name="costCenter" placeholder="Administrativo, Operacional..." />
          <TextField label="Valor (R$)" name="amount" type="number" step="0.01" required />
          <TextField label="Vencimento" name="dueDate" type="date" />
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Forma de pagamento</label>
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
          <TextField label="Anexo da nota/boleto (link)" name="attachmentUrl" placeholder="https://..." />
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
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-black/60">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        step={step}
        placeholder={placeholder}
        className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
    </div>
  );
}
