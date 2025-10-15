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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

export default function OccupancyChart() {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");

  const { data: occupancyData } = useQuery({
    queryKey: ["occupancy-chart", period],
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

      // Obtener inventario y reservas
      const { data: inventory } = await supabase
        .from("inventory_by_day")
        .select("*")
        .eq("hotel_id", userRoles.hotel_id)
        .gte("day", startDate.toISOString().split("T")[0])
        .order("day");

      if (!inventory) return [];

      // Agrupar por día
      const dailyData = inventory.reduce((acc: any[], item: any) => {
        const existing = acc.find((d) => d.day === item.day);
        if (existing) {
          existing.total += item.total;
          existing.reserved += item.reserved;
          existing.holds += item.holds;
        } else {
          acc.push({
            day: item.day,
            total: item.total,
            reserved: item.reserved,
            holds: item.holds,
          });
        }
        return acc;
      }, []);

      // Calcular ocupación
      return dailyData.map((d) => ({
        fecha: new Date(d.day).toLocaleDateString("es", { month: "short", day: "numeric" }),
        ocupacion: d.total > 0 ? Math.round(((d.reserved + d.holds) / d.total) * 100) : 0,
        disponible: d.total > 0 ? Math.round(((d.total - d.reserved - d.holds) / d.total) * 100) : 100,
      }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-analytics">
            <Calendar className="h-5 w-5" />
            Ocupación
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
          <LineChart data={occupancyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ocupacion" stroke="hsl(var(--analytics))" strokeWidth={2} name="Ocupación %" />
            <Line type="monotone" dataKey="disponible" stroke="hsl(var(--success))" strokeWidth={2} name="Disponible %" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
