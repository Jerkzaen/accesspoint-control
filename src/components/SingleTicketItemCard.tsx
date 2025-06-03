// src/components/SingleTicketItemCard.tsx (ACTUALIZADO - Número de Caso como Badge junto al Estado)
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Ticket } from '@/types/ticket';
import { Badge } from '@/components/ui/badge';
import { cn, formatTicketNumber } from '@/lib/utils'; // Importar formatTicketNumber

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
            {/* La CardDescription ahora solo contendrá la empresa */}
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              {ticket.empresa}
            </CardDescription>
          </div>
          {/* Contenedor para las dos Badges: Número de Caso y Estado */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-end sm:items-start mt-1 sm:mt-0">
            {/* Badge para el número de caso, con texto "Caso" */}
            <Badge 
              variant="secondary" // Usar secondary para un estilo que no sea afectado por el hover de la tarjeta
              className="whitespace-nowrap text-xs sm:text-sm px-2.5 py-1 h-auto sm:h-6"
            >
            #{formattedNumeroCaso}
            </Badge>
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
