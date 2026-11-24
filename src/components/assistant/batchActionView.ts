type ObjectValue = Record<string, unknown>;
const object = (value: unknown): ObjectValue => value !== null && typeof value === "object" && !Array.isArray(value) ? value as ObjectValue : {};

export function batchTargets(args: unknown) {
  const a = object(args);
  const rows = Array.isArray(a.targets) ? a.targets : [];
  return rows.map(value => {
    const row = object(value);
    return { id: String(row.id ?? ""), label: String(row.invoice_number || row.company_name || row.id || "Record"),
      detail: row.recipient ? `${row.recipient}${Array.isArray(row.cc) && row.cc.length ? ` · CC: ${row.cc.join(", ")}` : ""} · ${String(row.language ?? "").toUpperCase()}` : `${String(row.status ?? "")} → ${String(a.status ?? "")}` };
  }).filter(row => row.id);
}

export function batchResults(result: unknown) {
  const rows = object(result).results;
  return (Array.isArray(rows) ? rows : []).map(value => {
    const row = object(value);
    return { id: String(row.id ?? ""), status: String(row.status ?? ""), message: String(row.message ?? "") };
  }).filter(row => row.id);
}