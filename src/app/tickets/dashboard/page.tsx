    import LeftColumnTickets from "@/components/LeftColumnTickets";

    export default function TicketsDashboardPage() {
      return (
        // Este div debe permitir que LeftColumnTickets se expanda.
        // 'h-full' para tomar la altura del <main> de layout.tsx.
        // 'flex flex-col' para que LeftColumnTickets (que tiene h-full en su raíz) funcione.
        // El padding general (p-4) se añade aquí para el contenido de la página.
        <div className="flex flex-col h-full p-4">
          <LeftColumnTickets />
        </div>
      );
    }
    