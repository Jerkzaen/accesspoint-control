// src/components/SingleTicketItemCard.tsx (ACTUALIZADO - Eliminada descripción detallada)
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Ticket } from '@/types/ticket'; // Esta interfaz ya debería estar actualizada
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SingleTicketItemCardProps {
  ticket: Ticket;
  onSelectTicket: (ticket: Ticket) => void;
  isSelected: boolean;
}

export default function SingleTicketItemCard({ ticket, onSelectTicket, isSelected }: SingleTicketItemCardProps) {
  // Usar el nuevo nombre de campo: fechaCreacion
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

  let estadoVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  switch (ticket.estado?.toLowerCase()) {
    case 'abierto': estadoVariant = "default"; break;
    case 'cerrado': estadoVariant = "destructive"; break;
    case 'en progreso': estadoVariant = "secondary"; break;
    case 'pendiente': estadoVariant = "outline"; break;
  }

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
            <CardTitle className="text-base sm:text-lg md:text-xl leading-tight">
              {/* Usar los nuevos nombres de campo */}
              Caso #{ticket.numeroCaso} - {ticket.empresa}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              {/* Usar los nuevos nombres de campo */}
              {ticket.tipoIncidente} - {ticket.ubicacion}
            </CardDescription>
          </div>
          <Badge variant={estadoVariant} className="mt-1 sm:mt-0 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1 h-auto sm:h-6">
            {ticket.estado || 'N/A'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pt-2 pb-3 px-4 sm:px-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm pt-2 mt-1">
          {/* Usar los nuevos nombres de campo */}
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
        {/*
          SE HA ELIMINADO LA DESCRIPCIÓN DETALLADA DE ESTA TARJETA PARA EVITAR REDUNDANCIA
          Y MANTENER ESTA TARJETA COMO UN RESUMEN CONCISO.
          La descripción detallada completa se mostrará en el SelectedTicketPanel.
        */}
      </CardContent>
    </Card>
  );
}
