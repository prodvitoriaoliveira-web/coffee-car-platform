import * as repo from "@/lib/repo";
import { insumoUnitCost } from "@/lib/calc";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, Button, Card, PageHeader, Table, Td, Th, EmptyState } from "@/components/ui";
import { createInsumo, deleteInsumo, createStockMovement, deleteStockMovement } from "@/lib/actions/insumo-actions";

const MOVEMENT_LABEL: Record<string, string> = {
  ENTRADA: "Entrada (compra/recebimento)",
  SAIDA: "Saída (evento)",
  PERDA: "Perda (avaria)",
  DEVOLUCAO: "Devolução (retorno de evento)",
};

const MOVEMENT_TONE: Record<string, "positive" | "negative" | "warning" | "brand"> = {
  ENTRADA: "positive",
  DEVOLUCAO: "brand",
  SAIDA: "warning",
  PERDA: "negative",
};

export default async function InsumosPage() {
  const insumos = await repo.listInsumos();
  const movements = await repo.listStockMovements(100);
  const events = await repo.listEvents();

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Catálogo de insumos, custo unitário e controle de estoque" />

      {insumos.length === 0 ? (
        <Card>
          <EmptyState>Nenhum insumo cadastrado ainda.</EmptyState>
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Insumo</Th>
              <Th>Categoria</Th>
              <Th>Fornecedor</Th>
              <Th className="text-right">Estoque atual</Th>
              <Th className="text-right">Estoque mínimo</Th>
              <Th className="text-right">Custo unitário</Th>
              <Th className="text-right">Valor de reposição</Th>
              <Th>Localização</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((i) => {
              const unitCost = insumoUnitCost(i.packagePrice, i.packageQty);
              const low = i.minStock != null && i.currentStock <= i.minStock;
              return (
                <tr key={i.id}>
                  <Td className="font-medium">
                    {i.name}
                    {i.packageLabel && <span className="ml-1 text-xs text-black/40">({i.packageLabel})</span>}
                  </Td>
                  <Td>{i.category ?? "—"}</Td>
                  <Td>{i.supplier ?? "—"}</Td>
                  <Td className="text-right">
                    <span className={low ? "font-semibold text-red-700" : "font-medium"}>
                      {i.currentStock} {i.packageUnit ?? ""}
                    </span>
                    {low && <Badge tone="negative">baixo</Badge>}
                  </Td>
                  <Td className="text-right">{i.minStock ?? "—"}</Td>
                  <Td className="text-right">{unitCost != null ? formatCurrency(unitCost) : "—"}</Td>
                  <Td className="text-right">{i.replenishValue != null ? formatCurrency(i.replenishValue) : "—"}</Td>
                  <Td>{i.location ?? "—"}</Td>
                  <Td className="text-right">
                    <form action={deleteInsumo}>
                      <input type="hidden" name="id" value={i.id} />
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

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--brand-dark)]">+ Novo insumo</h2>
        <form action={createInsumo} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TextField label="Nome" name="name" required />
          <TextField label="Categoria" name="category" placeholder="Café, Descartáveis..." />
          <TextField label="Fornecedor" name="supplier" />
          <TextField label="Localização" name="location" placeholder="Estoque A, prateleira 2..." />
          <TextField label="Embalagem / rende" name="packageLabel" placeholder="Pacote, Pote (400g)..." />
          <TextField label="Unidade" name="packageUnit" placeholder="un, porção de 10g, ml..." />
          <TextField label="Qtd. por embalagem" name="packageQty" type="number" step="0.01" placeholder="10" />
          <TextField label="Preço da embalagem (R$)" name="packagePrice" type="number" step="0.01" placeholder="24.00" />
          <TextField label="Estoque atual" name="currentStock" type="number" step="0.01" placeholder="0" />
          <TextField label="Estoque mínimo" name="minStock" type="number" step="0.01" placeholder="10" />
          <TextField label="Valor de reposição (R$)" name="replenishValue" type="number" step="0.01" placeholder="0.00" />
          <TextField label="Observação" name="notes" />
          <div className="col-span-full">
            <Button variant="secondary">+ Adicionar insumo</Button>
          </div>
        </form>
      </Card>

      {/* MOVIMENTAÇÕES */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--brand-dark)]">Movimentações de estoque</h2>
        {movements.length === 0 ? (
          <Card>
            <EmptyState>Nenhuma movimentação registrada ainda.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Insumo</Th>
                <Th>Tipo</Th>
                <Th className="text-right">Quantidade</Th>
                <Th>Data</Th>
                <Th>Evento</Th>
                <Th>Observação</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <Td>{m.insumoName}</Td>
                  <Td>
                    <Badge tone={MOVEMENT_TONE[m.type]}>{MOVEMENT_LABEL[m.type]}</Badge>
                  </Td>
                  <Td className="text-right font-medium">{m.quantity}</Td>
                  <Td>{formatDate(m.date)}</Td>
                  <Td>{m.eventName ?? "—"}</Td>
                  <Td className="max-w-xs text-xs text-black/50">{m.notes ?? ""}</Td>
                  <Td className="text-right">
                    <form action={deleteStockMovement}>
                      <input type="hidden" name="id" value={m.id} />
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

        <Card className="mt-4 p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--brand-dark)]">+ Nova movimentação</h3>
          {insumos.length === 0 ? (
            <p className="text-sm text-black/50">Cadastre um insumo acima antes de lançar movimentações.</p>
          ) : (
            <form action={createStockMovement} className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-black/60">Insumo</label>
                <select name="insumoId" required className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm">
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-black/60">Tipo</label>
                <select name="type" required className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm">
                  {Object.entries(MOVEMENT_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <TextField label="Quantidade" name="quantity" type="number" step="0.01" required />
              <TextField label="Data" name="date" type="date" />
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
                <Button variant="secondary">+ Registrar movimentação</Button>
              </div>
            </form>
          )}
        </Card>
      </div>
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
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
