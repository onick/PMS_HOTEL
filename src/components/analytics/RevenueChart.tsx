import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign } from "lucide-react";

export default function RevenueChart() {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");

  const { data: revenueData } = useQuery({
    queryKey: ["revenue-chart", period],
    queryFn: async () => {
      const days = parseInt(period);
      const to = new Date().toISOString().split("T")[0];
      const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

      const res = await api.getRevenueReport(from, to, "day");
      const data = res.data;

      return (data.data || []).map((item: any) => ({
        fecha: new Date(item.period).toLocaleDateString("es", { month: "short", day: "numeric" }),
        ingresos: item.total_revenue_cents / 100,
      }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-analytics">
            <DollarSign className="h-5 w-5" />
            Ingresos Diarios
          </CardTitle>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="ingresos" fill="hsl(var(--success))" name="Ingresos ($)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
