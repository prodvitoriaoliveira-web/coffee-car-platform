import * as repo from "@/lib/repo";
import { formatCurrency } from "@/lib/format";
import { Card, PageHeader, StatTile, Table, Td, Th, EmptyState } from "@/components/ui";

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const idx = parseInt(m, 10) - 1;
  return `${names[idx] ?? m}/${y.slice(2)}`;
}

export default async function FluxoDeCaixaPage() {
  const flow = await repo.monthlyCashFlow();

  const totalEntradas = flow.reduce((s, f) => s + f.entradas, 0);
  const totalSaidas = flow.reduce((s, f) => s + f.saidas, 0);
  const saldo = totalEntradas - totalSaidas;

  const maxValue = Math.max(1, ...flow.flatMap((f) => [f.entradas, f.saidas]));

  return (
    <div>
      <PageHeader title="Fluxo de Caixa" subtitle="Entradas × Saídas, por mês (com base em contas pagas/recebidas)" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatTile label="Entradas" value={formatCurrency(totalEntradas)} tone="positive" />
        <StatTile label="Saídas" value={formatCurrency(totalSaidas)} tone="negative" />
        <StatTile label="Saldo do período" value={formatCurrency(saldo)} tone={saldo >= 0 ? "positive" : "negative"} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--brand-dark)]">Entradas × Saídas por mês</h2>
        {flow.length === 0 ? (
          <Card>
            <EmptyState>
              Nenhuma movimentação ainda. O fluxo de caixa é calculado a partir de contas marcadas como pagas (Contas a
              Pagar) e recebidas (Contas a Receber).
            </EmptyState>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="space-y-3">
              {flow.map((f) => (
                <div key={f.month} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-xs font-medium text-black/60">{monthLabel(f.month)}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 rounded-sm bg-[#2a78d6]" style={{ width: `${(f.entradas / maxValue) * 100}%` }} />
                      <span className="text-xs text-black/50">{formatCurrency(f.entradas)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 rounded-sm bg-[#eb6834]" style={{ width: `${(f.saidas / maxValue) * 100}%` }} />
                      <span className="text-xs text-black/50">{formatCurrency(f.saidas)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs font-medium text-black/60">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#2a78d6]" /> Entradas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#eb6834]" /> Saídas
              </span>
            </div>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--brand-dark)]">Detalhe por mês</h2>
        {flow.length === 0 ? (
          <Card>
            <EmptyState>Sem dados ainda.</EmptyState>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Mês</Th>
                <Th className="text-right">Entradas</Th>
                <Th className="text-right">Saídas</Th>
                <Th className="text-right">Saldo</Th>
              </tr>
            </thead>
            <tbody>
              {flow.map((f) => {
                const saldoMes = f.entradas - f.saidas;
                return (
                  <tr key={f.month}>
                    <Td>{monthLabel(f.month)}</Td>
                    <Td className="text-right text-emerald-700">{formatCurrency(f.entradas)}</Td>
                    <Td className="text-right text-red-700">{formatCurrency(f.saidas)}</Td>
                    <Td className={`text-right font-semibold ${saldoMes >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {formatCurrency(saldoMes)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
