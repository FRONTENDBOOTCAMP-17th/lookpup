import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatEarningsCurrency as formatCurrency } from "@/utils/earnings";
import type { MonthlyEarning } from "@/types/earnings";

const chartConfig = {
  total: {
    label: "수익",
    color: "var(--color-orange-500)",
  },
} satisfies ChartConfig;

interface EarningsChartProps {
  isLoading: boolean;
  monthly: MonthlyEarning[];
}

export default function EarningsChart({ isLoading, monthly }: EarningsChartProps) {
  return (
    <div className="bg-white border border-[#FFE9D6] rounded-2xl p-6 mb-8 shadow-[0_2px_12px_rgba(232,116,42,0.06)]">
      <h2 className="text-xl font-bold text-[#281A0E] mb-6">월별 수익 현황</h2>
      {isLoading ? (
        <div className="h-64 bg-[#FFF8F3] rounded-xl flex items-center justify-center">
          <p className="text-[#6B7280] text-sm">불러오는 중...</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={monthly} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} stroke="#FFE9D6" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <ChartTooltip
              cursor={{ fill: "#FFF8F3" }}
              content={
                <ChartTooltipContent
                  className="bg-white border-0 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[#281A0E] ring-0"
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <Bar dataKey="total" fill="var(--color-orange-500)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
