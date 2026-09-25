import { formatCurrency } from "@/lib/utils"

export interface ReportsPrintDocProps {
  hotelName: string
  periodLabel: string
  generatedAt: string
  userName?: string
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  avgOccupancy: number
  occupiedRooms: number
  totalRooms: number
  revPerRoom: number
  monthly: { month: string; ingresos: number; gastos: number }[]
}

function KpiItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  )
}

export function ReportsPrintDoc({
  hotelName,
  periodLabel,
  generatedAt,
  userName,
  totalRevenue,
  totalExpenses,
  netProfit,
  avgOccupancy,
  occupiedRooms,
  totalRooms,
  revPerRoom,
  monthly,
}: ReportsPrintDocProps) {
  return (
    <div className="report-print bg-white p-8 text-gray-900">
      <header className="flex items-start justify-between border-b-2 border-gray-300 pb-4">
        <div>
          <p className="text-xl font-bold">{hotelName}</p>
          <p className="text-sm text-gray-600">Informe financiero</p>
        </div>
        <div className="text-right text-xs text-gray-600">
          <p>Periodo: {periodLabel}</p>
          <p>Generado: {generatedAt}</p>
          {userName ? <p>Generado por: {userName}</p> : null}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiItem label="Ingresos" value={formatCurrency(totalRevenue)} />
        <KpiItem label="Gastos" value={formatCurrency(totalExpenses)} />
        <KpiItem label="Beneficio" value={formatCurrency(netProfit)} />
        <KpiItem label="Ocupacion media" value={`${Math.round(avgOccupancy)}%`} />
        <KpiItem label="Habitaciones ocupadas" value={`${occupiedRooms} / ${totalRooms}`} />
        <KpiItem label="Ingresos por habitacion" value={formatCurrency(revPerRoom)} />
      </div>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Ingresos y gastos por mes
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 pr-4 font-semibold">Mes</th>
              <th className="py-2 pr-4 text-right font-semibold">Ingresos</th>
              <th className="py-2 pr-4 text-right font-semibold">Gastos</th>
              <th className="py-2 text-right font-semibold">Beneficio</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m) => (
              <tr key={m.month} className="border-b border-gray-200">
                <td className="py-2 pr-4">{m.month}</td>
                <td className="py-2 pr-4 text-right">{formatCurrency(m.ingresos)}</td>
                <td className="py-2 pr-4 text-right">{formatCurrency(m.gastos)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(m.ingresos - m.gastos)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-bold">
              <td className="py-2 pr-4">Total</td>
              <td className="py-2 pr-4 text-right">{formatCurrency(totalRevenue)}</td>
              <td className="py-2 pr-4 text-right">{formatCurrency(totalExpenses)}</td>
              <td className="py-2 text-right">{formatCurrency(netProfit)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer className="mt-8 border-t border-dashed border-gray-300 pt-3 text-center text-[11px] text-gray-500">
        HotelManager PMS
      </footer>
    </div>
  )
}