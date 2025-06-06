// src/components/SingleTicketItemCard.tsx
'use client';

import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Ticket } from '@/types/ticket';
import { Badge } from '@/components/ui/badge';
import { cn, formatTicketNumber, getCompanyLogoUrl } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, Hash } from 'lucide-react'; // Importar Hash
import { useState } from 'react';
// Importar los enums de Prisma
import { EstadoTicket } from '@prisma/client'; 

interface SingleTicketItemCardProps {
  ticket: Ticket | undefined | null;
  onSelectTicket: (ticket: Ticket) => void;
  onTicketUpdatedInList: (updatedTicket: Ticket) => void;
  isSelected: boolean;
}

export default function SingleTicketItemCard({ ticket, onSelectTicket, onTicketUpdatedInList, isSelected }: SingleTicketItemCardProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!ticket || typeof ticket.fechaCreacion === 'undefined') {
    console.error("Error: El objeto ticket o ticket.fechaCreacion es undefined.", ticket);
    return (
      <Card className="mb-3 p-4 border-destructive bg-destructive/10">
        <p className="text-destructive-foreground text-sm">
          Error al cargar datos de un ticket. Faltan datos esenciales.
        </p>
      </Card>
    );
  }

  // Las propiedades de fecha del ticket ahora son de tipo Date, como se definió en src/types/ticket.ts
  const fechaCreacionDate = ticket.fechaCreacion.toLocaleString('es-CL', {
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

  // CORRECCIÓN: getEstadoBadgeVariant ahora usa los valores del enum directamente
  // para mapear el color de la insignia (Badge).
  const getEstadoBadgeVariant = (estado: EstadoTicket): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) { // Aquí 'estado' ya es un valor del enum
      case EstadoTicket.ABIERTO: return "default";
      case EstadoTicket.CERRADO: return "destructive";
      case EstadoTicket.EN_PROGRESO: return "secondary";
      case EstadoTicket.PENDIENTE: return "outline";
      default: return "outline";
    }
  };

  const formattedNumeroCaso = formatTicketNumber(ticket.numeroCaso);
  const companyNameForLogo = ticket.empresaCliente?.nombre;
  const companyLogoUrl = getCompanyLogoUrl(companyNameForLogo);

  const handleStatusChange = async (newStatus: EstadoTicket) => { // Aceptar EstadoTicket como tipo
    if (!ticket) return;
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }), // Enviar el valor del enum directamente
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
        throw new Error(errorData.message || 'Error al actualizar el estado');
      }

      const updatedTicketData: Ticket = await response.json();
      onTicketUpdatedInList(updatedTicketData);
    } catch (err: any) {
      console.error("Error al cambiar estado directamente:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Estas son las constantes de tu código, no se modifican sus valores.
  const commonBadgeHeight = "h-6";
  const commonBadgeTextSize = "text-xs";
  const commonBadgePaddingX = "px-2.5";

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
      onClick={() => ticket && onSelectTicket(ticket)}
    >
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-grow">
            <CardTitle className="text-sm sm:text-base leading-tight">
              {ticket.titulo}
            </CardTitle>
          </div>

          {/* Contenedor de Badges: Responsive y Nuevo Orden */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0 sm:flex-row sm:items-center sm:gap-1.5">
            {/* 1. Empresa / Logo */}
            {companyLogoUrl ? (
              <Badge
                variant="secondary"
                className={cn("w-12 p-0 flex items-center justify-center overflow-hidden rounded-md", commonBadgeHeight)}
              >
                <Image
                  src={companyLogoUrl}
                  // Se aseguró que 'alt' reciba un string simple para evitar el error de tipado.
                  alt={companyNameForLogo ? `${companyNameForLogo} logo` : "Logo de la empresa"}
                  width={48}
                  height={24}
                  className="object-cover w-full h-full"
                />
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className={cn("whitespace-nowrap", commonBadgeTextSize, commonBadgeHeight, commonBadgePaddingX)}
              >
                {companyNameForLogo || 'N/A'} {/* Usar companyNameForLogo aquí */}
              </Badge>
            )}

            {/* 2. Número de Caso */}
            <Badge
              variant="secondary"
              className={cn("whitespace-nowrap", commonBadgeTextSize, commonBadgeHeight, commonBadgePaddingX)}
            >
              <Hash size={12} className="mr-0.5" />{formattedNumeroCaso}
            </Badge>
            
            {/* 3. Estado */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={getEstadoBadgeVariant(ticket.estado)} // Aquí se usa el valor del enum directamente
                  className={cn("whitespace-nowrap cursor-pointer flex items-center w-full justify-center sm:w-auto", commonBadgeTextSize, commonBadgeHeight, commonBadgePaddingX)}
                  size="sm"
                  disabled={isUpdatingStatus}
                >
                  {ticket.estado || 'N/A'}
                  {isUpdatingStatus ? <Loader2 className="ml-1.5 h-3 w-3 animate-spin" /> : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <p className="text-sm font-semibold mb-2">Cambiar Estado</p>
                <div className="flex flex-col gap-1">
                  {/* Estos botones ya estaban bien, usando los miembros del enum directamente */}
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.ABIERTO)}>Abierto</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.EN_PROGRESO)}>En Progreso</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.CERRADO)}>Cerrado</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.PENDIENTE)}>Pendiente</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-1.5 pt-2 pb-3 px-4 sm:px-5", commonBadgeTextSize)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          <div><strong>Tipo Incidente:</strong> {ticket.tipoIncidente}</div>
          <div><strong>Ubicación:</strong> {ticket.ubicacion?.nombreReferencial || ticket.ubicacion?.direccionCompleta || 'N/A'}</div>
          <div><strong>Técnico:</strong> {ticket.tecnicoAsignado?.name || ticket.tecnicoAsignado?.email || 'No asignado'}</div>
          <div><strong>Contacto:</strong> {ticket.solicitanteNombre}</div>
          <div className="sm:col-span-2"><strong>Creado:</strong> {fechaCreacionDate}</div>
          <div>
            <strong>Prioridad:</strong>{' '}
            <Badge
              variant={prioridadVariant}
              className={cn(commonBadgeTextSize, commonBadgeHeight, "px-2 py-0.5")}
            >
              {ticket.prioridad?.toUpperCase() || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
