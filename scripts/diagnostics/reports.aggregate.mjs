import mysql from 'mysql2/promise';
import fs from 'node:fs';

// Direct aggregate SELECTs only. Never imports application startup or report code.
// No customer, merchant, file, message, email, identifier or URL fields selected.
const year = 2026;
const start = `${year}-01-01`;
const end = `${year + 1}-01-01`;
const config = JSON.parse(fs.readFileSync(new URL('../../.project-config.json', import.meta.url), 'utf8'));
const declarations = Object.fromEntries(['VITE_OAUTH_PORTAL_URL','VITE_APP_ID','OAUTH_SERVER_URL','DATABASE_URL'].map(name => [name, {
  projectEnvDeclared: Object.hasOwn(config.env_vars ?? {}, name),
  projectSecretDeclared: Object.hasOwn(config.secrets ?? {}, name),
  processDeclared: Object.hasOwn(process.env, name),
}]));
console.log(JSON.stringify({ managedBuildUsesPackageScript: ['pnpm build','pnpm run build','npm run build','yarn build'].includes(config.build_command), declarations, scope: 'existing sandbox runtime; production DB provenance not independently established' }, null, 2));
const queries = [
  ['annual_cache', `SELECT COUNT(*) AS cachedMonths, COUNT(DISTINCT period) AS distinctMonths, MIN(period) AS firstPeriod, MAX(period) AS lastPeriod, COALESCE(SUM(grossRevenueCadCents),0) AS grossRevenueCadCents, COALESCE(SUM(totalExpensesCadCents),0) AS totalExpensesCadCents, COALESCE(SUM(netProfitCadCents),0) AS netProfitCadCents, SUM(CASE WHEN pdfUrl IS NOT NULL AND pdfUrl <> '' THEN 1 ELSE 0 END) AS cacheRowsWithPdfUrl FROM monthly_reports WHERE period >= ? AND period <= ?`, [`${year}-01`,`${year}-12`]],
  ['cache_by_month', `SELECT period, COUNT(*) AS rowsCount, COALESCE(SUM(grossRevenueCadCents),0) AS grossRevenueCadCents, COALESCE(SUM(totalExpensesCadCents),0) AS totalExpensesCadCents, COALESCE(SUM(netProfitCadCents),0) AS netProfitCadCents FROM monthly_reports WHERE period >= ? AND period <= ? GROUP BY period ORDER BY period`, [`${year}-01`,`${year}-12`]],
  ['income_by_month', `SELECT DATE_FORMAT(chargedAt,'%Y-%m') AS period, COUNT(*) AS rowsCount, COALESCE(SUM(amountCadCents),0) AS grossRevenueCadCents, COALESCE(SUM(refundAmountCadCents),0) AS refundsCadCents, COALESCE(SUM(stripeFeesCadCents),0) AS feesCadCents FROM stripe_income WHERE chargedAt >= ? AND chargedAt < ? GROUP BY DATE_FORMAT(chargedAt,'%Y-%m') ORDER BY period`, [start,end]],
  ['expenses_by_month', `SELECT DATE_FORMAT(transactionDate,'%Y-%m') AS period, COUNT(*) AS rowsCount, COALESCE(SUM(amountCadCents),0) AS totalExpensesCadCents, COALESCE(SUM(gstItcCadCents),0) AS totalGstItcCadCents FROM expenses WHERE transactionDate >= ? AND transactionDate < ? GROUP BY DATE_FORMAT(transactionDate,'%Y-%m') ORDER BY period`, [start,end]],
  ['import_coverage', `SELECT statementMonth AS period, COUNT(*) AS batches, COALESCE(SUM(totalTransactions),0) AS totalTransactions, COALESCE(SUM(totalAmountCadCents),0) AS totalAmountCadCents FROM csv_import_batches WHERE statementMonth >= ? AND statementMonth <= ? GROUP BY statementMonth ORDER BY statementMonth`, [`${year}-01`,`${year}-12`]],
];
let connection;
try {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error(),{ code:'RUNTIME_DATABASE_UNAVAILABLE' });
  connection = await mysql.createConnection(process.env.DATABASE_URL);
  for (const [name, sql, parameters] of queries) {
    if (!/^SELECT\s/i.test(sql) || /;|\b(INTO|OUTFILE|FOR UPDATE|LOCK)\b/i.test(sql)) throw Object.assign(new Error(),{code:'UNSAFE_QUERY'});
    try {
      const [rows] = await connection.query({ sql, timeout: 15000 }, parameters);
      console.log(JSON.stringify({ name, result: rows }));
    } catch (error) {
      console.log(JSON.stringify({ name, errorCode: /^[A-Z0-9_]+$/.test(error.code ?? '') ? error.code : 'READ_FAILED', detailsOmitted: true }));
    }
  }
} catch (error) {
  console.log(JSON.stringify({ connectionFailed: true, errorCode: /^[A-Z0-9_]+$/.test(error.code ?? '') ? error.code : 'CONNECT_FAILED', detailsOmitted: true }));
} finally {
  if (connection) await connection.end();
}
