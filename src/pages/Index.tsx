import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Waves, Calendar, Shield, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-ocean p-2 rounded-lg">
            <Waves className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">HotelSaaS</span>
        </div>
        <Button onClick={() => navigate("/auth")} variant="outline">
          Iniciar Sesión
        </Button>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            Sistema de Reservas Hoteleras
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gestiona tu hotel con tecnología de punta. Multi-propiedad, transacciones atómicas, 
            y seguridad empresarial desde el día uno.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => navigate("/auth")} 
              size="lg" 
              className="bg-gradient-ocean hover:opacity-90"
            >
              Empezar Gratis
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg bg-card shadow-soft">
              <Calendar className="h-10 w-10 mb-4 text-primary mx-auto" />
              <h3 className="font-semibold mb-2">Reservas en Tiempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Control de inventario con locks optimistas y sistema de holds automático
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-soft">
              <Shield className="h-10 w-10 mb-4 text-primary mx-auto" />
              <h3 className="font-semibold mb-2">Multi-tenant Seguro</h3>
              <p className="text-sm text-muted-foreground">
                RLS por hotel, roles granulares (Owner, Manager, Recepción, Housekeeping)
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-soft">
              <Zap className="h-10 w-10 mb-4 text-primary mx-auto" />
              <h3 className="font-semibold mb-2">Idempotencia Nativa</h3>
              <p className="text-sm text-muted-foreground">
                Sin duplicados, transacciones atómicas, integridad garantizada
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
