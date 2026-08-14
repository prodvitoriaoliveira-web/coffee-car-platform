"use server";

import { revalidatePath } from "next/cache";
import * as repo from "@/lib/repo";

function toNum(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await repo.createAccount({ name, notes: String(formData.get("notes") ?? "").trim() || null });
  revalidatePath("/financeiro");
}

export async function deleteAccount(formData: FormData) {
  const id = String(formData.get("id"));
  await repo.deleteAccount(id);
  revalidatePath("/financeiro");
}

export async function createLedgerEntry(formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  if (!reason || !dateStr) return;

  const eventId = String(formData.get("eventId") ?? "").trim();
  const fromAccountId = String(formData.get("fromAccountId") ?? "").trim();

  await repo.createLedgerEntry({
    date: dateStr,
    amount: toNum(formData.get("amount")),
    reason,
    eventId: eventId || null,
    fromAccountId: fromAccountId || null,
    toAccountLabel: String(formData.get("toAccountLabel") ?? "").trim() || null,
    whoReturns: String(formData.get("whoReturns") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/financeiro");
}

export async function deleteLedgerEntry(formData: FormData) {
  const id = String(formData.get("id"));
  await repo.deleteLedgerEntry(id);
  revalidatePath("/financeiro");
}
