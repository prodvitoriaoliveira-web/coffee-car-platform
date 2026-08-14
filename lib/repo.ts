import { db, ensureSchema, newId, nowIso } from "@/lib/db";

// ---------- Tipos ----------
export type EventStatus = "PLANEJADO" | "EM_ANDAMENTO" | "FECHADO";
export type CostCategory = "INSUMO" | "FRETE" | "REPASSE" | "EQUIPE" | "ALUGUEL" | "OUTRO";
export type PayableStatus = "PENDENTE" | "PAGO";
export type ReceivableStatus = "PENDENTE" | "RECEBIDO";
export type PayableCategory = "FORNECEDOR" | "ALUGUEL" | "EQUIPE" | "IMPOSTOS" | "MARKETING" | "OUTRO";
export type PaymentMethod = "DINHEIRO" | "PIX" | "CARTAO" | "TRANSFERENCIA" | "BOLETO" | "OUTRO";
export type StockMovementType = "ENTRADA" | "SAIDA" | "PERDA" | "DEVOLUCAO";
export type ChecklistGroup = "MATERIAIS" | "TRANSPORTE" | "MONTAGEM" | "PRODUCAO" | "DESMONTAGEM";

export type EventRow = {
  id: string;
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: EventStatus;
  venueCommissionPct: number | null;
  clientName: string | null;
  guestCount: number | null;
  responsible: string | null;
  contractedValue: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaleItemRow = {
  id: string;
  eventId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
};

export type EventCostRow = {
  id: string;
  eventId: string;
  category: CostCategory;
  description: string;
  amount: number;
  date: string | null;
  createdAt: string;
};

export type StaffMemberRow = {
  id: string;
  name: string;
  role: string | null;
  dailyRate: number | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
};

export type StaffShiftRow = {
  id: string;
  eventId: string;
  staffMemberId: string;
  date: string;
  dailyRate: number;
  paid: boolean;
};

export type PartnerShareRow = {
  id: string;
  eventId: string;
  partnerName: string;
  percentage: number;
};

export type InsumoRow = {
  id: string;
  name: string;
  category: string | null;
  packageLabel: string | null;
  packageQty: number;
  packageUnit: string | null;
  packagePrice: number | null;
  supplier: string | null;
  currentStock: number;
  minStock: number | null;
  replenishValue: number | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StockMovementRow = {
  id: string;
  insumoId: string;
  type: StockMovementType;
  quantity: number;
  eventId: string | null;
  date: string;
  notes: string | null;
  createdAt: string;
};

export type ChecklistItemRow = {
  id: string;
  eventId: string;
  groupName: ChecklistGroup;
  description: string;
  done: boolean;
  createdAt: string;
};

export type AccountRow = { id: string; name: string; notes: string | null };

export type LedgerEntryRow = {
  id: string;
  date: string;
  amount: number;
  reason: string;
  eventId: string | null;
  fromAccountId: string | null;
  toAccountLabel: string | null;
  whoReturns: string | null;
  notes: string | null;
  createdAt: string;
};

export type PayableRow = {
  id: string;
  description: string;
  supplier: string | null;
  category: string | null;
  costCenter: string | null;
  amount: number;
  dueDate: string | null;
  paymentMethod: string | null;
  paidDate: string | null;
  status: PayableStatus;
  eventId: string | null;
  attachmentUrl: string | null;
  notes: string | null;
  createdAt: string;
};

export type ReceivableRow = {
  id: string;
  description: string;
  payer: string | null;
  amount: number;
  dueDate: string | null;
  paymentMethod: string | null;
  receivedDate: string | null;
  status: ReceivableStatus;
  eventId: string | null;
  notes: string | null;
  createdAt: string;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "SOCIO";
  createdAt: string;
};

// ---------- Helpers de baixo nível ----------
type SqlArg = string | number | boolean | null | undefined;

async function exec(sql: string, args: SqlArg[] = []) {
  await ensureSchema();
  return db.execute({ sql, args: args as (string | number | boolean | null)[] });
}

async function getRow<T>(sql: string, args: SqlArg[] = []): Promise<T | undefined> {
  const rs = await exec(sql, args);
  return (rs.rows[0] as unknown as T) ?? undefined;
}

async function getRows<T>(sql: string, args: SqlArg[] = []): Promise<T[]> {
  const rs = await exec(sql, args);
  return rs.rows as unknown as T[];
}

function boolify<T extends { paid: unknown }>(row: T): T & { paid: boolean } {
  return { ...row, paid: Boolean(row.paid) };
}

// ---------- Users ----------
export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  return getRow<UserRow>("SELECT * FROM User WHERE email = ?", [email.toLowerCase().trim()]);
}

export async function createUser(data: { name: string; email: string; passwordHash: string; role: "ADMIN" | "SOCIO" }) {
  const id = newId();
  await exec("INSERT INTO User (id, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)", [
    id,
    data.name,
    data.email.toLowerCase().trim(),
    data.passwordHash,
    data.role,
    nowIso(),
  ]);
  return id;
}

export async function countUsers(): Promise<number> {
  const row = await getRow<{ c: number }>("SELECT COUNT(*) as c FROM User");
  return row?.c ?? 0;
}

// ---------- Events ----------
export async function listEvents(): Promise<EventRow[]> {
  return getRows<EventRow>("SELECT * FROM Event ORDER BY createdAt DESC");
}

export async function getEvent(id: string): Promise<EventRow | undefined> {
  return getRow<EventRow>("SELECT * FROM Event WHERE id = ?", [id]);
}

export async function listSaleItems(eventId: string): Promise<SaleItemRow[]> {
  return getRows<SaleItemRow>("SELECT * FROM SaleItem WHERE eventId = ? ORDER BY createdAt ASC", [eventId]);
}

export async function listEventCosts(eventId: string): Promise<EventCostRow[]> {
  return getRows<EventCostRow>("SELECT * FROM EventCost WHERE eventId = ? ORDER BY date ASC, createdAt ASC", [eventId]);
}

export async function listStaffShiftsForEvent(
  eventId: string
): Promise<(StaffShiftRow & { staffMemberName: string })[]> {
  const rows = await getRows<StaffShiftRow & { staffMemberName: string }>(
    `SELECT s.*, m.name as staffMemberName FROM StaffShift s
     JOIN StaffMember m ON m.id = s.staffMemberId
     WHERE s.eventId = ? ORDER BY s.date ASC`,
    [eventId]
  );
  return rows.map(boolify);
}

export async function listPartnerShares(eventId: string): Promise<PartnerShareRow[]> {
  return getRows<PartnerShareRow>("SELECT * FROM PartnerShare WHERE eventId = ?", [eventId]);
}

export async function listAllSaleItems(): Promise<SaleItemRow[]> {
  return getRows<SaleItemRow>("SELECT * FROM SaleItem");
}
export async function listAllEventCosts(): Promise<EventCostRow[]> {
  return getRows<EventCostRow>("SELECT * FROM EventCost");
}
export async function listAllStaffShifts(): Promise<StaffShiftRow[]> {
  const rows = await getRows<StaffShiftRow>("SELECT * FROM StaffShift");
  return rows.map(boolify);
}

export async function createEvent(data: {
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: EventStatus;
  venueCommissionPct: number | null;
  clientName?: string | null;
  guestCount?: number | null;
  responsible?: string | null;
  contractedValue?: number | null;
  notes: string | null;
}): Promise<string> {
  const id = newId();
  const ts = nowIso();
  await exec(
    `INSERT INTO Event (id, name, location, startDate, endDate, status, venueCommissionPct, clientName, guestCount, responsible, contractedValue, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.location,
      data.startDate,
      data.endDate,
      data.status,
      data.venueCommissionPct,
      data.clientName ?? null,
      data.guestCount ?? null,
      data.responsible ?? null,
      data.contractedValue ?? null,
      data.notes,
      ts,
      ts,
    ]
  );
  return id;
}

export async function updateEventDetails(
  id: string,
  data: {
    clientName: string | null;
    guestCount: number | null;
    responsible: string | null;
    contractedValue: number | null;
  }
) {
  await exec(
    "UPDATE Event SET clientName = ?, guestCount = ?, responsible = ?, contractedValue = ?, updatedAt = ? WHERE id = ?",
    [data.clientName, data.guestCount, data.responsible, data.contractedValue, nowIso(), id]
  );
}

export async function updateEventStatus(id: string, status: EventStatus) {
  await exec("UPDATE Event SET status = ?, updatedAt = ? WHERE id = ?", [status, nowIso(), id]);
}

export async function deleteEvent(id: string) {
  await exec("DELETE FROM Event WHERE id = ?", [id]);
}

export async function addSaleItem(data: { eventId: string; productName: string; quantity: number; unitPrice: number }) {
  await exec("INSERT INTO SaleItem (id, eventId, productName, quantity, unitPrice, createdAt) VALUES (?, ?, ?, ?, ?, ?)", [
    newId(),
    data.eventId,
    data.productName,
    data.quantity,
    data.unitPrice,
    nowIso(),
  ]);
}

export async function deleteSaleItem(id: string) {
  await exec("DELETE FROM SaleItem WHERE id = ?", [id]);
}

export async function addEventCost(data: {
  eventId: string;
  category: CostCategory;
  description: string;
  amount: number;
  date: string | null;
}) {
  await exec(
    "INSERT INTO EventCost (id, eventId, category, description, amount, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [newId(), data.eventId, data.category, data.description, data.amount, data.date, nowIso()]
  );
}

export async function deleteEventCost(id: string) {
  await exec("DELETE FROM EventCost WHERE id = ?", [id]);
}

export async function addStaffShift(data: { eventId: string; staffMemberId: string; date: string; dailyRate: number }) {
  await exec("INSERT INTO StaffShift (id, eventId, staffMemberId, date, dailyRate, paid) VALUES (?, ?, ?, ?, ?, 0)", [
    newId(),
    data.eventId,
    data.staffMemberId,
    data.date,
    data.dailyRate,
  ]);
}

export async function deleteStaffShift(id: string) {
  await exec("DELETE FROM StaffShift WHERE id = ?", [id]);
}

export async function toggleShiftPaid(id: string, currentlyPaid: boolean) {
  await exec("UPDATE StaffShift SET paid = ? WHERE id = ?", [currentlyPaid ? 0 : 1, id]);
}

export async function addPartnerShare(data: { eventId: string; partnerName: string; percentage: number }) {
  await exec("INSERT INTO PartnerShare (id, eventId, partnerName, percentage) VALUES (?, ?, ?, ?)", [
    newId(),
    data.eventId,
    data.partnerName,
    data.percentage,
  ]);
}

export async function deletePartnerShare(id: string) {
  await exec("DELETE FROM PartnerShare WHERE id = ?", [id]);
}

// ---------- Checklist do evento ----------
export async function listChecklistItems(eventId: string): Promise<ChecklistItemRow[]> {
  const rows = await getRows<ChecklistItemRow>(
    "SELECT * FROM EventChecklistItem WHERE eventId = ? ORDER BY groupName ASC, createdAt ASC",
    [eventId]
  );
  return rows.map((r) => ({ ...r, done: Boolean(r.done) }));
}

export async function addChecklistItem(data: { eventId: string; groupName: ChecklistGroup; description: string }) {
  await exec(
    "INSERT INTO EventChecklistItem (id, eventId, groupName, description, done, createdAt) VALUES (?, ?, ?, ?, 0, ?)",
    [newId(), data.eventId, data.groupName, data.description, nowIso()]
  );
}

export async function toggleChecklistItem(id: string, currentlyDone: boolean) {
  await exec("UPDATE EventChecklistItem SET done = ? WHERE id = ?", [currentlyDone ? 0 : 1, id]);
}

export async function deleteChecklistItem(id: string) {
  await exec("DELETE FROM EventChecklistItem WHERE id = ?", [id]);
}

// ---------- Insumos ----------
export async function listInsumos(): Promise<InsumoRow[]> {
  return getRows<InsumoRow>("SELECT * FROM Insumo ORDER BY name ASC");
}

export async function createInsumo(data: {
  name: string;
  category?: string | null;
  packageLabel: string | null;
  packageQty: number;
  packageUnit: string | null;
  packagePrice: number | null;
  supplier?: string | null;
  currentStock?: number;
  minStock?: number | null;
  replenishValue?: number | null;
  location?: string | null;
  notes: string | null;
}) {
  const ts = nowIso();
  await exec(
    `INSERT INTO Insumo (id, name, category, packageLabel, packageQty, packageUnit, packagePrice, supplier, currentStock, minStock, replenishValue, location, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      data.name,
      data.category ?? null,
      data.packageLabel,
      data.packageQty,
      data.packageUnit,
      data.packagePrice,
      data.supplier ?? null,
      data.currentStock ?? 0,
      data.minStock ?? null,
      data.replenishValue ?? null,
      data.location ?? null,
      data.notes,
      ts,
      ts,
    ]
  );
}

export async function deleteInsumo(id: string) {
  await exec("DELETE FROM Insumo WHERE id = ?", [id]);
}

// ---------- Movimentações de estoque ----------
const STOCK_DELTA_SIGN: Record<StockMovementType, 1 | -1> = {
  ENTRADA: 1,
  DEVOLUCAO: 1,
  SAIDA: -1,
  PERDA: -1,
};

export async function listStockMovements(
  limit = 200
): Promise<(StockMovementRow & { insumoName: string; eventName: string | null })[]> {
  return getRows(
    `SELECT m.*, i.name as insumoName, e.name as eventName FROM StockMovement m
     JOIN Insumo i ON i.id = m.insumoId
     LEFT JOIN Event e ON e.id = m.eventId
     ORDER BY m.date DESC, m.createdAt DESC LIMIT ?`,
    [limit]
  );
}

export async function listStockMovementsForEvent(
  eventId: string
): Promise<(StockMovementRow & { insumoName: string })[]> {
  return getRows(
    `SELECT m.*, i.name as insumoName FROM StockMovement m
     JOIN Insumo i ON i.id = m.insumoId
     WHERE m.eventId = ? ORDER BY m.createdAt DESC`,
    [eventId]
  );
}

export async function createStockMovement(data: {
  insumoId: string;
  type: StockMovementType;
  quantity: number;
  eventId: string | null;
  date: string;
  notes: string | null;
}) {
  await exec(
    `INSERT INTO StockMovement (id, insumoId, type, quantity, eventId, date, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [newId(), data.insumoId, data.type, data.quantity, data.eventId, data.date, data.notes, nowIso()]
  );
  const delta = STOCK_DELTA_SIGN[data.type] * data.quantity;
  await exec("UPDATE Insumo SET currentStock = currentStock + ?, updatedAt = ? WHERE id = ?", [
    delta,
    nowIso(),
    data.insumoId,
  ]);
}

export async function deleteStockMovement(id: string) {
  const row = await getRow<StockMovementRow>("SELECT * FROM StockMovement WHERE id = ?", [id]);
  if (!row) return;
  const delta = STOCK_DELTA_SIGN[row.type] * row.quantity;
  await exec("UPDATE Insumo SET currentStock = currentStock - ?, updatedAt = ? WHERE id = ?", [
    delta,
    nowIso(),
    row.insumoId,
  ]);
  await exec("DELETE FROM StockMovement WHERE id = ?", [id]);
}

// ---------- Staff ----------
export async function listStaffMembers(): Promise<StaffMemberRow[]> {
  return getRows<StaffMemberRow>("SELECT * FROM StaffMember ORDER BY name ASC");
}

export async function createStaffMember(data: {
  name: string;
  role: string | null;
  dailyRate: number | null;
  phone: string | null;
  notes: string | null;
}) {
  await exec("INSERT INTO StaffMember (id, name, role, dailyRate, phone, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    newId(),
    data.name,
    data.role,
    data.dailyRate,
    data.phone,
    data.notes,
    nowIso(),
  ]);
}

export async function deleteStaffMember(id: string) {
  await exec("DELETE FROM StaffMember WHERE id = ?", [id]);
}

export async function listShiftsForStaffMember(staffMemberId: string): Promise<(StaffShiftRow & { eventName: string })[]> {
  const rows = await getRows<StaffShiftRow & { eventName: string }>(
    `SELECT s.*, e.name as eventName FROM StaffShift s
     JOIN Event e ON e.id = s.eventId
     WHERE s.staffMemberId = ? ORDER BY s.date DESC`,
    [staffMemberId]
  );
  return rows.map(boolify);
}

// ---------- Financeiro ----------
export async function listAccounts(): Promise<AccountRow[]> {
  return getRows<AccountRow>("SELECT * FROM Account ORDER BY name ASC");
}

export async function createAccount(data: { name: string; notes: string | null }) {
  await exec("INSERT INTO Account (id, name, notes) VALUES (?, ?, ?)", [newId(), data.name, data.notes]);
}

export async function deleteAccount(id: string) {
  await exec("DELETE FROM Account WHERE id = ?", [id]);
}

export async function listLedgerEntries(): Promise<
  (LedgerEntryRow & { accountName: string | null; eventName: string | null })[]
> {
  return getRows(
    `SELECT l.*, a.name as accountName, e.name as eventName FROM LedgerEntry l
     LEFT JOIN Account a ON a.id = l.fromAccountId
     LEFT JOIN Event e ON e.id = l.eventId
     ORDER BY l.date DESC, l.createdAt DESC`
  );
}

export async function createLedgerEntry(data: {
  date: string;
  amount: number;
  reason: string;
  eventId: string | null;
  fromAccountId: string | null;
  toAccountLabel: string | null;
  whoReturns: string | null;
  notes: string | null;
}) {
  await exec(
    `INSERT INTO LedgerEntry (id, date, amount, reason, eventId, fromAccountId, toAccountLabel, whoReturns, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      data.date,
      data.amount,
      data.reason,
      data.eventId,
      data.fromAccountId,
      data.toAccountLabel,
      data.whoReturns,
      data.notes,
      nowIso(),
    ]
  );
}

export async function deleteLedgerEntry(id: string) {
  await exec("DELETE FROM LedgerEntry WHERE id = ?", [id]);
}

// ---------- Contas a pagar / receber ----------
export async function listPayables(): Promise<(PayableRow & { eventName: string | null })[]> {
  return getRows(
    `SELECT p.*, e.name as eventName FROM Payable p
     LEFT JOIN Event e ON e.id = p.eventId
     ORDER BY p.dueDate ASC`
  );
}

export async function createPayable(data: {
  description: string;
  supplier: string | null;
  category?: string | null;
  costCenter?: string | null;
  amount: number;
  dueDate: string | null;
  paymentMethod?: string | null;
  eventId: string | null;
  attachmentUrl?: string | null;
  notes: string | null;
}) {
  await exec(
    `INSERT INTO Payable (id, description, supplier, category, costCenter, amount, dueDate, paymentMethod, status, eventId, attachmentUrl, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?, ?, ?)`,
    [
      newId(),
      data.description,
      data.supplier,
      data.category ?? null,
      data.costCenter ?? null,
      data.amount,
      data.dueDate,
      data.paymentMethod ?? null,
      data.eventId,
      data.attachmentUrl ?? null,
      data.notes,
      nowIso(),
    ]
  );
}

export async function togglePayablePaid(id: string, currentStatus: PayableStatus) {
  if (currentStatus === "PAGO") {
    await exec("UPDATE Payable SET status = 'PENDENTE', paidDate = NULL WHERE id = ?", [id]);
  } else {
    await exec("UPDATE Payable SET status = 'PAGO', paidDate = ? WHERE id = ?", [nowIso(), id]);
  }
}

export async function deletePayable(id: string) {
  await exec("DELETE FROM Payable WHERE id = ?", [id]);
}

export async function listReceivables(): Promise<(ReceivableRow & { eventName: string | null })[]> {
  return getRows(
    `SELECT r.*, e.name as eventName FROM Receivable r
     LEFT JOIN Event e ON e.id = r.eventId
     ORDER BY r.dueDate ASC`
  );
}

export async function createReceivable(data: {
  description: string;
  payer: string | null;
  amount: number;
  dueDate: string | null;
  paymentMethod?: string | null;
  eventId: string | null;
  notes: string | null;
}) {
  await exec(
    `INSERT INTO Receivable (id, description, payer, amount, dueDate, paymentMethod, status, eventId, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?, ?)`,
    [
      newId(),
      data.description,
      data.payer,
      data.amount,
      data.dueDate,
      data.paymentMethod ?? null,
      data.eventId,
      data.notes,
      nowIso(),
    ]
  );
}

export async function toggleReceivableReceived(id: string, currentStatus: ReceivableStatus) {
  if (currentStatus === "RECEBIDO") {
    await exec("UPDATE Receivable SET status = 'PENDENTE', receivedDate = NULL WHERE id = ?", [id]);
  } else {
    await exec("UPDATE Receivable SET status = 'RECEBIDO', receivedDate = ? WHERE id = ?", [nowIso(), id]);
  }
}

export async function deleteReceivable(id: string) {
  await exec("DELETE FROM Receivable WHERE id = ?", [id]);
}

// ---------- Agregações ----------
export async function aggregatePendingAmount(table: "Payable" | "Receivable"): Promise<number> {
  const row = await getRow<{ total: number }>(`SELECT COALESCE(SUM(amount), 0) as total FROM ${table} WHERE status = ?`, [
    "PENDENTE",
  ]);
  return row?.total ?? 0;
}

// Saldo atual: soma dos saldos de todas as contas (Financeiro). Cada lançamento no
// LedgerEntry debita a conta de origem (fromAccountId) — não há lado de crédito
// explícito, então o saldo agregado é sempre <= 0 (representa quanto as contas têm
// a receber de volta do caixa do negócio).
export async function aggregateAccountsBalance(): Promise<number> {
  const row = await getRow<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM LedgerEntry WHERE fromAccountId IS NOT NULL"
  );
  return -(row?.total ?? 0);
}

