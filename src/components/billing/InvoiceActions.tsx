import { Button } from "@/components/ui/button";
import { Download, FileText, Receipt } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { toast } from "sonner";

interface InvoiceActionsProps {
  folio: any;
  charges: any[];
}

export default function InvoiceActions({ folio, charges }: InvoiceActionsProps) {
  const generateInvoicePDF = () => {
    const reservation = folio.reservation;
    if (!reservation) return;

    // Calcular totales
    const totalCharges = charges.reduce((sum, c) => sum + (c.amount_cents > 0 ? c.amount_cents : 0), 0) / 100;
    const totalPayments = charges.reduce((sum, c) => sum + (c.amount_cents < 0 ? Math.abs(c.amount_cents) : 0), 0) / 100;
    const balance = folio.balance_cents / 100;

    // Crear contenido de la factura
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #007B83; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #007B83; margin: 0; }
    .info-section { margin-bottom: 30px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-box { background: #f8f9fa; padding: 15px; border-radius: 5px; }
    .info-box h3 { margin: 0 0 10px 0; color: #007B83; font-size: 14px; }
    .info-box p { margin: 5px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #007B83; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .total-row { font-weight: bold; background: #f8f9fa; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-paid { background: #0EB57D; color: white; }
    .status-pending { background: #FFC107; color: #333; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FACTURA / INVOICE</h1>
    <p>Hotel Playa Paraíso</p>
    <p>Fecha: ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="info-section">
    <div class="info-grid">
      <div class="info-box">
        <h3>DATOS DEL HUÉSPED / GUEST INFORMATION</h3>
        <p><strong>Nombre:</strong> ${reservation.guest?.full_name || 'N/A'}</p>
        <p><strong>Email:</strong> ${reservation.guest?.email || 'N/A'}</p>
        <p><strong>Teléfono:</strong> ${reservation.guest?.phone || 'N/A'}</p>
      </div>
      <div class="info-box">
        <h3>DETALLES DE LA RESERVA / BOOKING DETAILS</h3>
        <p><strong>Habitación:</strong> ${reservation.units?.[0]?.room_type?.name || 'N/A'}</p>
        <p><strong>Check-in:</strong> ${formatDate(reservation.check_in_date)}</p>
        <p><strong>Check-out:</strong> ${formatDate(reservation.check_out_date)}</p>
      </div>
    </div>
  </div>

  <h3>DETALLE DE CARGOS / CHARGES DETAIL</h3>
  <table>
    <thead>
      <tr>
        <th>Fecha / Date</th>
        <th>Descripción / Description</th>
        <th style="text-align: right;">Monto / Amount (${folio.currency})</th>
      </tr>
    </thead>
    <tbody>
      ${charges
        .filter(c => c.amount_cents > 0)
        .map(charge => `
          <tr>
            <td>${formatDate(charge.charge_date || charge.created_at)}</td>
            <td>${charge.description}</td>
            <td style="text-align: right;">$${(charge.amount_cents / 100).toFixed(2)}</td>
          </tr>
        `).join('')}
      <tr class="total-row">
        <td colspan="2"><strong>SUBTOTAL</strong></td>
        <td style="text-align: right;"><strong>$${totalCharges.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  <h3>PAGOS RECIBIDOS / PAYMENTS RECEIVED</h3>
  <table>
    <thead>
      <tr>
        <th>Fecha / Date</th>
        <th>Método / Method</th>
        <th style="text-align: right;">Monto / Amount (${folio.currency})</th>
      </tr>
    </thead>
    <tbody>
      ${charges
        .filter(c => c.amount_cents < 0)
        .map(payment => `
          <tr>
            <td>${formatDate(payment.charge_date || payment.created_at)}</td>
            <td>${payment.description}</td>
            <td style="text-align: right;">$${Math.abs(payment.amount_cents / 100).toFixed(2)}</td>
          </tr>
        `).join('')}
      ${charges.filter(c => c.amount_cents < 0).length === 0 ? `
        <tr>
          <td colspan="3" style="text-align: center; color: #999;">No hay pagos registrados / No payments recorded</td>
        </tr>
      ` : ''}
      <tr class="total-row">
        <td colspan="2"><strong>TOTAL PAGADO / TOTAL PAID</strong></td>
        <td style="text-align: right;"><strong>$${totalPayments.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
    <div style="display: flex; justify-between; align-items: center;">
      <div>
        <h2 style="margin: 0; color: #007B83;">BALANCE / BALANCE DUE</h2>
      </div>
      <div style="text-align: right;">
        <h1 style="margin: 0; color: ${balance > 0 ? '#E94F37' : '#0EB57D'};">$${balance.toFixed(2)} ${folio.currency}</h1>
        <span class="status-badge ${balance > 0 ? 'status-pending' : 'status-paid'}">
          ${balance > 0 ? 'PENDIENTE / PENDING' : 'PAGADO / PAID'}
        </span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Hotel Playa Paraíso</strong></p>
    <p>Pedernales, República Dominicana</p>
    <p>Gracias por su preferencia / Thank you for your stay</p>
  </div>
</body>
</html>
    `;

    // Crear y descargar el archivo HTML
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Factura-${(reservation.guest?.full_name || 'huesped').replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Factura generada correctamente");
  };

  const exportForAccounting = () => {
    // Crear CSV para exportar a contabilidad
    const csvData = charges.map(charge => ({
      Fecha: formatDate(charge.charge_date || charge.created_at),
      Descripción: charge.description,
      Monto: (charge.amount_cents / 100).toFixed(2),
      Tipo: charge.amount_cents > 0 ? 'Cargo' : 'Pago',
      Moneda: folio.currency,
    }));

    const headers = ['Fecha', 'Descripción', 'Monto', 'Tipo', 'Moneda'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        Object.values(row).map(val => `"${val}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contabilidad-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Exportado para contabilidad");
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={generateInvoicePDF}
        variant="outline"
        size="sm"
        className="flex-1"
      >
        <Receipt className="h-4 w-4 mr-2" />
        Generar Factura
      </Button>
      <Button
        onClick={exportForAccounting}
        variant="outline"
        size="sm"
        className="flex-1"
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar Contabilidad
      </Button>
    </div>
  );
}
