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
    packageLabel: String(formData.get("packageLabel") ?? "").trim() || null,
    packageQty: toNumOrNull(formData.get("packageQty")) ?? 1,
    packageUnit: String(formData.get("packageUnit") ?? "").trim() || null,
    packagePrice: toNumOrNull(formData.get("packagePrice")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/insumos");
}

export async function deleteInsumo(formData: FormData) {
  const id = String(formData.get("id"));
  await repo.deleteInsumo(id);
  revalidatePath("/insumos");
}