// Contas (a pagar + a receber) pendentes cujo vencimento já passou.
export async function aggregateOverdue(): Promise<{ count: number; amount: number }> {
  const today = nowIso().slice(0, 10);
  const payables = await getRow<{ c: number; total: number }>(
    "SELECT COUNT(*) as c, COALESCE(SUM(amount), 0) as total FROM Payable WHERE status = 'PENDENTE' AND dueDate IS NOT NULL AND dueDate < ?",
    [today]
  );
  const receivables = await getRow<{ c: number; total: number }>(
    "SELECT COUNT(*) as c, COALESCE(SUM(amount), 0) as total FROM Receivable WHERE status = 'PENDENTE' AND dueDate IS NOT NULL AND dueDate < ?",
    [today]
  );
  return {
    count: (payables?.c ?? 0) + (receivables?.c ?? 0),
    amount: (payables?.total ?? 0) + (receivables?.total ?? 0),
  };
}

// Eventos com data de início hoje ou no futuro, ordenados do mais próximo pro mais distante.
export async function listUpcomingEvents(limit = 5): Promise<EventRow[]> {
  const today = nowIso().slice(0, 10);
  return getRows<EventRow>("SELECT * FROM Event WHERE startDate IS NOT NULL AND startDate >= ? ORDER BY startDate ASC LIMIT ?", [
    today,
    limit,
  ]);
}

