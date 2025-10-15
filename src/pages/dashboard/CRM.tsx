import { useState } from "react";
import CRMStats from "@/components/crm/CRMStats";
import GuestsList from "@/components/crm/GuestsList";
import GuestDetails from "@/components/crm/GuestDetails";

export default function CRM() {
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">CRM - Gestión de Clientes</h1>
        <p className="text-muted-foreground">
          Administración de huéspedes y programas de fidelización
        </p>
      </div>

      <CRMStats />

      <GuestsList onSelectGuest={setSelectedGuest} />

      <GuestDetails
        guest={selectedGuest}
        open={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
      />
    </div>
  );
}
