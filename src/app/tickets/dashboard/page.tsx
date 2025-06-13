// RUTA: src/app/tickets/dashboard/page.tsx

// Importamos el componente renombrado y refactorizado
import TicketsDashboard from "@/components/tickets/TicketsDashboard";
import { cookies } from 'next/headers';

// Interfaces para los datos que esperamos
interface EmpresaClienteOption {
  id: string;
  nombre: string;
}

interface UbicacionOption {
  id: string;
  nombreReferencial: string | null;
  direccionCompleta: string;
}

// Función asíncrona para obtener datos del lado del servidor
async function getInitialData() {
    let empresasClientes: EmpresaClienteOption[] = [];
    let ubicacionesDisponibles: UbicacionOption[] = [];
    let error: string | null = null;

    try {
        // MODIFICACIÓN: Se añadió 'await' a cookies() para compatibilidad con Next.js 15
        const cookieStore = await cookies(); 
        const fetchHeaders = new Headers();
        const sessionCookie = cookieStore.get('next-auth.session-token');
        if (sessionCookie) {
            fetchHeaders.append('Cookie', `${sessionCookie.name}=${sessionCookie.value}`);
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const [empresasRes, ubicacionesRes] = await Promise.all([
            fetch(`${baseUrl}/api/empresas`, { cache: 'no-store', headers: fetchHeaders }),
            fetch(`${baseUrl}/api/ubicaciones`, { cache: 'no-store', headers: fetchHeaders })
        ]);

        if (!empresasRes.ok) throw new Error(`Error al cargar empresas: ${empresasRes.statusText}`);
        empresasClientes = await empresasRes.json();

        if (!ubicacionesRes.ok) throw new Error(`Error al cargar ubicaciones: ${ubicacionesRes.statusText}`);
        ubicacionesDisponibles = await ubicacionesRes.json();

    } catch (e: any) {
        console.error("Error cargando datos iniciales para el dashboard:", e);
        error = e.message || "No se pudieron cargar los datos para los filtros.";
    }

    return { empresasClientes, ubicacionesDisponibles, error };
}


export default async function TicketsDashboardPage() {
  const { empresasClientes, ubicacionesDisponibles, error } = await getInitialData();

  if (error) {
    return (
      <div className="flex flex-col h-full p-4 items-center justify-center text-red-600">
        <p>Error Crítico al Cargar la Página</p>
        <p className="text-sm mt-2">{error}</p>
        <p className="text-xs mt-4">Asegúrate de que el servidor de la API esté funcionando y que la sesión sea válida.</p>
      </div>
    );
  }

  // Usamos el nuevo componente orquestador
  return (
    <div className="flex flex-col h-full">
      <TicketsDashboard
        empresasClientes={empresasClientes}
        ubicacionesDisponibles={ubicacionesDisponibles}
      />
    </div>
  );
}

