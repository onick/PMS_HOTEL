import { useOutletContext } from "react-router-dom";
import ReservationsList from "@/components/reservations/ReservationsList";
import NewReservationDialog from "@/components/reservations/NewReservationDialog";

export default function Reservations() {
  const { hotel } = useOutletContext<{ hotel: any }>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Reservas</h1>
          <p className="text-muted-foreground">
            Administra todas las reservas del hotel
          </p>
        </div>
        <NewReservationDialog hotelId={hotel.id} />
      </div>
      
      <ReservationsList hotelId={hotel.id} />
    </div>
  );
}
