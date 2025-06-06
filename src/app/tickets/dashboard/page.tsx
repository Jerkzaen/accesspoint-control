// src/app/tickets/dashboard/page.tsx
import TicketCard from "@/components/TicketCard";

// Interfaces para los datos que esperamos (deberían coincidir con tus modelos Prisma)
interface EmpresaClienteOption {
  id: string;
  nombre: string;
}

interface UbicacionOption {
  id: string;
  nombreReferencial: string | null;
  direccionCompleta: string;
}

export default async function TicketsDashboardPage() {
  let empresasClientes: EmpresaClienteOption[] = [];
  let ubicacionesDisponibles: UbicacionOption[] = [];
  let errorLoadingData: string | null = null;

  try {
    // Obtener la lista de empresas clientes
    const empresasRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/empresas`, {
      cache: 'no-store' // Asegura que los datos se obtengan en cada request
    });
    if (!empresasRes.ok) {
      throw new Error(`Error al cargar empresas: ${empresasRes.statusText}`);
    }
    empresasClientes = await empresasRes.json();

    // Obtener la lista de ubicaciones disponibles
    const ubicacionesRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ubicaciones`, {
      cache: 'no-store' // Asegura que los datos se obtengan en cada request
    });
    if (!ubicacionesRes.ok) {
      throw new Error(`Error al cargar ubicaciones: ${ubicacionesRes.statusText}`);
    }
    ubicacionesDisponibles = await ubicacionesRes.json();

  } catch (error: any) {
    console.error("Error cargando datos iniciales para selects:", error);
    errorLoadingData = error.message || "Error desconocido al cargar datos iniciales.";
  }

  if (errorLoadingData) {
    return (
      <div className="flex flex-col h-full p-4 items-center justify-center text-red-600">
        <p>Error al cargar datos iniciales: {errorLoadingData}</p>
        <p>Por favor, asegúrate de que tus APIs de empresas y ubicaciones estén funcionando correctamente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Pasar las props necesarias a TicketCard */}
      <TicketCard
        empresasClientes={empresasClientes}
        ubicacionesDisponibles={ubicacionesDisponibles}
      />
    </div>
  );
}
