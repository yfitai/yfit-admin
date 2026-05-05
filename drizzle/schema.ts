import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Accounting: Income ───────────────────────────────────────────────────────

/**
 * Stripe charges synced automatically via the Stripe API.
 * All amounts stored in CAD cents to avoid floating-point issues.
 * GST collected is tracked separately for remittance reporting.
 */
export const stripeIncome = mysqlTable("stripe_income", {
  id: int("id").autoincrement().primaryKey(),
  stripeChargeId: varchar("stripeChargeId", { length: 128 }).notNull().unique(),
  /** Amount charged in USD cents (as received from Stripe) */
  amountUsdCents: int("amountUsdCents").notNull(),
  /** Amount in CAD cents (converted using exchange rate at sync time) */
  amountCadCents: int("amountCadCents").notNull(),
  /** Exchange rate used for conversion (USD to CAD) */
  exchangeRate: decimal("exchangeRate", { precision: 8, scale: 6 }).notNull(),
  /** GST collected (5%) in CAD cents — only if Stripe Tax is enabled */
  gstCollectedCadCents: int("gstCollectedCadCents").default(0).notNull(),
  /** Net revenue after Stripe fees in CAD cents */
  stripeFeesCadCents: int("stripeFeesCadCents").default(0).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),
  customerEmail: varchar("customerEmail", { length: 320 }),
  description: text("description"),
  status: mysqlEnum("status", ["succeeded", "refunded", "disputed"]).default("succeeded").notNull(),
  /** Whether this charge was refunded */
  refunded: boolean("refunded").default(false).notNull(),
  refundAmountCadCents: int("refundAmountCadCents").default(0).notNull(),
  /** UTC timestamp of the charge from Stripe */
  chargedAt: timestamp("chargedAt").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

export type StripeIncome = typeof stripeIncome.$inferSelect;
export type InsertStripeIncome = typeof stripeIncome.$inferInsert;

// ─── Accounting: Expenses ─────────────────────────────────────────────────────

/**
 * Expense categories for YFIT AI Manitoba business.
 * Used for auto-categorization of CIBC CSV imports.
 */
export const expenseCategories = [
  "gas_fuel",           // Gas station purchases
  "office_supplies",    // Staples, Amazon office items
  "software_subscription", // Manus, ElevenLabs, Upload-Post, n8n, Railway
  "stripe_fees",        // Stripe processing commissions
  "advertising",        // Meta ads, Google ads
  "professional_services", // Accountant, legal
  "equipment",          // Hardware, peripherals
  "other",              // Uncategorized
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

/**
 * Expenses imported from CIBC Mastercard CSV uploads.
 * GST input tax credits (ITCs) are calculated at 5% on eligible expenses.
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  /** Date of the transaction from the credit card statement */
  transactionDate: timestamp("transactionDate").notNull(),
  /** Merchant name as it appears on the credit card statement */
  merchantName: varchar("merchantName", { length: 255 }).notNull(),
  /** Total amount charged in CAD cents (including GST) */
  amountCadCents: int("amountCadCents").notNull(),
  /** GST input tax credit claimable (5% of pre-tax amount) in CAD cents */
  gstItcCadCents: int("gstItcCadCents").notNull().default(0),
  /** Pre-tax amount (amountCadCents / 1.05) in CAD cents */
  preTaxAmountCadCents: int("preTaxAmountCadCents").notNull(),
  category: mysqlEnum("category", expenseCategories).default("other").notNull(),
  /** Whether this expense is GST-eligible (most business expenses in Canada are) */
  gstEligible: boolean("gstEligible").default(true).notNull(),
  /** Notes or description */
  notes: text("notes"),
  /** Which CSV upload batch this came from */
  importBatchId: varchar("importBatchId", { length: 64 }),
  /** Whether this was manually reviewed/approved */
  reviewed: boolean("reviewed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── Accounting: CSV Import Batches ──────────────────────────────────────────

/**
 * Tracks each CIBC CSV upload for audit trail purposes.
 */
export const csvImportBatches = mysqlTable("csv_import_batches", {
  id: int("id").autoincrement().primaryKey(),
  batchId: varchar("batchId", { length: 64 }).notNull().unique(),
  /** Statement period this CSV covers */
  statementMonth: varchar("statementMonth", { length: 7 }).notNull(), // "2025-03"
  fileName: varchar("fileName", { length: 255 }).notNull(),
  totalTransactions: int("totalTransactions").notNull(),
  totalAmountCadCents: int("totalAmountCadCents").notNull(),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
});

export type CsvImportBatch = typeof csvImportBatches.$inferSelect;

// ─── Accounting: Monthly Report Cache ────────────────────────────────────────

/**
 * Cached monthly report data to avoid recomputing on every request.
 * Regenerated each time new data is synced.
 */
export const monthlyReports = mysqlTable("monthly_reports", {
  id: int("id").autoincrement().primaryKey(),
  /** Period in format "2025-03" */
  period: varchar("period", { length: 7 }).notNull().unique(),
  /** Total gross revenue in CAD cents */
  grossRevenueCadCents: int("grossRevenueCadCents").notNull().default(0),
  /** Total refunds in CAD cents */
  totalRefundsCadCents: int("totalRefundsCadCents").notNull().default(0),
  /** Stripe processing fees in CAD cents */
  stripeFeesTotalCadCents: int("stripeFeesTotalCadCents").notNull().default(0),
  /** Net revenue (gross - refunds - fees) in CAD cents */
  netRevenueCadCents: int("netRevenueCadCents").notNull().default(0),
  /** GST collected from customers in CAD cents */
  gstCollectedCadCents: int("gstCollectedCadCents").notNull().default(0),
  /** Total expenses in CAD cents */
  totalExpensesCadCents: int("totalExpensesCadCents").notNull().default(0),
  /** Total GST input tax credits claimable in CAD cents */
  totalGstItcCadCents: int("totalGstItcCadCents").notNull().default(0),
  /** Net GST remittable (collected - ITCs) in CAD cents */
  netGstRemittableCadCents: int("netGstRemittableCadCents").notNull().default(0),
  /** Net profit/loss in CAD cents */
  netProfitCadCents: int("netProfitCadCents").notNull().default(0),
  /** S3 URL of the generated PDF report */
  pdfUrl: text("pdfUrl"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyReport = typeof monthlyReports.$inferSelect;

// ─── Contact / Support Submissions ───────────────────────────────────────────

/**
 * Stores every contact form submission from the marketing site.
 * An AI-generated auto-reply is sent to the user via Resend,
 * and the owner is notified at support@yfitai.com.
 */
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  /** Sender's name as entered in the form */
  name: varchar("name", { length: 255 }).notNull(),
  /** Sender's email address */
  email: varchar("email", { length: 320 }).notNull(),
  /** Subject line chosen by the sender */
  subject: varchar("subject", { length: 255 }).notNull(),
  /** Full message body */
  message: text("message").notNull(),
  /** AI-generated auto-reply that was sent back to the user */
  autoReply: text("autoReply"),
  /** Whether the auto-reply was successfully delivered */
  autoReplySent: boolean("autoReplySent").default(false).notNull(),
  /** Whether the owner notification was successfully delivered */
  ownerNotified: boolean("ownerNotified").default(false).notNull(),
  /** Resend message ID for the auto-reply (for tracking) */
  resendMessageId: varchar("resendMessageId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;
