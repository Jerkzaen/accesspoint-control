// src/app/carga-masiva/page.tsx

import CargaMasivaTickets from "@/components/admin/CargaMasivaTickets";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileWarning, ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUsuario } from "@prisma/client";
import { redirect } from "next/navigation";

// Componente de la página principal para la carga masiva.
// Valida el rol del usuario en el servidor antes de renderizar.
export default async function CargaMasivaPage() {
  const session = await getServerSession(authOptions);

  // Redirección si el usuario no es admin. Esto es una capa extra de seguridad al middleware.
  if (!session || (session.user as any).rol !== RoleUsuario.ADMIN) {
    redirect('/tickets/dashboard'); // O a una página de acceso denegado
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Carga Masiva de Tickets</CardTitle>
              <CardDescription>
                Herramienta para importar múltiples tickets desde un archivo CSV.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CargaMasivaTickets />
      </Card>
      
      <Alert variant="destructive" className="max-w-4xl mx-auto mt-6">
        <FileWarning className="h-4 w-4" />
        <AlertTitle>¡Atención!</AlertTitle>
        <AlertDescription>
          Esta es una herramienta de administrador. La importación de datos incorrectos puede afectar la integridad del sistema.
          Asegúrate de que el archivo CSV cumple con el formato requerido antes de proceder.
        </AlertDescription>
      </Alert>
    </div>
  );
}
