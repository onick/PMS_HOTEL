import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldOff } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  module: string;
  action: string;
  resource?: string;
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  children,
  module,
  action,
  fallback,
  showError = false,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  // Build permission string in backend format: "module.action"
  const permissionName = `${module}.${action}`;
  const hasAccess = hasPermission(permissionName);

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
