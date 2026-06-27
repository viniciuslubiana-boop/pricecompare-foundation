import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PriceDistribution, RankingEntry } from "@/features/analytics";
import { EmptyState } from "@/components/EmptyState";
import { BarChart3 } from "lucide-react";

const COLORS = ["#F97316", "#0F172A", "#0EA5E9", "#22C55E", "#EAB308", "#A855F7", "#EF4444"];

function Empty({ label }: { label: string }) {
  return (
    <EmptyState
      icon={BarChart3}
      title={label}
      description="Importe veículos para visualizar o gráfico."
    />
  );
}

export function RankingBarChart({ entries, label }: { entries: RankingEntry[]; label: string }) {
  if (!entries.length) return <Empty label={label} />;
  const data = entries.map((e) => ({ name: e.key, total: e.count }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="total" fill="#F97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriceDistributionChart({ data }: { data: PriceDistribution }) {
  const total = data.buckets.reduce((s, b) => s + b.mine + b.competitor, 0);
  if (!total) return <Empty label="Sem dados de preço" />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.buckets} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar name="Meu estoque" dataKey="mine" fill="#F97316" radius={[4, 4, 0, 0]} />
        <Bar name="Concorrentes" dataKey="competitor" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ComparisonStatusChart({
  meCheaper,
  competitorCheaper,
  ties,
  unmatched,
}: {
  meCheaper: number;
  competitorCheaper: number;
  ties: number;
  unmatched: number;
}) {
  const data = [
    { name: "Você mais barato", value: meCheaper, color: "#22C55E" },
    { name: "Concorrente mais barato", value: competitorCheaper, color: "#EF4444" },
    { name: "Empates", value: ties, color: "#64748B" },
    { name: "Sem match", value: unmatched, color: "#CBD5E1" },
  ].filter((d) => d.value > 0);
  if (!data.length) return <Empty label="Sem comparações ainda" />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
