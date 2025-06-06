// src/app/tickets/dashboard/page.tsx
import TicketCard from "@/components/TicketCard";
import { cookies } from 'next/headers'; // Importar cookies desde next/headers para Server Components

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
    // Obtener todas las cookies de la solicitud entrante
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('next-auth.session-token'); // O el nombre de la cookie de sesión de NextAuth

    // Preparar los headers para las solicitudes fetch internas
    const fetchHeaders: HeadersInit = {};
    if (sessionCookie) {
      fetchHeaders['Cookie'] = `${sessionCookie.name}=${sessionCookie.value}`;
    }

    // Obtener la lista de empresas clientes
    const empresasRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/empresas`, {
      cache: 'no-store', // Asegura que los datos se obtengan en cada request
      headers: fetchHeaders, // Pasar las cookies de sesión
    });

    if (!empresasRes.ok) {
      // Si la respuesta no es OK, podría ser un 404, 401, o el HTML de redirección
      const errorText = await empresasRes.text(); // Leer como texto para ver el contenido HTML
      console.error(`Error de respuesta en /api/empresas: ${empresasRes.status} - ${errorText}`);
      throw new Error(`Error al cargar empresas: ${empresasRes.status} ${empresasRes.statusText}. Posible problema de autenticación o ruta.`);
    }
    empresasClientes = await empresasRes.json();

    // Obtener la lista de ubicaciones disponibles
    const ubicacionesRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ubicaciones`, {
      cache: 'no-store', // Asegura que los datos se obtengan en cada request
      headers: fetchHeaders, // Pasar las cookies de sesión
    });

    if (!ubicacionesRes.ok) {
      const errorText = await ubicacionesRes.text();
      console.error(`Error de respuesta en /api/ubicaciones: ${ubicacionesRes.status} - ${errorText}`);
      throw new Error(`Error al cargar ubicaciones: ${ubicacionesRes.status} ${ubicacionesRes.statusText}. Posible problema de autenticación o ruta.`);
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
        <p>Por favor, asegúrate de que tus APIs de empresas y ubicaciones estén funcionando correctamente y que la sesión de usuario esté activa.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <TicketCard
        empresasClientes={empresasClientes}
        ubicacionesDisponibles={ubicacionesDisponibles}
      />
    </div>
  );
}
