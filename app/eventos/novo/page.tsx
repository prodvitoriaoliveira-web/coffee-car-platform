import { createEvent } from "@/lib/actions/evento-actions";
import { Card, PageHeader, Button } from "@/components/ui";

export default function NovoEventoPage() {
  return (
    <div className="max-w-xl">
      <PageHeader title="Novo evento" />
      <Card className="p-6">
        <form action={createEvent} className="space-y-4">
          <Field label="Nome do evento" name="name" required placeholder="Ex: Adapta Summit" />
          <Field label="Local" name="location" placeholder="Ex: São Paulo" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data início" name="startDate" type="date" />
            <Field label="Data fim" name="endDate" type="date" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-black/70">Status</label>
            <select name="status" className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm">
              <option value="PLANEJADO">Planejado</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="FECHADO">Fechado</option>
            </select>
          </div>
          <Field
            label="Comissão / repasse ao dono do evento (%)"
            name="venueCommissionPct"
            type="number"
            step="0.01"
            placeholder="Ex: 35"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-black/70">Observações</label>
            <textarea name="notes" rows={3} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
          </div>
          <Button>Criar evento</Button>
        </form>
      </Card>
    </div>
  );
}

function Field({
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
      <label className="mb-1 block text-sm font-medium text-black/70">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
    </div>
  );
}