// Valor já recebido (Receivables com status RECEBIDO) vinculado a um evento —
// usado na aba Financeiro do evento pra comparar com o valor contratado.
export async function sumReceivedForEvent(eventId: string): Promise<number> {
  const row = await getRow<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM Receivable WHERE eventId = ? AND status = 'RECEBIDO'",
    [eventId]
  );
  return row?.total ?? 0;
}

export async function listPayablesForEvent(eventId: string): Promise<PayableRow[]> {
  return getRows<PayableRow>("SELECT * FROM Payable WHERE eventId = ? ORDER BY dueDate ASC", [eventId]);
}

export async function listReceivablesForEvent(eventId: string): Promise<ReceivableRow[]> {
  return getRows<ReceivableRow>("SELECT * FROM Receivable WHERE eventId = ? ORDER BY dueDate ASC", [eventId]);
}

// ---------- Fluxo de caixa ----------
// Entradas = Receivables recebidos (por receivedDate). Saídas = Payables pagos (por paidDate).
// Agrupado por mês (YYYY-MM), últimos `months` meses com movimento.
export async function monthlyCashFlow(): Promise<{ month: string; entradas: number; saidas: number }[]> {
  const entradas = await getRows<{ month: string; total: number }>(
    `SELECT substr(receivedDate, 1, 7) as month, COALESCE(SUM(amount), 0) as total
     FROM Receivable WHERE status = 'RECEBIDO' AND receivedDate IS NOT NULL
     GROUP BY month`
  );
  const saidas = await getRows<{ month: string; total: number }>(
    `SELECT substr(paidDate, 1, 7) as month, COALESCE(SUM(amount), 0) as total
     FROM Payable WHERE status = 'PAGO' AND paidDate IS NOT NULL
     GROUP BY month`
  );
  const months = new Set<string>([...entradas.map((e) => e.month), ...saidas.map((s) => s.month)]);
  const byMonth = Array.from(months)
    .sort()
    .map((month) => ({
      month,
      entradas: entradas.find((e) => e.month === month)?.total ?? 0,
      saidas: saidas.find((s) => s.month === month)?.total ?? 0,
    }));
  return byMonth;
}

