import Link from "next/link";
import * as repo from "@/lib/repo";
import { computeEventTotals } from "@/lib/calc";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Card, PageHeader, StatTile, Table, Td, Th, EmptyState } from "@/components/ui";

const CATEGORY_LABEL: Record<string, string> = {
  INSUMO: "Insumo",
  FRETE: "Frete",
  REPASSE: "Repasse / comissão",
  EQUIPE: "Equipe",
  ALUGUEL: "Aluguel",
  OUTRO: "Outro",
};

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const idx = parseInt(m, 10) - 1;
  return `${names[idx] ?? m}/${y.slice(2)}`;
}

export default async function RelatoriosPage() {
  const events = await repo.listEvents();
  const allSaleItems = await repo.listAllSaleItems();
  const allCosts = await repo.listAllEventCosts();
  const allShifts = await repo.listAllStaffShifts();
  const despesasPorCategoria = await repo.despesasPorCategoria();
  const receitasPorCliente = await repo.receitasPorCliente();
  const { payables, receivables } = await repo.contasEmAberto();

  const eventTotals = events.map((event) => ({
    event,
    totals: computeEventTotals({
      saleItems: allSaleItems.filter((i) => i.eventId === event.id),
      costs: allCosts.filter((c) => c.eventId === event.id),
      staffShifts: allShifts.filter((s) => s.eventId === event.id),
    }),
  }));

  const revenue = eventTotals.reduce((s, t) => s + t.totals.revenue, 0);
  const totalCosts = eventTotals.reduce((s, t) => s + t.totals.totalCosts, 0);
  const result = revenue - totalCosts;

  // Resultado por mês (baseado na data de início do evento)
  const byMonth = new Map<string, { revenue: number; costs: number }>();
  for (const { event, totals } of eventTotals) {
    if (!event.startDate) continue;
    const month = event.startDate.slice(0, 7);
    const acc = byMonth.get(month) ?? { revenue: 0, costs: 0 };
    acc.revenue += totals.revenue;
    acc.costs += totals.totalCosts;
    byMonth.set(month, acc);
  }
  const monthRows = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v, result: v.revenue - v.costs }));

  const totalContasAbertoPagar = payables.reduce((s, p) => s + p.amount, 0);
  const totalContasAbertoReceber = receivables.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="DRE simplificada, resultados, despesas e contas em aberto" />

      {/* DRE SIMPLIFICADA */}
      <Section title="DRE simplificada">
        <Card className="p-5">
          <div className="divide-y divide-black/5 text-sm">
            <Row label="Receita bruta (vendas)" value={formatCurrency(revenue)} />
            <Row label="(–) Custos e despesas (insumos, equipe, frete, aluguel...)" value={`- ${formatCurrency(totalCosts)}`} />
            <Row
              label="= Resultado líquido"
              value={formatCurrency(result)}
              bold
              tone={result >= 0 ? "positive" : "negative"}
            />
            <Row label="Margem" value={revenue > 0 ? formatPercent(result / revenue) : "—"} />
          </div>
        </Card>
      </Section>

      {/* RESULTADO POR MÊS */}
      <Section title="Resultado por mês">
        {monthRows.length === 0 ? (
          <Card>
            <EmptyState>Sem eventos com data cadastrada ainda.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Mês</Th>
                <Th className="text-right">Receita</Th>
                <Th className="text-right">Custos</Th>
                <Th className="text-right">Resultado</Th>
              </tr>
            </thead>
            <tbody>
              {monthRows.map((r) => (
                <tr key={r.month}>
                  <Td>{monthLabel(r.month)}</Td>
                  <Td className="text-right">{formatCurrency(r.revenue)}</Td>
                  <Td className="text-right">{formatCurrency(r.costs)}</Td>
                  <Td className={`text-right font-semibold ${r.result >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {formatCurrency(r.result)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {/* RESULTADO POR EVENTO */}
      <Section title="Resultado por evento">
        {eventTotals.length === 0 ? (
          <Card>
            <EmptyState>Nenhum evento cadastrado ainda.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Evento</Th>
                <Th>Cliente</Th>
                <Th className="text-right">Receita</Th>
                <Th className="text-right">Custos</Th>
                <Th className="text-right">Resultado</Th>
                <Th className="text-right">Margem</Th>
              </tr>
            </thead>
            <tbody>
              {eventTotals.map(({ event, totals }) => (
                <tr key={event.id}>
                  <Td>
                    <Link href={`/eventos/${event.id}`} className="font-medium text-[var(--brand)] hover:underline">
                      {event.name}
                    </Link>
                  </Td>
                  <Td>{event.clientName ?? "—"}</Td>
                  <Td className="text-right">{formatCurrency(totals.revenue)}</Td>
                  <Td className="text-right">{formatCurrency(totals.totalCosts)}</Td>
                  <Td className={`text-right font-semibold ${totals.result >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {formatCurrency(totals.result)}
                  </Td>
                  <Td className="text-right">{formatPercent(totals.margin)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {/* DESPESAS POR CATEGORIA */}
      <Section title="Despesas por categoria">
        {despesasPorCategoria.length === 0 ? (
          <Card>
            <EmptyState>Nenhum custo lançado ainda.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Categoria</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {despesasPorCategoria.map((d) => (
                <tr key={d.category}>
                  <Td>{CATEGORY_LABEL[d.category] ?? d.category}</Td>
                  <Td className="text-right font-medium">{formatCurrency(d.total)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {/* RECEITAS POR CLIENTE */}
      <Section title="Receitas por cliente">
        {receitasPorCliente.length === 0 ? (
          <Card>
            <EmptyState>Nenhuma venda lançada ainda.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Cliente</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {receitasPorCliente.map((r) => (
                <tr key={r.clientName}>
                  <Td>{r.clientName}</Td>
                  <Td className="text-right font-medium">{formatCurrency(r.total)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {/* CONTAS EM ABERTO */}
      <Section title="Contas em aberto">
        <div className="grid grid-cols-2 gap-4">
          <StatTile label="A pagar" value={formatCurrency(totalContasAbertoPagar)} tone="negative" />
          <StatTile label="A receber" value={formatCurrency(totalContasAbertoReceber)} tone="warning" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-black/60">A pagar</h3>
            {payables.length === 0 ? (
              <Card>
                <EmptyState>Nada em aberto.</EmptyState>
              </Card>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Descrição</Th>
                    <Th>Vencimento</Th>
                    <Th className="text-right">Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {payables.map((p) => (
                    <tr key={p.id}>
                      <Td>{p.description}</Td>
                      <Td>{formatDate(p.dueDate)}</Td>
                      <Td className="text-right">{formatCurrency(p.amount)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-black/60">A receber</h3>
            {receivables.length === 0 ? (
              <Card>
                <EmptyState>Nada em aberto.</EmptyState>
              </Card>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Descrição</Th>
                    <Th>Vencimento</Th>
                    <Th className="text-right">Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((r) => (
                    <tr key={r.id}>
                      <Td>{r.description}</Td>
                      <Td>{formatDate(r.dueDate)}</Td>
                      <Td className="text-right">{formatCurrency(r.amount)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      </Section>
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

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "positive" | "negative";
}) {
  const toneClass = tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-red-700" : "";
  return (
    <div className="flex items-center justify-between py-2">
      <span className={bold ? "font-semibold text-black/80" : "text-black/60"}>{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${toneClass}`}>{value}</span>
    </div>
  );
}
