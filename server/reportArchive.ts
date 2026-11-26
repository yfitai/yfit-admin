import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FullAnalyticsData, ReportSummary } from "./reportingModel";

export type ArchiveState = "saved" | "not_configured" | "failed";
export interface ArchiveResult { status: ArchiveState; warning: string | null; }
export interface ReportRecord {
  reportId: string;
  generatedAt: string;
  reportVersion: string;
  servingRevision: string | null;
  inputHash: string;
  pdfHash: string;
  data: FullAnalyticsData;
  summary: ReportSummary;
  analysis: string;
  delivery: { state: "not_sent" | "accepted" | "rejected" | "unknown"; messageId: string | null; updatedAt: string | null };
}
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_ARCHIVE = "Private report archiving is not configured. Configure REPORT_ARCHIVE_DIR on durable private storage before relying on report history; temporary server files are not durable history.";
export function sha256(value: Buffer | string): string { return createHash("sha256").update(value).digest("hex"); }
function directory(): string | null {
  const configured = process.env.REPORT_ARCHIVE_DIR;
  if (!configured) return null;
  if (!path.isAbsolute(configured)) throw new Error("The report archive must be an absolute private directory.");
  const resolved = path.resolve(configured);
  const publicRoots = [path.resolve(process.cwd(), "client/public"), path.resolve(process.cwd(), "dist/public")];
  if (publicRoots.some(root => resolved === root || resolved.startsWith(root + path.sep))) throw new Error("The report archive cannot be placed in a public directory.");
  const repositoryRoot = path.resolve(process.cwd());
  if (resolved === repositoryRoot || resolved.startsWith(repositoryRoot + path.sep)) throw new Error("Private reports must be stored outside the source repository.");
  return resolved;
}
function validId(id: string) {
  if (!ID.test(id)) throw new Error("Invalid report ID.");
  return id;
}
async function atomicJson(target: string, value: unknown): Promise<void> {
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  await rename(temporary, target);
}
export function archiveConfiguration(): { status: "configured" | "not_configured" | "invalid"; warning: string } {
  try {
    return directory() ? { status: "configured", warning: "Archive path is configured; durable volume attachment must be verified separately." } : { status: "not_configured", warning: NO_ARCHIVE };
  } catch {
    return { status: "invalid", warning: "The private archive configuration is invalid." };
  }
}
export async function archiveReport(record: ReportRecord, pdf: Buffer): Promise<ArchiveResult> {
  try {
    const root = directory();
    if (!root) return { status: "not_configured", warning: NO_ARCHIVE };
    validId(record.reportId);
    await mkdir(root, { recursive: true, mode: 0o700 });
    const target = path.join(root, record.reportId);
    await mkdir(target, { mode: 0o700 }); // Never replace a previous report.
    await writeFile(path.join(target, "report.pdf"), pdf, { mode: 0o600, flag: "wx" });
    await atomicJson(path.join(target, "record.json"), record);
    return { status: "saved", warning: "Saved to the configured private archive. Durability depends on its persistent volume." };
  } catch {
    return { status: "failed", warning: "The original report could not be archived. Do not rely on retained history for this report." };
  }
}
export async function updateReportDelivery(reportId: string, delivery: ReportRecord["delivery"]): Promise<ArchiveResult> {
  try {
    const root = directory();
    if (!root) return { status: "not_configured", warning: NO_ARCHIVE };
    const file = path.join(root, validId(reportId), "record.json");
    const record = JSON.parse(await readFile(file, "utf8")) as ReportRecord;
    await atomicJson(file, { ...record, delivery });
    return { status: "saved", warning: null };
  } catch {
    return { status: "failed", warning: "The report's send status could not be saved. Send acceptance is not proof of delivery." };
  }
}
export async function listReportHistory(): Promise<{ status: ArchiveState; warning: string | null; reports: Array<Omit<ReportRecord, "data" | "analysis">> }> {
  try {
    const root = directory();
    if (!root) return { status: "not_configured", warning: NO_ARCHIVE, reports: [] };
    const ids = await readdir(root).catch(error => { if (error.code === "ENOENT") return []; throw error; });
    const records: ReportRecord[] = [];
    for (const id of ids.filter(id => ID.test(id))) {
      try { records.push(JSON.parse(await readFile(path.join(root, id, "record.json"), "utf8"))); } catch { /* Incomplete archive entries are not represented as valid reports. */ }
    }
    const reports = records.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)).slice(0, 100).map(({ data, analysis, ...metadata }) => metadata);
    return { status: "saved", warning: "Only successfully archived reports are listed. The configured storage must be persistent to survive redeployment.", reports };
  } catch { return { status: "failed", warning: "Report history is unavailable.", reports: [] }; }
}
export async function readArchivedReport(reportId: string): Promise<{ record: ReportRecord; pdfBase64: string }> {
  const root = directory();
  if (!root) throw new Error("Private report archiving is not configured.");
  const target = path.join(root, validId(reportId));
  const record = JSON.parse(await readFile(path.join(target, "record.json"), "utf8")) as ReportRecord;
  const pdf = await readFile(path.join(target, "report.pdf"));
  if (sha256(pdf) !== record.pdfHash || sha256(JSON.stringify(record.data)) !== record.inputHash) throw new Error("The archived report integrity check failed.");
  return { record, pdfBase64: pdf.toString("base64") };
}
