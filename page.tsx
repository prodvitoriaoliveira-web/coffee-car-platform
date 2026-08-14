import * as repo from "@/lib/repo";
import { insumoUnitCost } from "@/lib/calc";
import { formatCurrency } from "@/lib/format";
import { Button, Card, PageHeader, Table, Td, Th, EmptyState } from "@/components/ui";
import { createInsumo, deleteInsumo } from "@/lib/actions/insumo-actions";

export default async function InsumosPage() {
  const insumos = await repo.listInsumos();

  return (
    <div>
      <PageHeader title="Custos & Insumos" subtitle="Catálogo de insumos e custo unitário calculado automaticamente" />

      {insumos.length === 0 ? (
        <Card>
          <EmptyState>Nenhum insumo cadastrado ainda.</EmptyState>
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Insumo</Th>
              <Th>Embalagem / rende</Th>
              <Th className="text-right">Qtd.</Th>
              <Th>Unidade</Th>
              <Th className="text-right">Preço embalagem</Th>
              <Th className="text-right">Custo unitário</Th>
              <Th>Observação</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((i) => {
              const unitCost = insumoUnitCost(i.packagePrice, i.packageQty);
              return (
                <tr key={i.id}>
                  <Td className="font-medium">{i.name}</Td>
                  <Td>{i.packageLabel ?? "—"}</Td>
                  <Td className="text-right">{i.packageQty}</Td>
                  <Td>{i.packageUnit ?? "—"}</Td>
                  <Td className="text-right">
                    {i.packagePrice != null ? formatCurrency(i.packagePrice) : "não informado"}
                  </Td>
                  <Td className="text-right font-semibold">
                    {unitCost != null ? formatCurrency(unitCost) : "não informado"}
                  </Td>
                  <Td className="max-w-xs text-xs text-black/50">{i.notes ?? ""}</Td>
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
        <form action={createInsumo} className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <TextField label="Nome" name="name" required />
          <TextField label="Embalagem / rende" name="packageLabel" placeholder="Pacote, Pote (400g)..." />
          <TextField label="Unidade" name="packageUnit" placeholder="un, porção de 10g, ml..." />
          <TextField label="Qtd. por embalagem" name="packageQty" type="number" step="0.01" placeholder="10" />
          <TextField label="Preço da embalagem (R$)" name="packagePrice" type="number" step="0.01" placeholder="24.00" />
          <TextField label="Observação" name="notes" />
          <div className="col-span-full">
            <Button variant="secondary">+ Adicionar insumo</Button>
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
