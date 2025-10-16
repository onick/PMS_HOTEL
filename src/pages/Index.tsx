import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Waves, Calendar, Shield, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Navbar - Responsive */}
      <nav className="container mx-auto px-4 py-4 md:py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-ocean p-1.5 md:p-2 rounded-lg">
            <Waves className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold">HotelSaaS</span>
        </div>
        <Button 
          onClick={() => navigate("/auth")} 
          variant="outline"
          size="sm"
          className="md:h-10"
        >
          <span className="hidden sm:inline">Iniciar Sesión</span>
          <span className="sm:hidden">Ingresar</span>
        </Button>
      </nav>

      {/* Hero Section - Responsive */}
      <main className="container mx-auto px-4 py-10 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-ocean bg-clip-text text-transparent leading-tight">
            Sistema de Reservas Hoteleras
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Gestiona tu hotel con tecnología de punta. Multi-propiedad, transacciones atómicas, 
            y seguridad empresarial desde el día uno.
          </p>
          <div className="flex gap-3 md:gap-4 justify-center px-4">
            <Button 
              onClick={() => navigate("/auth")} 
              size="lg" 
              className="bg-gradient-ocean hover:opacity-90 w-full sm:w-auto"
            >
              Empezar Gratis
            </Button>
          </div>

          {/* Features Grid - Responsive */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16 px-2">
            <div className="p-5 md:p-6 rounded-lg bg-card shadow-soft">
              <Calendar className="h-8 w-8 md:h-10 md:w-10 mb-3 md:mb-4 text-primary mx-auto" />
              <h3 className="font-semibold mb-2 text-sm md:text-base">Reservas en Tiempo Real</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Control de inventario con locks optimistas y sistema de holds automático
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-lg bg-card shadow-soft">
              <Shield className="h-8 w-8 md:h-10 md:w-10 mb-3 md:mb-4 text-primary mx-auto" />
              <h3 className="font-semibold mb-2 text-sm md:text-base">Multi-tenant Seguro</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                RLS por hotel, roles granulares (Owner, Manager, Recepción, Housekeeping)
              </p>
            </div>
            <div className="p-5 md:p-6 rounded-lg bg-card shadow-soft sm:col-span-2 md:col-span-1">
              <Zap className="h-8 w-8 md:h-10 md:w-10 mb-3 md:mb-4 text-primary mx-auto" />
              <h3 className="font-semibold mb-2 text-sm md:text-base">Idempotencia Nativa</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
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
