/**
 * Drizzle schema for yfit-admin.
 * These tables are shared with yfit-marketing-official — same database, same tables.
 * Do NOT run migrations from here — the tables already exist.
 * This file is only used for type-safe queries.
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ─── Accounting: Stripe Income ────────────────────────────────────────────────

export const stripeIncome = mysqlTable("stripe_income", {
  id: int("id").autoincrement().primaryKey(),
  stripeChargeId: varchar("stripeChargeId", { length: 64 }).notNull().unique(),
  amountUsdCents: int("amountUsdCents").notNull(),
  amountCadCents: int("amountCadCents").notNull(),
  usdToCadRate: varchar("usdToCadRate", { length: 16 }).notNull(),
  gstCollectedCadCents: int("gstCollectedCadCents").default(0).notNull(),
  stripeFeesCadCents: int("stripeFeesCadCents").default(0).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),
  customerEmail: varchar("customerEmail", { length: 320 }),
  description: text("description"),
  status: mysqlEnum("status", ["succeeded", "refunded", "disputed"]).default("succeeded").notNull(),
  refunded: boolean("refunded").default(false).notNull(),
  refundAmountCadCents: int("refundAmountCadCents").default(0).notNull(),
  chargedAt: timestamp("chargedAt").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

export type StripeIncome = typeof stripeIncome.$inferSelect;
export type InsertStripeIncome = typeof stripeIncome.$inferInsert;

// ─── Accounting: Expenses ─────────────────────────────────────────────────────

export const expenseCategories = [
  "gas_fuel",
  "office_supplies",
  "software_subscription",
  "stripe_fees",
  "advertising",
  "professional_services",
  "equipment",
  "other",
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  transactionDate: timestamp("transactionDate").notNull(),
  merchantName: varchar("merchantName", { length: 255 }).notNull(),
  amountCadCents: int("amountCadCents").notNull(),
  gstItcCadCents: int("gstItcCadCents").notNull().default(0),
  preTaxAmountCadCents: int("preTaxAmountCadCents").notNull(),
  category: mysqlEnum("category", expenseCategories).default("other").notNull(),
  gstEligible: boolean("gstEligible").default(true).notNull(),
  notes: text("notes"),
  importBatchId: varchar("importBatchId", { length: 64 }),
  reviewed: boolean("reviewed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── Accounting: CSV Import Batches ──────────────────────────────────────────

export const csvImportBatches = mysqlTable("csv_import_batches", {
  id: int("id").autoincrement().primaryKey(),
  batchId: varchar("batchId", { length: 64 }).notNull().unique(),
  statementMonth: varchar("statementMonth", { length: 7 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  totalTransactions: int("totalTransactions").notNull(),
  totalAmountCadCents: int("totalAmountCadCents").notNull(),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
});

export type CsvImportBatch = typeof csvImportBatches.$inferSelect;

// ─── Accounting: Monthly Report Cache ────────────────────────────────────────

export const monthlyReports = mysqlTable("monthly_reports", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 7 }).notNull().unique(),
  grossRevenueCadCents: int("grossRevenueCadCents").notNull().default(0),
  totalRefundsCadCents: int("totalRefundsCadCents").notNull().default(0),
  stripeFeesTotalCadCents: int("stripeFeesTotalCadCents").notNull().default(0),
  netRevenueCadCents: int("netRevenueCadCents").notNull().default(0),
  gstCollectedCadCents: int("gstCollectedCadCents").notNull().default(0),
  totalExpensesCadCents: int("totalExpensesCadCents").notNull().default(0),
  totalGstItcCadCents: int("totalGstItcCadCents").notNull().default(0),
  netGstRemittableCadCents: int("netGstRemittableCadCents").notNull().default(0),
  netProfitCadCents: int("netProfitCadCents").notNull().default(0),
  pdfUrl: text("pdfUrl"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyReport = typeof monthlyReports.$inferSelect;
