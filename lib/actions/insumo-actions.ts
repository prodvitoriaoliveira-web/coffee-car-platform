"use server";

import { revalidatePath } from "next/cache";
import * as repo from "@/lib/repo";

function toNumOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function createInsumo(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await repo.createInsumo({
    name,
    category: String(formData.get("category") ?? "").trim() || null,
    packageLabel: String(formData.get("packageLabel") ?? "").trim() || null,
    packageQty: toNumOrNull(formData.get("packageQty")) ?? 1,
    packageUnit: String(formData.get("packageUnit") ?? "").trim() || null,
    packagePrice: toNumOrNull(formData.get("packagePrice")),
    supplier: String(formData.get("supplier") ?? "").trim() || null,
    currentStock: toNumOrNull(formData.get("currentStock")) ?? 0,
    minStock: toNumOrNull(formData.get("minStock")),
    replenishValue: toNumOrNull(formData.get("replenishValue")),
    location: String(formData.get("location") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/insumos");
}

export async function deleteInsumo(formData: FormData) {
  const id = String(formData.get("id"));
  await repo.deleteInsumo(id);
  revalidatePath("/insumos");
}

function toDateOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function createStockMovement(formData: FormData) {
  const insumoId = String(formData.get("insumoId") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim() as repo.StockMovementType;
  const quantity = toNumOrNull(formData.get("quantity"));
  if (!insumoId || !type || !quantity) return;
  const eventId = String(formData.get("eventId") ?? "").trim();

  await repo.createStockMovement({
    insumoId,
    type,
    quantity,
    eventId: eventId || null,
    date: toDateOrNull(formData.get("date")) ?? new Date().toISOString().slice(0, 10),
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/insumos");
  if (eventId) revalidatePath(`/eventos/${eventId}`);
}

export async function deleteStockMovement(formData: FormData) {
  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId") ?? "").trim();
  await repo.deleteStockMovement(id);
  revalidatePath("/insumos");
  if (eventId) revalidatePath(`/eventos/${eventId}`);
}
