import { TicketForm } from "@/components/ticket-form";
import { prisma } from "@/lib/prisma"; // Asegúrate que la ruta a prisma sea correcta

// Función para cargar el último número de caso del ticket desde la base de datos.
// Esta función correctamente usa 'numeroCaso' para la consulta a Prisma.
async function loadLastTicketNumeroCasoFromDB(): Promise<number> {
  try {
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { numeroCaso: "desc" }, // Campo 'numeroCaso' según tu schema Prisma
      select: { numeroCaso: true },    // Campo 'numeroCaso' según tu schema Prisma
    });
    // Si lastTicket existe y tiene numeroCaso, lo devuelve, sino devuelve 0.
    return lastTicket?.numeroCaso || 0; 
  } catch (error) {
    console.error("Error al cargar numeroCaso del último ticket:", error);
    // En un caso real, podrías querer manejar este error de forma más robusta
    // o lanzar el error para que un ErrorBoundary lo capture.
    return 0; 
  }
}

export default async function NewTicketPage() {
  // Carga el último valor del campo 'numeroCaso' registrado en la base de datos.
  const lastNumeroCasoValue = await loadLastTicketNumeroCasoFromDB();
  // Calcula el siguiente número que se usará para la prop 'nextNroCaso'.
  const valueForNextNroCasoProp = lastNumeroCasoValue + 1;

  return (
    // El padding general de la página se aplica aquí para centrar el formulario.
    // h-full y flex para que el centrado funcione bien dentro del <main> del layout.
    <div className="flex flex-col items-center justify-start h-full p-4 md:p-6">
      <TicketForm nextNroCaso={valueForNextNroCasoProp} />
    </div>
  );
}
