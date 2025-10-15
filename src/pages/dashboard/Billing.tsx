import { useState } from "react";
import BillingStats from "@/components/billing/BillingStats";
import ActiveFolios from "@/components/billing/ActiveFolios";
import FolioDetails from "@/components/billing/FolioDetails";
import RecentTransactions from "@/components/billing/RecentTransactions";

export default function Billing() {
  const [selectedFolio, setSelectedFolio] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Facturación y Pagos</h1>
        <p className="text-muted-foreground">
          Gestión de folios, cargos y métodos de pago
        </p>
      </div>

      <BillingStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveFolios onSelectFolio={setSelectedFolio} />
        <RecentTransactions />
      </div>

      <FolioDetails
        folio={selectedFolio}
        open={!!selectedFolio}
        onClose={() => setSelectedFolio(null)}
      />
    </div>
  );
}
