// src/app/tickets/new/page.tsx
import { TicketForm } from "@/components/ticket-form";
import { prisma } from "@/lib/prisma"; // Asegúrate que la ruta a prisma sea correcta

// Función para cargar el último número de caso del ticket
async function loadLastTicketNro(): Promise<number> {
  try {
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { nroCaso: "desc" },
      select: { nroCaso: true },
    });
    return lastTicket?.nroCaso || 0;
  } catch (error) {
    console.error("Error al cargar nroCaso del último ticket:", error);
    // En un caso real, podrías querer manejar este error de forma más robusta
    // o lanzar el error para que un ErrorBoundary lo capture.
    return 0; 
  }
}

export default async function NewTicketPage() {
  const lastNroCaso = await loadLastTicketNro();
  const nextNroCaso = lastNroCaso + 1;

  return (
    // El padding general de la página se aplica aquí para centrar el formulario.
    // h-full y flex para que el centrado funcione bien dentro del <main> del layout.
    <div className="flex flex-col items-center justify-start h-full p-4 md:p-6">
      <TicketForm nextNroCaso={nextNroCaso} />
    </div>
  );
}
