import Link from "next/link";
import * as repo from "@/lib/repo";
import { computeEventTotals } from "@/lib/calc";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, ButtonLink, Card, PageHeader, Table, Td, Th, EmptyState } from "@/components/ui";

export default async function EventosPage() {
  const events = await repo.listEvents();
  const allSaleItems = await repo.listAllSaleItems();
  const allCosts = await repo.listAllEventCosts();
  const allShifts = await repo.listAllStaffShifts();

  return (
    <div>
      <PageHeader
        title="Eventos"
        subtitle="Cada evento tem sua receita, custos e fechamento próprios"
        action={<ButtonLink href="/eventos/novo">+ Novo evento</ButtonLink>}
      />

      {events.length === 0 ? (
        <Card>
          <EmptyState>Nenhum evento cadastrado ainda.</EmptyState>
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Evento</Th>
              <Th>Cliente</Th>
              <Th>Local</Th>
              <Th>Status</Th>
              <Th>Data</Th>
              <Th className="text-right">Receita</Th>
              <Th className="text-right">Resultado</Th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const t = computeEventTotals({
                saleItems: allSaleItems.filter((i) => i.eventId === event.id),
                costs: allCosts.filter((c) => c.eventId === event.id),
                staffShifts: allShifts.filter((s) => s.eventId === event.id),
              });
              return (
                <tr key={event.id} className="hover:bg-black/[0.02]">
                  <Td>
                    <Link href={`/eventos/${event.id}`} className="font-medium text-[var(--brand)] hover:underline">
                      {event.name}
                    </Link>
                  </Td>
                  <Td>{event.clientName ?? "—"}</Td>
                  <Td>{event.location ?? "—"}</Td>
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
                  <Td className={`text-right font-semibold ${t.result >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {formatCurrency(t.result)}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
