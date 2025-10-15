import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Network } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--channel-manager))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export default function ChannelDistribution() {
  const { data: channelData } = useQuery({
    queryKey: ["channel-distribution"],
    queryFn: async () => {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("hotel_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id!)
        .single();

      if (!userRoles) return [];

      const { data: reservations } = await supabase
        .from("reservations")
        .select("metadata, total_amount_cents")
        .eq("hotel_id", userRoles.hotel_id)
        .in("status", ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);

      if (!reservations) return [];

      // Agrupar por canal
      const channelStats = reservations.reduce((acc: any, res: any) => {
        const metadata = res.metadata && typeof res.metadata === 'object' ? res.metadata : {};
        const channel = (metadata as any).channel || "Directo";
        const channelName = channel === "direct" ? "Directo" : 
          channel.charAt(0).toUpperCase() + channel.slice(1);

        if (!acc[channelName]) {
          acc[channelName] = { name: channelName, value: 0, ingresos: 0 };
        }
        acc[channelName].value += 1;
        acc[channelName].ingresos += res.total_amount_cents / 100;
        return acc;
      }, {});

      return Object.values(channelStats);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-analytics">
          <Network className="h-5 w-5" />
          Distribución por Canal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={channelData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {channelData?.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any, name: any, props: any) => [
              `${value} reservas ($${props.payload.ingresos.toFixed(2)})`,
              name
            ]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
