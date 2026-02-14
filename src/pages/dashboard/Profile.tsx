import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MembershipOverview } from '@/components/subscription/MembershipOverview';
import { ChangePlanView } from '@/components/subscription/ChangePlanView';
import { User, Mail, Building2, Shield, CreditCard, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);

  // Get user data from API
  const {
    data: userData,
    isLoading: isLoadingUser,
    isError: isUserError,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    retry: false,
  });

  const user = userData?.data || userData?.user;

  // Set fullName when user data loads
  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }
  }, [user?.name]);

  // Handle payment success/cancel from Stripe redirect
  useEffect(() => {
    const payment = searchParams.get('payment');

    if (payment === 'success') {
      toast.success('¡Pago procesado exitosamente! Tu suscripción se actualizará en unos momentos.', {
        duration: 5000,
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }, 2000);

      setSearchParams({});

      const tabTrigger = document.querySelector('[value="subscription"]') as HTMLButtonElement;
      if (tabTrigger) {
        setTimeout(() => tabTrigger.click(), 500);
      }
    } else if (payment === 'canceled') {
      toast.error('El pago fue cancelado. Puedes intentarlo nuevamente cuando lo desees.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, queryClient]);

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      toast.error('Por favor ingresa un nombre válido');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateProfile({ name: fullName.trim() });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Nombre actualizado correctamente');
      setIsEditingName(false);
    } catch (error: any) {
      console.error('Error updating name:', error);
      toast.error('Error al actualizar el nombre');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Even if logout API fails, clear local state
    }
    localStorage.removeItem('api_token');
    navigate('/auth');
    toast.success('Sesión cerrada correctamente');
  };

  const getUserInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      SUPER_ADMIN: 'Super Administrador',
      HOTEL_OWNER: 'Propietario',
      MANAGER: 'Gerente',
      RECEPTION: 'Recepción',
      HOUSEKEEPING: 'Housekeeping',
      SALES: 'Ventas',
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-500',
      HOTEL_OWNER: 'bg-blue-500',
      MANAGER: 'bg-green-500',
      RECEPTION: 'bg-orange-500',
      HOUSEKEEPING: 'bg-teal-500',
      SALES: 'bg-pink-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Cargando perfil...</div>
      </div>
    );
  }

  if (isUserError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-3">
            <p className="font-semibold">No se pudo cargar el perfil</p>
            <p className="text-sm text-muted-foreground">
              {(userError as any)?.message || 'Error de conexión o sesión inválida.'}
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => refetchUser()}>
                Reintentar
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <p className="font-semibold">Perfil no disponible</p>
            <p className="text-sm text-muted-foreground">
              No recibimos datos de usuario desde la API.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const userRole = user.role || '';
  const hotelName = user.current_hotel?.name || '';
  const hotelCity = '';
  const hotelCountry = '';
  const hotelId = user.current_hotel?.id || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{fullName || 'Usuario'}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </CardDescription>
              {userRole && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${getRoleBadgeColor(userRole)} text-white`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleName(userRole)}
                  </Badge>
                  {hotelName && (
                    <Badge variant="outline">
                      <Building2 className="h-3 w-3 mr-1" />
                      {hotelName}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Cuenta</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Suscripción</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información personal y detalles de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <div className="flex gap-2">
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditingName}
                    placeholder="Ingresa tu nombre completo"
                  />
                  {isEditingName ? (
                    <>
                      <Button onClick={handleSaveName} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFullName(user.name || '');
                          setIsEditingName(false);
                        }}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingName(true)}>
                      Editar
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El email no puede ser modificado. Contacta al administrador si necesitas cambiarlo.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Rol</Label>
                <div className="flex items-center gap-2">
                  <Badge className={`${getRoleBadgeColor(userRole)} text-white`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleName(userRole)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tu rol determina los permisos y acceso a diferentes módulos del sistema.
                </p>
              </div>

              {hotelName && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Hotel Asignado</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{hotelName}</p>
                        {hotelCity && (
                          <p className="text-sm text-muted-foreground">
                            {hotelCity}{hotelCountry ? `, ${hotelCountry}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {hotelId ? (
            showChangePlan ? (
              <ChangePlanView
                hotelId={hotelId}
                onBack={() => setShowChangePlan(false)}
              />
            ) : (
              <MembershipOverview
                hotelId={hotelId}
                onChangePlan={() => setShowChangePlan(true)}
              />
            )
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">No hay hotel asignado</p>
                  <p className="text-muted-foreground">
                    Necesitas estar asignado a un hotel para gestionar suscripciones.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Contacta al administrador del sistema.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Cuenta</CardTitle>
              <CardDescription>
                Gestiona la configuración y preferencias de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificaciones por Email</p>
                    <p className="text-sm text-muted-foreground">
                      Recibe actualizaciones importantes por correo
                    </p>
                  </div>
                  <Badge variant="secondary">Próximamente</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticación de Dos Factores</p>
                    <p className="text-sm text-muted-foreground">
                      Agrega una capa extra de seguridad a tu cuenta
                    </p>
                  </div>
                  <Badge variant="secondary">Próximamente</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tema de Interfaz</p>
                    <p className="text-sm text-muted-foreground">
                      Personaliza la apariencia de la aplicación
                    </p>
                  </div>
                  <Badge variant="outline">Disponible en header</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
              <CardDescription>
                Acciones irreversibles que afectan tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                <div>
                  <p className="font-medium">Eliminar Cuenta</p>
                  <p className="text-sm text-muted-foreground">
                    Elimina permanentemente tu cuenta y todos tus datos
                  </p>
                </div>
                <Button variant="destructive" disabled>
                  Eliminar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta función está deshabilitada. Contacta al administrador del sistema.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
