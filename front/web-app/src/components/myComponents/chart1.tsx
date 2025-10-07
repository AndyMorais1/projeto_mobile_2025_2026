"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { format } from "date-fns"
import { useMemo } from "react"
import { TrendingUp } from "lucide-react"

// Função para gerar meses entre data inicial e atual
function generateMonthsFrom(start = "2025-01") {
  const result: string[] = []
  const current = new Date()
  const date = new Date(start + "-01")

  while (date <= current) {
    result.push(format(new Date(date), "yyyy-MM"))
    date.setMonth(date.getMonth() + 1)
  }

  return result
}

// Agrupa registros por mês
function groupByMonth(items: { createdAt: string }[], start = "2025-01") {
  const months = generateMonthsFrom(start)
  const counts: Record<string, number> = {}

  for (const month of months) {
    counts[month] = 0
  }

  for (const item of items) {
    const key = format(new Date(item.createdAt), "yyyy-MM")
    if (counts[key] !== undefined) {
      counts[key] += 1
    }
  }

  return counts
}

const chartConfig: ChartConfig = {
  usuarios: {
    label: "Usuários",
    color: "hsl(var(--chart-1))",
  },
  casas: {
    label: "Casas",
    color: "hsl(var(--chart-2))",
  },
}

// 🔹 Dados mockados (sem contextos)
const mockUsers = [
  { createdAt: "2025-01-12" },
  { createdAt: "2025-02-03" },
  { createdAt: "2025-02-15" },
  { createdAt: "2025-03-01" },
]

const mockHouses = [
  { createdAt: "2025-01-20" },
  { createdAt: "2025-03-05" },
  { createdAt: "2025-03-22" },
]

export function Chart1() {
  const chartData = useMemo(() => {
    const usersCounts = groupByMonth(mockUsers)
    const housesCounts = groupByMonth(mockHouses)

    return Object.keys(usersCounts).map((monthKey) => ({
      month: format(new Date(monthKey + "-01"), "MMMM"),
      usuarios: usersCounts[monthKey],
      casas: housesCounts[monthKey],
    }))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Usuários e Casas</CardTitle>
        <CardDescription>De Janeiro de 2025 até o mês atual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4 px-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: "#1e3a8a" }} />
            Usuários
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: "#60a5fa" }} />
            Casas
          </div>
        </div>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="usuarios" fill="#1e3a8a" radius={4} />
            <Bar dataKey="casas" fill="#60a5fa" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Atualizado até {format(new Date(), "MMMM")} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Dados simulados (mock) sem uso de contexto
        </div>
      </CardFooter>
    </Card>
  )
}
