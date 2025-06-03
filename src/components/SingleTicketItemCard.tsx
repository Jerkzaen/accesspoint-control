// src/components/SingleTicketItemCard.tsx (ACTUALIZADO - Insignia de Empresa más ancha y con imagen que llena)
'use client';

import Image from 'next/image'; // Importar el componente Image de Next.js
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Ticket } from '@/types/ticket';
import { Badge } from '@/components/ui/badge';
import { cn, formatTicketNumber, getCompanyLogoUrl } from '@/lib/utils'; // Importar getCompanyLogoUrl

interface SingleTicketItemCardProps {
  ticket: Ticket;
  onSelectTicket: (ticket: Ticket) => void;
  isSelected: boolean;
}

export default function SingleTicketItemCard({ ticket, onSelectTicket, isSelected }: SingleTicketItemCardProps) {
  const fechaCreacionDate = new Date(ticket.fechaCreacion).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let prioridadVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  switch (ticket.prioridad?.toLowerCase()) {
    case 'baja': prioridadVariant = "secondary"; break;
    case 'media': prioridadVariant = "default"; break;
    case 'alta': prioridadVariant = "outline"; break;
    case 'urgente': prioridadVariant = "destructive"; break;
    default: prioridadVariant = "outline";
  }

  // Definir la variante para el badge del estado
  let estadoVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  switch (ticket.estado?.toLowerCase()) {
    case 'abierto': estadoVariant = "default"; break; // Usar 'default' para un color primario
    case 'cerrado': estadoVariant = "destructive"; break;
    case 'en progreso': estadoVariant = "secondary"; break;
    case 'pendiente': estadoVariant = "outline"; break;
  }

  // Formatear el número de caso
  const formattedNumeroCaso = formatTicketNumber(ticket.numeroCaso);
  // Obtener la URL del logo de la empresa
  const companyLogoUrl = getCompanyLogoUrl(ticket.empresa);

  return (
    <Card
      className={cn(
        "mb-3 cursor-pointer transition-all duration-150 ease-in-out",
        "hover:shadow-xl",
        {
          "shadow-lg bg-primary/15 dark:bg-primary/25": isSelected,
          "shadow-md dark:border-slate-700 hover:bg-primary/10 dark:hover:bg-primary/15": !isSelected,
        }
      )}
      onClick={() => onSelectTicket(ticket)}
    >
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1 sm:gap-2">
          <div className="flex-grow">
            {/* Mantener el título como el CardTitle principal */}
            <CardTitle className="text-base sm:text-lg md:text-xl leading-tight">
              {ticket.titulo}
            </CardTitle>
          </div>
          {/* Contenedor para las tres Badges: Número de Caso, Empresa y Estado */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-end sm:items-start mt-1 sm:mt-0">
            {/* Badge para el número de caso, con texto "Caso" */}
            <Badge 
              variant="secondary" // Usar secondary para un estilo que no sea afectado por el hover de la tarjeta
              className="whitespace-nowrap text-xs sm:text-sm px-2.5 py-1 h-auto sm:h-6"
            >
              Caso #{formattedNumeroCaso}
            </Badge>
            {/* Badge para la empresa, con logo si existe */}
            {companyLogoUrl ? (
              <Badge 
                variant="secondary" 
                // Establecer un ancho y alto fijo para el badge
                // h-6 es 24px de alto. w-10 es 40px de ancho. Esto lo hace rectangular.
                // p-0 elimina el padding interno del badge.
                className="w-10 h-6 p-0 flex items-center justify-center overflow-hidden rounded-md" 
              >
                <Image 
                  src={companyLogoUrl} 
                  alt={`${ticket.empresa} logo`} 
                  width={40} // Coincidir con el ancho del badge (w-10 = 40px)
                  height={24} // Coincidir con el alto del badge (h-6 = 24px)
                  className="object-cover w-full h-full" // object-cover para que la imagen llene el espacio, recortando si es necesario
                />
              </Badge>
            ) : (
              // Si no hay logo, mostrar solo el nombre de la empresa como badge
              <Badge 
                variant="secondary" 
                className="whitespace-nowrap text-xs sm:text-sm px-2.5 py-1 h-auto sm:h-6"
              >
                {ticket.empresa}
              </Badge>
            )}
            {/* Badge para el estado del ticket */}
            <Badge variant={estadoVariant} className="whitespace-nowrap text-xs sm:text-sm px-2.5 py-1 h-auto sm:h-6">
              {ticket.estado || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pt-2 pb-3 px-4 sm:px-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm pt-2 mt-1">
          <div><strong>Tipo Incidente:</strong> {ticket.tipoIncidente}</div>
          <div><strong>Ubicación:</strong> {ticket.ubicacion}</div>
          <div><strong>Técnico:</strong> {ticket.tecnicoAsignado}</div>
          <div><strong>Contacto:</strong> {ticket.solicitante}</div>
          <div className="sm:col-span-2"><strong>Creado:</strong> {fechaCreacionDate}</div>
          <div>
            <strong>Prioridad:</strong>{' '}
            <Badge variant={prioridadVariant} className="px-2 py-0.5 text-xs sm:text-sm h-auto">
              {ticket.prioridad?.toUpperCase() || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
