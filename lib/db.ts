import { createClient, type Client } from "@libsql/client";

// Banco de dados: Turso (SQLite hospedado, compatível com libSQL) em produção,
// ou um arquivo local (via o mesmo client, em modo embutido) em desenvolvimento.
// Trocamos de node:sqlite (arquivo local puro) para isso porque hospedagens grátis
// (Render, Railway free, etc.) têm filesystem efêmero — os dados seriam perdidos
// a cada "dormida"/redeploy do servidor. O Turso resolve isso com um banco de verdade,
// acessível pela rede, com camada grátis generosa e sem cartão de crédito.

const globalForDb = globalThis as unknown as { __coffeeDb?: Client };

function createConnection(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient(authToken ? { url, authToken } : { url });
}

export const db = globalForDb.__coffeeDb ?? createConnection();
if (process.env.NODE_ENV !== "production") globalForDb.__coffeeDb = db;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SOCIO',
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Account (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    notes TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS Event (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    startDate TEXT,
    endDate TEXT,
    status TEXT NOT NULL DEFAULT 'PLANEJADO',
    venueCommissionPct REAL,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS SaleItem (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL REFERENCES Event(id) ON DELETE CASCADE,
    productName TEXT NOT NULL,
    quantity REAL NOT NULL,
    unitPrice REAL NOT NULL,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Insumo (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    packageLabel TEXT,
    packageQty REAL NOT NULL DEFAULT 1,
    packageUnit TEXT,
    packagePrice REAL,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS EventCost (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL REFERENCES Event(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS StaffMember (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    dailyRate REAL,
    phone TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS StaffShift (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL REFERENCES Event(id) ON DELETE CASCADE,
    staffMemberId TEXT NOT NULL REFERENCES StaffMember(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    dailyRate REAL NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS LedgerEntry (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    eventId TEXT REFERENCES Event(id) ON DELETE SET NULL,
    fromAccountId TEXT REFERENCES Account(id) ON DELETE SET NULL,
    toAccountLabel TEXT,
    whoReturns TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Payable (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    supplier TEXT,
    amount REAL NOT NULL,
    dueDate TEXT,
    paidDate TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    eventId TEXT REFERENCES Event(id) ON DELETE SET NULL,
    notes TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Receivable (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    payer TEXT,
    amount REAL NOT NULL,
    dueDate TEXT,
    receivedDate TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    eventId TEXT REFERENCES Event(id) ON DELETE SET NULL,
    notes TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS PartnerShare (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL REFERENCES Event(id) ON DELETE CASCADE,
    partnerName TEXT NOT NULL,
    percentage REAL NOT NULL
  )`,
];

let migrated: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!migrated) {
    migrated = (async () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        await db.execute(stmt);
      }
    })();
  }
  return migrated;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
