"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { format, parseISO } from "date-fns"

interface SolarEntry {
  date: string
  production: number
  id?: string
}

interface SolarChartProps {
  entries: SolarEntry[]
}

export function SolarChart({ entries }: SolarChartProps) {
  // Format the data for the chart
  const chartData = entries.map((entry) => ({
    date: entry.date,
    production: entry.production,
    formattedDate: format(parseISO(entry.date), "EEE"),
  }))

  // Calculate average for reference line
  const productionValues = entries.map((entry) => entry.production)
  const nonZeroValues = productionValues.filter((value) => value > 0)
  const average =
    nonZeroValues.length > 0 ? nonZeroValues.reduce((sum, value) => sum + value, 0) / nonZeroValues.length : 0

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 shadow-md rounded-md border text-xs">
          <p className="font-medium">{format(parseISO(payload[0].payload.date), "EEEE, MMMM d")}</p>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-primary mr-1"></div>
            <p className="text-primary font-bold">{`${payload[0].value} kWh`}</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 11 }}
          axisLine={false}
          className="text-muted-foreground"
          tickMargin={8}
        />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} className="text-muted-foreground" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
        <Bar
          dataKey="production"
          className="fill-primary"
          radius={[4, 4, 0, 0]}
          name="Energy Production"
          animationDuration={1500}
        />
        {average > 0 && (
          <ReferenceLine
            y={average}
            stroke="var(--primary)"
            strokeDasharray="3 3"
            strokeWidth={2}
            className="opacity-50"
          >
            <label position="right" className="fill-muted-foreground text-xs">
              Avg
            </label>
          </ReferenceLine>
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

