import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Waves,
  Calendar,
  Shield,
  Zap,
  Hotel,
  Users,
  BarChart3,
  BedDouble,
  Network,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Star,
  Package,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Hotel, title: "Front Desk", desc: "Check-in/out y gestión de huéspedes", color: "text-blue-500" },
    { icon: Calendar, title: "Reservas", desc: "Inventario atómico en tiempo real", color: "text-purple-500" },
    { icon: BedDouble, title: "Housekeeping", desc: "Limpieza y mantenimiento", color: "text-pink-500" },
    { icon: CreditCard, title: "Facturación", desc: "Folios y pagos integrados", color: "text-green-500" },
    { icon: Network, title: "Channels", desc: "OTAs y distribución", color: "text-orange-500" },
    { icon: Users, title: "CRM", desc: "Base de datos de huéspedes", color: "text-cyan-500" },
    { icon: Package, title: "Inventario", desc: "Control de stock y compras", color: "text-amber-500" },
    { icon: BarChart3, title: "Revenue", desc: "Pricing dinámico inteligente", color: "text-indigo-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-ocean p-2 rounded-xl shadow-lg">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
                SOLARIS PMS
              </span>
              <p className="text-xs text-muted-foreground hidden sm:block">Sistema Hotelero</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/auth")} variant="ghost" size="sm" className="hidden sm:inline-flex">
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/auth")} size="sm" className="bg-gradient-ocean hover:opacity-90">
              Comenzar Gratis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Zap className="h-3 w-3 mr-1" />
              Tecnología de última generación
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              El Sistema Hotelero
              <span className="block bg-gradient-ocean bg-clip-text text-transparent">
                Más Completo
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              12 módulos integrados, seguridad empresarial y soporte 24/7. Todo lo que necesitas en una plataforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button onClick={() => navigate("/auth")} size="lg" className="bg-gradient-ocean hover:opacity-90">
                Probar Gratis 30 Días
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Sin tarjeta de crédito
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Configuración en minutos
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Cancela cuando quieras
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-ocean bg-clip-text text-transparent mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-ocean bg-clip-text text-transparent mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Hoteles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-ocean bg-clip-text text-transparent mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Soporte</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-ocean bg-clip-text text-transparent mb-2">12</div>
              <div className="text-sm text-muted-foreground">Módulos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Todo lo que necesitas
              <span className="block bg-gradient-ocean bg-clip-text text-transparent">
                En Una Plataforma
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              12 módulos completamente integrados que cubren todas las operaciones de tu hotel
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:shadow-xl transition-all hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className={`${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-10 w-10 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-ocean text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              ¿Listo para transformar tu hotel?
            </h2>
            <p className="text-lg md:text-xl text-white/90">
              Únete a hoteles que ya confían en SOLARIS PMS
            </p>
            <Button onClick={() => navigate("/auth")} size="lg" className="bg-white text-primary hover:bg-white/90">
              Comenzar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-ocean p-1.5 rounded-lg">
                <Waves className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">SOLARIS PMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SOLARIS PMS. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
