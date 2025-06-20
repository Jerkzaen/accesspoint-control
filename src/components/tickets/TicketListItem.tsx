//src/components/tickets/TicketListItem.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import React, { useState } from 'react';
import { Loader2, Hash } from 'lucide-react';
import { Ticket } from '@/types/ticket'; // La importación ahora trae los tipos actualizados
import { EstadoTicket, PrioridadTicket } from '@prisma/client';
import { cn, formatTicketNumber, getCompanyLogoUrl } from '@/lib/utils';

interface TicketListItemProps {
  ticket: Ticket | undefined | null;
  onSelectTicket: (ticket: Ticket) => void;
  onTicketUpdatedInList: (updatedTicket: Ticket) => void;
  isSelected: boolean;
  isNew?: boolean;
}

export default function TicketListItem({
  ticket,
  onSelectTicket,
  onTicketUpdatedInList,
  isSelected,
  isNew = false
}: TicketListItemProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!ticket) {
    return (
      <Card className="mb-3 p-4 border-destructive bg-destructive/10 rounded-lg">
        <p className="text-destructive-foreground text-sm">Error al cargar datos del ticket.</p>
      </Card>
    );
  }

  const fechaCreacionDateObj = new Date(ticket.fechaCreacion);
  const fechaCreacionDateFormatted = fechaCreacionDateObj.toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  let prioridadVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  switch (ticket.prioridad) {
    case PrioridadTicket.BAJA: prioridadVariant = "secondary"; break;
    case PrioridadTicket.MEDIA: prioridadVariant = "default"; break;
    case PrioridadTicket.ALTA: prioridadVariant = "outline"; break;
    case PrioridadTicket.URGENTE: prioridadVariant = "destructive"; break;
    default: prioridadVariant = "outline";
  }

  const getEstadoBadgeVariant = (estado: EstadoTicket): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) {
      case EstadoTicket.ABIERTO: return "default";
      case EstadoTicket.CERRADO: return "destructive";
      case EstadoTicket.EN_PROGRESO: return "secondary";
      default: return "outline";
    }
  };

  const formattedNumeroCaso = formatTicketNumber(ticket.numeroCaso);
  // Corrección para usar la nueva relación `empresa`
  const companyLogoUrl = getCompanyLogoUrl(ticket.empresa?.nombre);

  const handleStatusChange = async (newStatus: EstadoTicket) => {
    if (!ticket) return;
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }),
      });
      if (!response.ok) throw new Error('Error al actualizar el estado');
      const updatedTicketData: Ticket = await response.json();
      onTicketUpdatedInList(updatedTicketData);
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Card
      className={cn("mb-3 cursor-pointer transition-all duration-150 rounded-lg hover:shadow-xl", {
        "shadow-lg bg-primary/15 dark:bg-primary/25": isSelected,
        "shadow-md dark:border-slate-700 hover:bg-primary/10 dark:hover:bg-primary/15": !isSelected,
        "animate-pulse-bg": isNew
      })}
      onClick={() => onSelectTicket(ticket)}
    >
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm sm:text-base leading-tight flex-grow truncate pr-4">
            {ticket.titulo}
          </CardTitle>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 sm:flex-row sm:items-center sm:gap-1.5">
            {companyLogoUrl ? (
              <Badge variant="secondary" className="w-12 p-0 flex items-center justify-center overflow-hidden rounded-md h-6">
                <Image src={companyLogoUrl} alt={`${ticket.empresa?.nombre || 'Empresa'} logo`} width={48} height={24} className="object-cover w-full h-full" />
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-6 px-2.5 text-xs">{ticket.empresa?.nombre || 'N/A'}</Badge>
            )}
            <Badge variant="secondary" className="h-6 px-2.5 text-xs"><Hash size={12} className="mr-0.5" />{formattedNumeroCaso}</Badge>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={getEstadoBadgeVariant(ticket.estado)} className="h-6 px-2.5 text-xs" size="sm" disabled={isUpdatingStatus}>
                  {ticket.estado}{isUpdatingStatus && <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <p className="text-sm font-semibold mb-2">Cambiar Estado</p>
                <div className="flex flex-col gap-1">
                  {Object.values(EstadoTicket).map(status => (
                    <Button key={status} variant="ghost" size="sm" className="justify-start text-xs" onClick={(e) => { e.stopPropagation(); handleStatusChange(status); }}>
                      {status}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-2 pb-3 px-4 sm:px-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          <div><strong>Tipo Incidente:</strong> {ticket.tipoIncidente || 'N/A'}</div>
          {/* --- CAMBIO CLAVE --- */}
          {/* Se muestra el nombre de la sucursal directamente desde la nueva relación */}
          <div><strong>Ubicación:</strong> {ticket.sucursal?.nombre || 'N/A'}</div>
          <div><strong>Técnico:</strong> {ticket.tecnicoAsignado?.name || ticket.tecnicoAsignado?.email || 'No asignado'}</div>
          <div><strong>Contacto:</strong> {ticket.solicitanteNombre || 'N/A'}</div>
          <div className="sm:col-span-2"><strong>Creado:</strong> {fechaCreacionDateFormatted}</div>
          <div>
            <strong>Prioridad:</strong>{' '}
            <Badge variant={prioridadVariant} className={cn("px-2 py-0.5 text-xs h-auto")}>
              {ticket.prioridad?.toUpperCase() || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
