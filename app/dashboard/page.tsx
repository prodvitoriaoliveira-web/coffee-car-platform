import Link from "next/link";
import * as repo from "@/lib/repo";
import { computeEventTotals } from "@/lib/calc";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { Badge, Card, PageHeader, StatTile, Table, Td, Th, EmptyState } from "@/components/ui";

export default async function DashboardPage() {
  const events = await repo.listEvents();
  const allSaleItems = await repo.listAllSaleItems();
  const allCosts = await repo.listAllEventCosts();
  const allShifts = await repo.listAllStaffShifts();

  const totals = events.map((event) => ({
    event,
    totals: computeEventTotals({
      saleItems: allSaleItems.filter((i) => i.eventId === event.id),
      costs: allCosts.filter((c) => c.eventId === event.id),
      staffShifts: allShifts.filter((s) => s.eventId === event.id),
    }),
  }));

  const revenue = totals.reduce((s, t) => s + t.totals.revenue, 0);
  const costs = totals.reduce((s, t) => s + t.totals.totalCosts, 0);
  const result = revenue - costs;

  const payablesPending = await repo.aggregatePendingAmount("Payable");
  const receivablesPending = await repo.aggregatePendingAmount("Receivable");

  return (
    <div>
      <PageHeader title="Resumo Geral" subtitle="Visão consolidada de todos os eventos do Coffee Car" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Receita total" value={formatCurrency(revenue)} tone="brand" />
        <StatTile label="Custos totais" value={formatCurrency(costs)} />
        <StatTile
          label="Resultado"
          value={formatCurrency(result)}
          tone={result >= 0 ? "positive" : "negative"}
          hint={revenue > 0 ? `Margem de ${formatPercent(result / revenue)}` : undefined}
        />
        <StatTile label="Eventos cadastrados" value={String(events.length)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatTile label="Contas a pagar pendentes" value={formatCurrency(payablesPending)} tone="negative" />
        <StatTile label="Contas a receber pendentes" value={formatCurrency(receivablesPending)} tone="positive" />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--brand-dark)]">Eventos</h2>
        {events.length === 0 ? (
          <Card>
            <EmptyState>Nenhum evento cadastrado ainda. Crie um na aba Eventos.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Evento</Th>
                <Th>Status</Th>
                <Th>Data</Th>
                <Th className="text-right">Receita</Th>
                <Th className="text-right">Custos</Th>
                <Th className="text-right">Resultado</Th>
                <Th className="text-right">Margem</Th>
              </tr>
            </thead>
            <tbody>
              {totals.map(({ event, totals: t }) => (
                <tr key={event.id} className="hover:bg-black/[0.02]">
                  <Td>
                    <Link href={`/eventos/${event.id}`} className="font-medium text-[var(--brand)] hover:underline">
                      {event.name}
                    </Link>
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        event.status === "FECHADO"
                          ? "neutral"
                          : event.status === "EM_ANDAMENTO"
                          ? "warning"
                          : "brand"
                      }
                    >
                      {event.status.replace("_", " ")}
                    </Badge>
                  </Td>
                  <Td>{formatDate(event.startDate)}</Td>
                  <Td className="text-right">{formatCurrency(t.revenue)}</Td>
                  <Td className="text-right">{formatCurrency(t.totalCosts)}</Td>
                  <Td className={`text-right font-semibold ${t.result >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {formatCurrency(t.result)}
                  </Td>
                  <Td className="text-right">{formatPercent(t.margin)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