// ---------- Relatórios ----------
export async function despesasPorCategoria(): Promise<{ category: string; total: number }[]> {
  return getRows<{ category: string; total: number }>(
    `SELECT category, COALESCE(SUM(amount), 0) as total FROM EventCost GROUP BY category ORDER BY total DESC`
  );
}

export async function receitasPorCliente(): Promise<{ clientName: string; total: number }[]> {
  return getRows<{ clientName: string; total: number }>(
    `SELECT COALESCE(e.clientName, 'Sem cliente informado') as clientName, COALESCE(SUM(s.quantity * s.unitPrice), 0) as total
     FROM SaleItem s JOIN Event e ON e.id = s.eventId
     GROUP BY clientName ORDER BY total DESC`
  );
}

export async function contasEmAberto(): Promise<{
  payables: (PayableRow & { eventName: string | null })[];
  receivables: (ReceivableRow & { eventName: string | null })[];
}> {
  const payables = await getRows<PayableRow & { eventName: string | null }>(
    `SELECT p.*, e.name as eventName FROM Payable p LEFT JOIN Event e ON e.id = p.eventId
     WHERE p.status = 'PENDENTE' ORDER BY p.dueDate ASC`
  );
  const receivables = await getRows<ReceivableRow & { eventName: string | null }>(
    `SELECT r.*, e.name as eventName FROM Receivable r LEFT JOIN Event e ON e.id = r.eventId
     WHERE r.status = 'PENDENTE' ORDER BY r.dueDate ASC`
  );
  return { payables, receivables };
}
