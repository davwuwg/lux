"use client"

import { useTheme } from "next-themes"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEffect, useState, useMemo } from "react"
import {
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"

// Sample data - In production, this would come from your API
const generateData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map(month => ({
    month,
    performance: Math.floor(Math.random() * (95 - 75) + 75),
    target: 85,
    lastYear: Math.floor(Math.random() * (90 - 70) + 70),
  }))
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background p-2 shadow-md">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  )
}

export function PerformanceChart() {
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState(generateData())
  const chartHeight = isMobile ? 300 : 400

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoize chart styles
  const chartStyles = useMemo(() => ({
    fontSize: isMobile ? 10 : 12,
    fontFamily: 'inherit',
  }), [isMobile])

  if (!mounted) return null

  return (
    <div className="w-full relative rounded-xl border border-border bg-gradient-to-b from-background to-background/80 p-4">
      <defs>
        <linearGradient id="lastYearGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="hsl(var(--chart-last-year))" stopOpacity={0.2} />
          <stop offset="95%" stopColor="hsl(var(--chart-last-year))" stopOpacity={0} />
        </linearGradient>
      </defs>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart 
          data={data} 
          margin={{ 
            top: 20, 
            right: isMobile ? 10 : 30, 
            left: isMobile ? -20 : 0, 
            bottom: 20 
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="hsl(var(--border))" 
            opacity={0.2}
          />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--foreground))" 
            style={chartStyles}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.3 }}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis 
            stroke="hsl(var(--foreground))" 
            style={chartStyles}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.3 }}
            domain={[40, 100]}
            ticks={[40, 50, 60, 70, 80, 90, 100]}
            padding={{ top: 20, bottom: 20 }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          />
          <Legend 
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-sm">{value}</span>}
            wrapperStyle={{ 
              paddingBottom: '10px',
              fontSize: chartStyles.fontSize
            }}
          />
          <Area
            type="monotone"
            dataKey="lastYear"
            name="Last Year"
            stroke="hsl(var(--chart-last-year))"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#lastYearGradient)"
            dot={false}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="performance"
            name="Performance"
            stroke="hsl(var(--chart-performance))"
            strokeWidth={3}
            dot={{ 
              r: 3, 
              strokeWidth: 2, 
              fill: theme === 'dark' ? '#000' : '#fff',
              stroke: "hsl(var(--chart-performance))"
            }}
            activeDot={{ 
              r: 6, 
              stroke: "hsl(var(--chart-performance))", 
              strokeWidth: 2, 
              fill: theme === 'dark' ? '#000' : '#fff' 
            }}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="hsl(var(--chart-target))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ 
              r: 4, 
              stroke: "hsl(var(--chart-target))",
              strokeWidth: 2,
              fill: theme === 'dark' ? '#000' : '#fff'
            }}
            isAnimationActive={true}
            animationDuration={1500}
            animationBegin={300}
            animationEasing="ease-in-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

