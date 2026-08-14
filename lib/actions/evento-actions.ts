"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as repo from "@/lib/repo";

function toNum(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toDateOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function createEvent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const id = await repo.createEvent({
    name,
    location: String(formData.get("location") ?? "").trim() || null,
    startDate: toDateOrNull(formData.get("startDate")),
    endDate: toDateOrNull(formData.get("endDate")),
    status: (String(formData.get("status") ?? "PLANEJADO") as repo.EventStatus),
    venueCommissionPct: formData.get("venueCommissionPct") ? toNum(formData.get("venueCommissionPct")) / 100 : null,
    clientName: String(formData.get("clientName") ?? "").trim() || null,
    guestCount: formData.get("guestCount") ? Math.round(toNum(formData.get("guestCount"))) : null,
    responsible: String(formData.get("responsible") ?? "").trim() || null,
    contractedValue: formData.get("contractedValue") ? toNum(formData.get("contractedValue")) : null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  revalidatePath("/eventos");
  redirect(`/eventos/${id}`);
}

export async function updateEventDetails(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  await repo.updateEventDetails(eventId, {
    clientName: String(formData.get("clientName") ?? "").trim() || null,
    guestCount: formData.get("guestCount") ? Math.round(toNum(formData.get("guestCount"))) : null,
    responsible: String(formData.get("responsible") ?? "").trim() || null,
    contractedValue: formData.get("contractedValue") ? toNum(formData.get("contractedValue")) : null,
  });
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/eventos");
}

export async function updateEventStatus(eventId: string, status: repo.EventStatus) {
  await repo.updateEventStatus(eventId, status);
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/eventos");
}

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get("id"));
  await repo.deleteEvent(id);
  revalidatePath("/eventos");
  redirect("/eventos");
}

export async function addSaleItem(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  const productName = String(formData.get("productName") ?? "").trim();
  if (!productName) return;

  await repo.addSaleItem({
    eventId,
    productName,
    quantity: toNum(formData.get("quantity")),
    unitPrice: toNum(formData.get("unitPrice")),
  });
  revalidatePath(`/eventos/${eventId}`);
}

export async function deleteSaleItem(formData: FormData) {
  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId"));
  await repo.deleteSaleItem(id);
  revalidatePath(`/eventos/${eventId}`);
}

export async function addEventCost(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;

  await repo.addEventCost({
    eventId,
    description,
    category: String(formData.get("category") ?? "OUTRO") as repo.CostCategory,
    amount: toNum(formData.get("amount")),
    date: toDateOrNull(formData.get("date")),
  });
  revalidatePath(`/eventos/${eventId}`);
}

export async function deleteEventCost(formData: FormData) {
  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId"));
  await repo.deleteEventCost(id);
  revalidatePath(`/eventos/${eventId}`);
}

export async function addStaffShiftToEvent(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  const staffMemberId = String(formData.get("staffMemberId"));
  const date = toDateOrNull(formData.get("date"));
  if (!staffMemberId || !date) return;

  await repo.addStaffShift({
    eventId,
    staffMemberId,
    date,
    dailyRate: toNum(formData.get("dailyRate")),
  });
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/staff");
}

export async function deleteStaffShift(formData: FormData) {
  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId"));
  await repo.deleteStaffShift(id);
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/staff");
}

export async function addPartnerShare(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  const partnerName = String(formData.get("partnerName") ?? "").trim();
  if (!partnerName) return;

  await repo.addPartnerShare({
    eventId,
    partnerName,
    percentage: toNum(formData.get("percentage")) / 100,
  });
  revalidatePath(`/eventos/${eventId}`);
}

export async function deletePartnerShare(formData: FormData) {
  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId"));
  await repo.deletePartnerShare(id);
  revalidatePath(`/eventos/${eventId}`);
}

export async function addChecklistItem(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  const description = String(formData.get("description") ?? "").trim();
  const groupName = String(formData.get("groupName") ?? "").trim() as repo.ChecklistGroup;
  if (!description || !groupName) return;

  await repo.addChecklistItem({ eventId, groupName, description });
  revalidatePath(`/eventos/${eventId}`);
}

export async function toggleChecklistItem(formData: FormData) {
  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId"));
  const done = formData.get("done") === "1";
  await repo.toggleChecklistItem(id, done);
  revalidatePath(`/eventos/${eventId}`);
}

export async function deleteChecklistItem(formData: FormData) {
  const id = String(formData.get("id"));
  const eventId = String(formData.get("eventId"));
  await repo.deleteChecklistItem(id);
  revalidatePath(`/eventos/${eventId}`);
}
