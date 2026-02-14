import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Waves } from "lucide-react";
import { ApiError } from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const token = api.getToken();
    if (!token) return;

    try {
      await api.me();
      navigate("/dashboard");
    } catch {
      // Token is invalid/expired — clear it
      localStorage.removeItem("api_token");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);

    try {
      await api.register({
        name: fullName,
        email,
        password,
        password_confirmation: passwordConfirmation,
        hotel_name: hotelName,
      });
      toast.success("¡Cuenta creada! Bienvenido a HotelMate");
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        // Show validation errors
        if (err.data?.errors) {
          const firstError = Object.values(err.data.errors).flat()[0];
          toast.error(firstError as string);
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Error al crear la cuenta");
      }
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.errors) {
          const firstError = Object.values(err.data.errors).flat()[0];
          toast.error(firstError as string);
        } else {
          toast.error(err.message || "Credenciales incorrectas");
        }
      } else {
        toast.error("Error de conexión con el servidor");
      }
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Funcionalidad de recuperación de contraseña próximamente");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-gradient-ocean p-3 rounded-xl w-fit mb-2">
            <Waves className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">HotelMate PMS</CardTitle>
          <CardDescription>Sistema de Gestión Hotelera</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {!showResetForm ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input
                      id="email-signin"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Contraseña</Label>
                    <Input
                      id="password-signin"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-ocean hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Cargando..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-sm text-primary hover:underline w-full text-center"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm mb-4">
                    <p className="text-blue-800">
                      Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-ocean hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowResetForm(false)}
                    className="text-sm text-muted-foreground hover:underline w-full text-center"
                  >
                    Volver al inicio de sesión
                  </button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Nombre Completo</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-name">Nombre del Hotel</Label>
                  <Input
                    id="hotel-name"
                    type="text"
                    placeholder="Mi Hotel"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Contraseña</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-confirm">Confirmar Contraseña</Label>
                  <Input
                    id="password-confirm"
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-sunset hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
