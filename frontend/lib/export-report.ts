import type { CellObject, Row, SheetData } from "write-excel-file/browser"

const CURRENCY_FORMAT = "$#,##0"

const HEADER_FILL = "#2563eb"
const HEADER_TEXT = "#ffffff"
const TOTAL_FILL = "#f3f4f6"
const MUTED_TEXT = "#6b7280"

export interface ReportExportMeta {
  hotelName: string
  periodLabel: string
  generatedAt: string
}

export interface MonthlyRow {
  month: string
  ingresos: number
  gastos: number
}

function moneyCell(amount: number, overrides: CellObject = {}): CellObject {
  return { value: amount, type: Number, format: CURRENCY_FORMAT, align: "right", ...overrides }
}

function sectionCell(title: string, overrides: CellObject = {}): CellObject {
  return { value: title, columnSpan: 4, align: "center", ...overrides }
}

export function buildReportSheetRows(meta: ReportExportMeta, monthly: MonthlyRow[]): SheetData {
  const totals = monthly.reduce(
    (acc, m) => ({ ingresos: acc.ingresos + m.ingresos, gastos: acc.gastos + m.gastos }),
    { ingresos: 0, gastos: 0 },
  )

  const rows: Row[] = [
    [sectionCell(meta.hotelName, { fontWeight: "bold", fontSize: 16 })],
    [sectionCell("Informe financiero", { fontWeight: "bold", fontSize: 12, textColor: MUTED_TEXT })],
    [sectionCell(`Periodo: ${meta.periodLabel}`, { fontSize: 11, textColor: MUTED_TEXT })],
    [sectionCell(`Generado: ${meta.generatedAt}`, { fontSize: 11, textColor: MUTED_TEXT })],
    [],
    [
      { value: "Mes", align: "left", fontWeight: "bold", backgroundColor: HEADER_FILL, textColor: HEADER_TEXT },
      { value: "Ingresos", align: "right", fontWeight: "bold", backgroundColor: HEADER_FILL, textColor: HEADER_TEXT },
      { value: "Gastos", align: "right", fontWeight: "bold", backgroundColor: HEADER_FILL, textColor: HEADER_TEXT },
      { value: "Beneficio", align: "right", fontWeight: "bold", backgroundColor: HEADER_FILL, textColor: HEADER_TEXT },
    ],
    ...monthly.map((m): Row => [
      { value: m.month, align: "left" },
      moneyCell(m.ingresos),
      moneyCell(m.gastos),
      moneyCell(m.ingresos - m.gastos),
    ]),
    [
      { value: "Total", align: "left", fontWeight: "bold", backgroundColor: TOTAL_FILL },
      moneyCell(totals.ingresos, { fontWeight: "bold", backgroundColor: TOTAL_FILL }),
      moneyCell(totals.gastos, { fontWeight: "bold", backgroundColor: TOTAL_FILL }),
      moneyCell(totals.ingresos - totals.gastos, { fontWeight: "bold", backgroundColor: TOTAL_FILL }),
    ],
  ]

  return rows
}

export function reportFileName(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `informe-financiero-${y}-${m}-${d}.xlsx`
}

export async function exportReportXlsx(meta: ReportExportMeta, monthly: MonthlyRow[]): Promise<void> {
  const writeXlsxFile = (await import("write-excel-file/browser")).default
  await writeXlsxFile(buildReportSheetRows(meta, monthly), {
    sheet: "Informe",
    showGridLines: false,
    columns: [{ width: 12 }, { width: 18 }, { width: 18 }, { width: 18 }],
  }).toFile(reportFileName())
}