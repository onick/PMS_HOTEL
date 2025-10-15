import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Wifi, WifiOff } from "lucide-react";

const channels = [
  {
    id: "booking",
    name: "Booking.com",
    logo: "🏨",
    status: "connected",
    color: "bg-blue-500",
  },
  {
    id: "airbnb",
    name: "Airbnb",
    logo: "🏠",
    status: "connected",
    color: "bg-pink-500",
  },
  {
    id: "expedia",
    name: "Expedia",
    logo: "✈️",
    status: "disconnected",
    color: "bg-yellow-500",
  },
  {
    id: "hostelworld",
    name: "Hostelworld",
    logo: "🎒",
    status: "disconnected",
    color: "bg-orange-500",
  },
  {
    id: "hotels",
    name: "Hotels.com",
    logo: "🌟",
    status: "disconnected",
    color: "bg-red-500",
  },
  {
    id: "tripadvisor",
    name: "TripAdvisor",
    logo: "🦉",
    status: "disconnected",
    color: "bg-green-500",
  },
];

export default function ChannelsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-channel-manager">
          <Globe className="h-5 w-5" />
          Canales de Distribución
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => {
            const isConnected = channel.status === "connected";
            
            return (
              <div
                key={channel.id}
                className={`p-4 border rounded-lg hover:shadow-md transition-all ${
                  isConnected ? "bg-muted/30" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl">{channel.logo}</div>
                    <div>
                      <h3 className="font-semibold">{channel.name}</h3>
                      <Badge
                        variant={isConnected ? "default" : "outline"}
                        className={`text-xs ${isConnected ? "bg-success" : ""}`}
                      >
                        {isConnected ? (
                          <><Wifi className="h-3 w-3 mr-1" /> Conectado</>
                        ) : (
                          <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant={isConnected ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  disabled={isConnected}
                >
                  {isConnected ? "Configurar" : "Conectar"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
