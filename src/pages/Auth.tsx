import { useState, useEffect } from "react";
import { supabase, DEMO_MODE, DEMO_USER } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Waves, Zap } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  // Modo desarrollo: Auto-completar credenciales de prueba
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
  };

  // Acceso rapido en modo demo
  const handleDemoLogin = async () => {
    setLoading(true);

    // Guardar sesion demo en localStorage
    localStorage.setItem('demo_session', JSON.stringify({
      user: DEMO_USER,
      timestamp: Date.now(),
    }));

    // Authenticate with Laravel API using demo credentials
    try {
      await api.login('admin@hoteldemo.com', 'password');
      toast.success("Modo Demo - Conectado al servidor");
    } catch (err) {
      console.warn("Laravel API login failed, continuing in offline demo mode:", err);
      toast.success("Modo Demo - Modo offline (sin servidor)");
    }

    navigate("/dashboard");
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("¡Cuenta creada! Ya puedes iniciar sesión");
      setEmail("");
      setPassword("");
      setFullName("");
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Authenticate with Supabase (legacy)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Also authenticate with Laravel API
    try {
      await api.login(email, password);
    } catch (err) {
      console.warn("Laravel API login failed:", err);
    }

    navigate("/dashboard");
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Te hemos enviado un correo para restablecer tu contraseña");
      setShowResetForm(false);
      setResetEmail("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-gradient-ocean p-3 rounded-xl w-fit mb-2">
            <Waves className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Reservas</CardTitle>
          <CardDescription>Hotel Playa Paraíso - Pedernales, RD</CardDescription>
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
                  {DEMO_MODE && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-md p-4 text-sm">
                      <p className="font-semibold text-purple-800 mb-1 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        🎮 Modo Demo Activado
                      </p>
                      <p className="text-purple-700 text-xs mb-3">
                        Accede instantáneamente sin necesidad de crear cuenta
                      </p>
                      <Button
                        type="button"
                        onClick={handleDemoLogin}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white"
                        disabled={loading}
                      >
                        {loading ? "Cargando..." : "Entrar en Modo Demo"}
                      </Button>
                    </div>
                  )}
                  {isDevelopment && !DEMO_MODE && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                      <p className="font-semibold text-yellow-800 mb-1">🔧 Modo Desarrollo</p>
                      <p className="text-yellow-700 text-xs">
                        Para probar el sistema, primero debes crear una cuenta en la pestaña "Registrarse"
                      </p>
                    </div>
                  )}
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        O usa email y contraseña
                      </span>
                    </div>
                  </div>
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