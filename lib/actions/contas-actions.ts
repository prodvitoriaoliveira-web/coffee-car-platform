"use server";

import { revalidatePath } from "next/cache";
import * as repo from "@/lib/repo";

function toNum(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toDateOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function createPayable(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  const eventId = String(formData.get("eventId") ?? "").trim();

  await repo.createPayable({
    description,
    supplier: String(formData.get("supplier") ?? "").trim() || null,
    amount: toNum(formData.get("amount")),
    dueDate: toDateOrNull(formData.get("dueDate")),
    eventId: eventId || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/contas-a-pagar");
}

export async function togglePayablePaid(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as repo.PayableStatus;
  await repo.togglePayablePaid(id, status);
  revalidatePath("/contas-a-pagar");
}

export async function deletePayable(formData: FormData) {
  const id = String(formData.get("id"));
  await repo.deletePayable(id);
  revalidatePath("/contas-a-pagar");
}

export async function createReceivable(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  const eventId = String(formData.get("eventId") ?? "").trim();

  await repo.createReceivable({
    description,
    payer: String(formData.get("payer") ?? "").trim() || null,
    amount: toNum(formData.get("amount")),
    dueDate: toDateOrNull(formData.get("dueDate")),
    eventId: eventId || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/contas-a-receber");
}

export async function toggleReceivableReceived(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as repo.ReceivableStatus;
  await repo.toggleReceivableReceived(id, status);
  revalidatePath("/contas-a-receber");
}

export async function deleteReceivable(formData: FormData) {
  const id = String(formData.get("id"));
  await repo.deleteReceivable(id);
  revalidatePath("/contas-a-receber");
}
