import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldOff } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  module: string;
  action: string;
  resource?: string;
  hotelId?: string;
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  children,
  module,
  action,
  resource,
  hotelId,
  fallback,
  showError = false,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions(hotelId);

  if (isLoading) {
    return null;
  }

  const hasAccess = hasPermission(module, action, resource);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert variant="destructive">
          <ShieldOff className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta sección.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}
