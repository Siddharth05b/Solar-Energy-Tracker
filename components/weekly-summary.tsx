import { format, parseISO } from "date-fns"

interface SolarEntry {
  date: string
  production: number
}

interface WeeklySummaryProps {
  entries: SolarEntry[]
}

export function WeeklySummary({ entries }: WeeklySummaryProps) {
  // Calculate weekly total
  const weeklyTotal = entries.reduce((sum, entry) => sum + entry.production, 0)

  // Calculate daily average
  const daysWithProduction = entries.filter((entry) => entry.production > 0).length
  const dailyAverage = daysWithProduction > 0 ? weeklyTotal / daysWithProduction : 0

  // Find the day with maximum production
  const maxProduction = Math.max(...entries.map((entry) => entry.production))
  const maxProductionDay = entries.find((entry) => entry.production === maxProduction)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-700 font-medium">TOTAL</p>
          <p className="text-2xl font-bold text-green-600">{weeklyTotal.toFixed(1)}</p>
          <p className="text-xs text-green-600">kWh</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-700 font-medium">AVERAGE</p>
          <p className="text-2xl font-bold text-blue-600">{dailyAverage.toFixed(1)}</p>
          <p className="text-xs text-blue-600">kWh/day</p>
        </div>

        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-xs text-amber-700 font-medium">BEST DAY</p>
          <p className="text-2xl font-bold text-amber-600">{maxProduction > 0 ? maxProduction.toFixed(1) : "-"}</p>
          <p className="text-xs text-amber-600">
            {maxProduction > 0 && maxProductionDay ? format(parseISO(maxProductionDay.date), "EEE") : "kWh"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-7 gap-1">
          {entries.map((entry) => {
            // Determine color intensity based on production
            const maxValue = Math.max(...entries.map((e) => e.production))
            const intensity = maxValue > 0 ? entry.production / maxValue : 0
            const bgColor = entry.production > 0 ? `rgba(34, 197, 94, ${0.1 + intensity * 0.3})` : "transparent"

            return (
              <div key={entry.date} className="rounded p-2 text-center" style={{ backgroundColor: bgColor }}>
                <p className="text-xs font-medium">{format(parseISO(entry.date), "EEE")}</p>
                <p className={`text-sm font-bold ${entry.production > 0 ? "text-green-600" : "text-gray-400"}`}>
                  {entry.production > 0 ? entry.production.toFixed(1) : "-"}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

