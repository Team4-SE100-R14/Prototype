import type { AuthUser } from "../App"
import { appendAudit } from "./inpatient"

export type CsvCell = string | number

function escapeCell(cell: CsvCell) {
  const text = String(cell)
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Downloads rows as a UTF-8 (BOM) CSV so Excel opens Vietnamese text correctly. */
export function exportReportCsv(
  code: string,
  title: string,
  rows: CsvCell[][],
  actor: AuthUser,
): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const fileName = `${code}_${stamp}.csv`
  const body = [[title], [`Mã báo cáo: ${code}`], [], ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n")
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  appendAudit(actor, "Xuất báo cáo", `${code} · ${fileName} · ${rows.length} dòng`)
  return fileName
}
