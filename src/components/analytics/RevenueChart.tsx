import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: reservations } = await supabase
        .from("reservations")
        .select("check_in, total_amount_cents, status")
        .eq("hotel_id", userRoles.hotel_id)
        .gte("check_in", startDate.toISOString().split("T")[0])
        .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);

      if (!reservations) return [];

      // Agrupar por día
      const dailyRevenue = reservations.reduce((acc: any, res: any) => {
        const date = new Date(res.check_in).toLocaleDateString("es", { month: "short", day: "numeric" });
        if (!acc[date]) {
          acc[date] = { fecha: date, ingresos: 0 };
        }
        acc[date].ingresos += res.total_amount_cents / 100;
        return acc;
      }, {});

      return Object.values(dailyRevenue).sort((a: any, b: any) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
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
