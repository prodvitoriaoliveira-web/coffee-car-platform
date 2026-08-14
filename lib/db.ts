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
    clientName TEXT,
    guestCount INTEGER,
    responsible TEXT,
    contractedValue REAL,
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
    category TEXT,
    packageLabel TEXT,
    packageQty REAL NOT NULL DEFAULT 1,
    packageUnit TEXT,
    packagePrice REAL,
    supplier TEXT,
    currentStock REAL NOT NULL DEFAULT 0,
    minStock REAL,
    replenishValue REAL,
    location TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS StockMovement (
    id TEXT PRIMARY KEY,
    insumoId TEXT NOT NULL REFERENCES Insumo(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    quantity REAL NOT NULL,
    eventId TEXT REFERENCES Event(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    notes TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS EventChecklistItem (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL REFERENCES Event(id) ON DELETE CASCADE,
    groupName TEXT NOT NULL,
    description TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
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
    category TEXT,
    costCenter TEXT,
    amount REAL NOT NULL,
    dueDate TEXT,
    paymentMethod TEXT,
    paidDate TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    eventId TEXT REFERENCES Event(id) ON DELETE SET NULL,
    attachmentUrl TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Receivable (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    payer TEXT,
    amount REAL NOT NULL,
    dueDate TEXT,
    paymentMethod TEXT,
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

// Colunas novas em tabelas que já existiam em produção antes desta versão.
// CREATE TABLE IF NOT EXISTS não adiciona colunas a uma tabela existente, então
// para bancos já semeados precisamos de ALTER TABLE — cada um é tentado e o erro
// de "coluna já existe" é ignorado, o que torna a migração idempotente (segura
// de rodar de novo a cada deploy, tanto em bancos novos quanto antigos).
const ALTER_STATEMENTS = [
  `ALTER TABLE Insumo ADD COLUMN category TEXT`,
  `ALTER TABLE Insumo ADD COLUMN supplier TEXT`,
  `ALTER TABLE Insumo ADD COLUMN currentStock REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE Insumo ADD COLUMN minStock REAL`,
  `ALTER TABLE Insumo ADD COLUMN replenishValue REAL`,
  `ALTER TABLE Insumo ADD COLUMN location TEXT`,
  `ALTER TABLE Event ADD COLUMN clientName TEXT`,
  `ALTER TABLE Event ADD COLUMN guestCount INTEGER`,
  `ALTER TABLE Event ADD COLUMN responsible TEXT`,
  `ALTER TABLE Event ADD COLUMN contractedValue REAL`,
  `ALTER TABLE Payable ADD COLUMN category TEXT`,
  `ALTER TABLE Payable ADD COLUMN costCenter TEXT`,
  `ALTER TABLE Payable ADD COLUMN paymentMethod TEXT`,
  `ALTER TABLE Payable ADD COLUMN attachmentUrl TEXT`,
  `ALTER TABLE Receivable ADD COLUMN paymentMethod TEXT`,
];

let migrated: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!migrated) {
    migrated = (async () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        await db.execute(stmt);
      }
      for (const stmt of ALTER_STATEMENTS) {
        try {
          await db.execute(stmt);
        } catch {
          // coluna já existe — ok, migração já rodou antes
        }
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
