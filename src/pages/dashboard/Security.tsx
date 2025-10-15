import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuditLogs from "@/components/security/AuditLogs";
import DataAccessLogs from "@/components/security/DataAccessLogs";
import PermissionsManager from "@/components/security/PermissionsManager";
import GDPRRequests from "@/components/security/GDPRRequests";
import UserManagement from "@/components/security/UserManagement";
import { Shield, FileText, Lock, UserCheck, Users } from "lucide-react";
import { useOutletContext } from "react-router-dom";

export default function Security() {
  const { hotel } = useOutletContext<{ hotel: { id: string } }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Seguridad y Cumplimiento
        </h1>
        <p className="text-muted-foreground">
          Control de permisos, auditoría y cumplimiento RGPD/PCI DSS
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Permisos
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Auditoría
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Acceso a Datos
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            RGPD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement hotelId={hotel.id} />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionsManager />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <DataAccessLogs />
        </TabsContent>

        <TabsContent value="gdpr" className="space-y-4">
          <GDPRRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}
