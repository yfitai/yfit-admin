/**
 * Database connection for yfit-admin.
 * Connects to the same shared MySQL/TiDB database as yfit-marketing-official.
 * Tables: stripe_income, expenses, csv_import_batches, monthly_reports
 */

import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./env.js";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
    }
  }
  return _db;
}
