import * as repo from "@/lib/repo";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, Button, Card, PageHeader, Table, Td, Th, EmptyState } from "@/components/ui";
import { createStaffMember, deleteStaffMember, toggleShiftPaid } from "@/lib/actions/staff-actions";

export default async function StaffPage() {
  const staffMembers = await repo.listStaffMembers();
  const staff = await Promise.all(
    staffMembers.map(async (s) => ({
      ...s,
      shifts: await repo.listShiftsForStaffMember(s.id),
    }))
  );

  return (
    <div>
      <PageHeader title="Staff" subtitle="Equipe, diárias e escalas por evento" />

      {staff.length === 0 ? (
        <Card>
          <EmptyState>Nenhum funcionário cadastrado ainda.</EmptyState>
        </Card>
      ) : (
        <div className="space-y-4">
          {staff.map((s) => {
            const totalRecebido = s.shifts.filter((sh) => sh.paid).reduce((sum, sh) => sum + sh.dailyRate, 0);
            const totalPendente = s.shifts.filter((sh) => !sh.paid).reduce((sum, sh) => sum + sh.dailyRate, 0);
            return (
              <Card key={s.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--brand-dark)]">{s.name}</p>
                    <p className="text-xs text-black/50">
                      {s.role ?? "—"} {s.dailyRate ? `· diária padrão ${formatCurrency(s.dailyRate)}` : ""}
                      {s.phone ? ` · ${s.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-emerald-700">Pago: {formatCurrency(totalRecebido)}</span>
                    <span className="text-amber-700">Pendente: {formatCurrency(totalPendente)}</span>
                    <form action={deleteStaffMember}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                        remover funcionário
                      </button>
                    </form>
                  </div>
                </div>
                {s.shifts.length > 0 && (
                  <div className="mt-3">
                    <Table>
                      <thead>
                        <tr>
                          <Th>Evento</Th>
                          <Th>Data</Th>
                          <Th className="text-right">Diária</Th>
                          <Th>Status</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.shifts.map((sh) => (
                          <tr key={sh.id}>
                            <Td>{sh.eventName}</Td>
                            <Td>{formatDate(sh.date)}</Td>
                            <Td className="text-right">{formatCurrency(sh.dailyRate)}</Td>
                            <Td>
                              <form action={toggleShiftPaid}>
                                <input type="hidden" name="id" value={sh.id} />
                                <input type="hidden" name="paid" value={String(sh.paid)} />
                                <button type="submit">
                                  <Badge tone={sh.paid ? "positive" : "warning"}>
                                    {sh.paid ? "Pago" : "Pendente"}
                                  </Badge>
                                </button>
                              </form>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--brand-dark)]">+ Novo funcionário</h2>
        <form action={createStaffMember} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TextField label="Nome" name="name" required />
          <TextField label="Função" name="role" placeholder="Barista, montador..." />
          <TextField label="Diária padrão (R$)" name="dailyRate" type="number" step="0.01" placeholder="200.00" />
          <TextField label="Telefone" name="phone" />
          <div className="col-span-full">
            <TextField label="Observações" name="notes" />
          </div>
          <div className="col-span-full">
            <Button variant="secondary">+ Adicionar funcionário</Button>
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
