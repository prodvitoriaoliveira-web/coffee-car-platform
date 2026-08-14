"use server";

import { revalidatePath } from "next/cache";
import * as repo from "@/lib/repo";

function toNumOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function createStaffMember(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await repo.createStaffMember({
    name,
    role: String(formData.get("role") ?? "").trim() || null,
    dailyRate: toNumOrNull(formData.get("dailyRate")),
    phone: String(formData.get("phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath("/staff");
}

export async function deleteStaffMember(formData: FormData) {
  const id = String(formData.get("id"));
  await repo.deleteStaffMember(id);
  revalidatePath("/staff");
}

export async function toggleShiftPaid(formData: FormData) {
  const id = String(formData.get("id"));
  const paid = String(formData.get("paid")) === "true";
  await repo.toggleShiftPaid(id, paid);
  revalidatePath("/staff");
}
