import { notFound } from "next/navigation";
import * as repo from "@/lib/repo";
import { computeEventTotals } from "@/lib/calc";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Badge, Button, Card, PageHeader, StatTile, Table, Td, Th, EmptyState } from "@/components/ui";
import {
  addEventCost,
  addPartnerShare,
  addSaleItem,
  addStaffShiftToEvent,
  deleteEvent,
  deleteEventCost,
  deletePartnerShare,
  deleteSaleItem,
  deleteStaffShift,
  updateEventStatus,
} from "@/lib/actions/evento-actions";

const CATEGORY_LABEL: Record<string, string> = {
  INSUMO: "Insumo",
  FRETE: "Frete",
  REPASSE: "Repasse / comissão",
  EQUIPE: "Equipe",
  ALUGUEL: "Aluguel",
  OUTRO: "Outro",
};

export default async function EventoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await repo.getEvent(id);
  if (!event) notFound();

  const saleItems = await repo.listSaleItems(id);
  const costs = await repo.listEventCosts(id);
  const staffShifts = await repo.listStaffShiftsForEvent(id);
  const partnerShares = await repo.listPartnerShares(id);
  const staffMembers = await repo.listStaffMembers();
  const totals = computeEventTotals({ saleItems, costs, staffShifts });

  async function setStatus(formData: FormData) {
    "use server";
    const status = String(formData.get("status")) as repo.EventStatus;
    await updateEventStatus(event!.id, status);
  }

  return (
    <div>
      <PageHeader
        title={event.name}
        subtitle={[event.location, formatDate(event.startDate)].filter(Boolean).join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <form action={setStatus} className="flex items-center gap-2">
              <select
                name="status"
                defaultValue={event.status}
                className="rounded-lg border border-black/15 px-2 py-1.5 text-sm"
              >
                <option value="PLANEJADO">Planejado</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="FECHADO">Fechado</option>
              </select>
              <Button variant="secondary">Salvar status</Button>
            </form>
            <form action={deleteEvent}>
              <input type="hidden" name="id" value={event.id} />
              <Button variant="danger">Excluir evento</Button>
            </form>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Receita" value={formatCurrency(totals.revenue)} tone="brand" />
        <StatTile label="Custos (insumos etc.)" value={formatCurrency(totals.costs)} />
        <StatTile label="Custo de equipe" value={formatCurrency(totals.staffCosts)} />
        <StatTile
          label="Resultado"
          value={formatCurrency(totals.result)}
          tone={totals.result >= 0 ? "positive" : "negative"}
          hint={`Margem de ${formatPercent(totals.margin)}`}
        />
      </div>

      {/* RECEITA */}
      <Section title="Receita (vendas)">
        {saleItems.length === 0 ? (
          <EmptyState>Nenhuma venda lançada ainda.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Produto</Th>
                <Th className="text-right">Qtd.</Th>
                <Th className="text-right">Preço</Th>
                <Th className="text-right">Subtotal</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {saleItems.map((item) => (
                <tr key={item.id}>
                  <Td>{item.productName}</Td>
                  <Td className="text-right">{item.quantity}</Td>
                  <Td className="text-right">{formatCurrency(item.unitPrice)}</Td>
                  <Td className="text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</Td>
                  <Td className="text-right">
                    <form action={deleteSaleItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <RemoveButton />
                    </form>
                  </Td>
                </tr>
              ))}
              <tr className="bg-black/[0.03] font-semibold">
                <Td colSpan={3}>Total</Td>
                <Td className="text-right">{formatCurrency(totals.revenue)}</Td>
                <Td></Td>
              </tr>
            </tbody>
          </Table>
        )}
        <form action={addSaleItem} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="eventId" value={event.id} />
          <MiniField label="Produto" name="productName" placeholder="Café Expresso" />
          <MiniField label="Qtd." name="quantity" type="number" step="1" placeholder="100" width="w-24" />
          <MiniField label="Preço (R$)" name="unitPrice" type="number" step="0.01" placeholder="10.00" width="w-28" />
          <Button variant="secondary">+ Adicionar venda</Button>
        </form>
      </Section>

      {/* CUSTOS */}
      <Section title="Custos do evento">
        {costs.length === 0 ? (
          <EmptyState>Nenhum custo lançado ainda.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Descrição</Th>
                <Th>Categoria</Th>
                <Th>Data</Th>
                <Th className="text-right">Valor</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost) => (
                <tr key={cost.id}>
                  <Td>{cost.description}</Td>
                  <Td>
                    <Badge tone="neutral">{CATEGORY_LABEL[cost.category]}</Badge>
                  </Td>
                  <Td>{formatDate(cost.date)}</Td>
                  <Td className="text-right font-medium">{formatCurrency(cost.amount)}</Td>
                  <Td className="text-right">
                    <form action={deleteEventCost}>
                      <input type="hidden" name="id" value={cost.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <RemoveButton />
                    </form>
                  </Td>
                </tr>
              ))}
              <tr className="bg-black/[0.03] font-semibold">
                <Td colSpan={3}>Total</Td>
                <Td className="text-right">{formatCurrency(totals.costs)}</Td>
                <Td></Td>
              </tr>
            </tbody>
          </Table>
        )}
        <form action={addEventCost} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="eventId" value={event.id} />
          <MiniField label="Descrição" name="description" placeholder="Compra de cápsulas" />
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Categoria</label>
            <select name="category" className="rounded-lg border border-black/15 px-2 py-2 text-sm">
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <MiniField label="Data" name="date" type="date" width="w-36" />
          <MiniField label="Valor (R$)" name="amount" type="number" step="0.01" placeholder="0.00" width="w-28" />
          <Button variant="secondary">+ Adicionar custo</Button>
        </form>
      </Section>

      {/* STAFF */}
      <Section title="Equipe escalada">
        {staffShifts.length === 0 ? (
          <EmptyState>Nenhum funcionário escalado ainda.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Funcionário</Th>
                <Th>Data</Th>
                <Th className="text-right">Diária</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {staffShifts.map((shift) => (
                <tr key={shift.id}>
                  <Td>{shift.staffMemberName}</Td>
                  <Td>{formatDate(shift.date)}</Td>
                  <Td className="text-right font-medium">{formatCurrency(shift.dailyRate)}</Td>
                  <Td className="text-right">
                    <form action={deleteStaffShift}>
                      <input type="hidden" name="id" value={shift.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <RemoveButton />
                    </form>
                  </Td>
                </tr>
              ))}
              <tr className="bg-black/[0.03] font-semibold">
                <Td colSpan={2}>Total equipe</Td>
                <Td className="text-right">{formatCurrency(totals.staffCosts)}</Td>
                <Td></Td>
              </tr>
            </tbody>
          </Table>
        )}
        {staffMembers.length === 0 ? (
          <p className="mt-3 text-sm text-black/50">
            Cadastre funcionários na aba Staff para poder escalá-los aqui.
          </p>
        ) : (
          <form action={addStaffShiftToEvent} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="eventId" value={event.id} />
            <div>
              <label className="mb-1 block text-xs font-medium text-black/60">Funcionário</label>
              <select name="staffMemberId" className="rounded-lg border border-black/15 px-2 py-2 text-sm">
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <MiniField label="Data" name="date" type="date" width="w-36" />
            <MiniField label="Diária (R$)" name="dailyRate" type="number" step="0.01" placeholder="200.00" width="w-28" />
            <Button variant="secondary">+ Escalar</Button>
          </form>
        )}
      </Section>

      {/* SÓCIOS */}
      <Section title="Divisão entre sócios / parceiros">
        {partnerShares.length === 0 ? (
          <EmptyState>Nenhuma divisão cadastrada.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Sócio / parceiro</Th>
                <Th className="text-right">%</Th>
                <Th className="text-right">Valor (sobre o resultado)</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {partnerShares.map((share) => (
                <tr key={share.id}>
                  <Td>{share.partnerName}</Td>
                  <Td className="text-right">{formatPercent(share.percentage)}</Td>
                  <Td className="text-right font-medium">{formatCurrency(totals.result * share.percentage)}</Td>
                  <Td className="text-right">
                    <form action={deletePartnerShare}>
                      <input type="hidden" name="id" value={share.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <RemoveButton />
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <form action={addPartnerShare} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="eventId" value={event.id} />
          <MiniField label="Sócio / parceiro" name="partnerName" placeholder="Vitória" />
          <MiniField label="% do resultado" name="percentage" type="number" step="0.01" placeholder="33.33" width="w-28" />
          <Button variant="secondary">+ Adicionar</Button>
        </form>
      </Section>

      {event.notes && (
        <Card className="mt-6 p-4 text-sm text-black/70">
          <p className="mb-1 font-medium text-black/50">Observações</p>
          {event.notes}
        </Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-[var(--brand-dark)]">{title}</h2>
      {children}
    </div>
  );
}

function MiniField({
  label,
  name,
  type = "text",
  placeholder,
  step,
  width = "w-40",
}: {
  label: string;
  name: string;
  type?: string;
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
        step={step}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-black/15 px-2 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
    </div>
  );
}

function RemoveButton() {
  return (
    <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
      remover
    </button>
  );
}
