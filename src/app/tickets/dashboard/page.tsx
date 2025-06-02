// src/app/tickets/dashboard/page.tsx
import TicketCard from "@/components/TicketCard"; // MODIFICADO: Usar TicketCard en lugar de LeftColumnTickets

export default function TicketsDashboardPage() {
  return (
    // Este div debe permitir que TicketCard se expanda.
    // 'h-full' para tomar la altura del <main> de layout.tsx.
    // 'flex flex-col' para que TicketCard (que tiene h-full en su raíz) funcione.
    // El padding general (p-4) se añade aquí para el contenido de la página.
    <div className="flex flex-col h-full p-4">
      <TicketCard />
    </div>
  );
}
