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
import { Loader2, Hash } from 'lucide-react'; 
import React, { useState } from 'react'; 
import { EstadoTicket } from '@prisma/client'; 

interface SingleTicketItemCardProps {
  ticket: Ticket | undefined | null;
  onSelectTicket: (ticket: Ticket) => void;
  onTicketUpdatedInList: (updatedTicket: Ticket) => void;
  isSelected: boolean;
  isNew?: boolean; // New prop for animation
}

// Definimos el componente funcional principal
function SingleTicketItemCard({ ticket, onSelectTicket, onTicketUpdatedInList, isSelected, isNew = false }: SingleTicketItemCardProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Manejo de tickets no válidos o incompletos
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

  // Formatear fecha y hora a 24 horas y sin AM/PM
  const fechaCreacionDateObj = new Date(ticket.fechaCreacion);
  const fechaCreacionDateFormatted = fechaCreacionDateObj.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23' 
  });

  // Determinar la variante de color de la insignia de prioridad
  let prioridadVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  switch (ticket.prioridad) { 
    case 'BAJA': prioridadVariant = "secondary"; break;
    case 'MEDIA': prioridadVariant = "default"; break;
    case 'ALTA': prioridadVariant = "outline"; break;
    case 'URGENTE': prioridadVariant = "destructive"; break;
    default: prioridadVariant = "outline";
  }

  // Determinar la variante de color de la insignia de estado
  const getEstadoBadgeVariant = (estado: EstadoTicket): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) { 
      case EstadoTicket.ABIERTO: return "default";
      case EstadoTicket.CERRADO: return "destructive";
      case EstadoTicket.EN_PROGRESO: return "secondary";
      case EstadoTicket.PENDIENTE_TERCERO: return "outline"; 
      case EstadoTicket.PENDIENTE_CLIENTE: return "outline"; 
      case EstadoTicket.RESUELTO: return "default"; 
      case EstadoTicket.CANCELADO: return "destructive"; 
      default: return "outline";
    }
  };

  const formattedNumeroCaso = formatTicketNumber(ticket.numeroCaso);
  const companyNameForLogo = ticket.empresaCliente?.nombre;
  const companyLogoUrl = getCompanyLogoUrl(companyNameForLogo);

  // Manejador de cambio de estado del ticket
  const handleStatusChange = async (newStatus: EstadoTicket) => { 
    if (!ticket) return;
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }), 
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

  // Clases comunes para insignias
  const commonBadgeHeight = "h-6";
  const commonBadgeTextSize = "text-xs";
  const commonBadgePaddingX = "px-2.5";

  return (
    <Card
      className={cn(
        "mb-3 cursor-pointer transition-all duration-150 ease-in-out",
        {
          "shadow-lg bg-primary/15 dark:bg-primary/25": isSelected,
          "shadow-md dark:border-slate-700 hover:bg-primary/10 dark:hover:bg-primary/15": !isSelected,
          "bg-blue-100 dark:bg-blue-900 transition-colors duration-1000 ease-out": isNew, // Animation for new ticket
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
                {companyNameForLogo || 'N/A'} 
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
                  variant={getEstadoBadgeVariant(ticket.estado)} 
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
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.ABIERTO)}>Abierto</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.EN_PROGRESO)}>En Progreso</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.CERRADO)}>Cerrado</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.PENDIENTE_TERCERO)}>Pendiente (Tercero)</Button> 
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.PENDIENTE_CLIENTE)}>Pendiente (Cliente)</Button> 
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.RESUELTO)}>Resuelto</Button> 
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange(EstadoTicket.CANCELADO)}>Cancelado</Button> 
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
          <div className="sm:col-span-2"><strong>Creado:</strong> {fechaCreacionDateFormatted}</div> 
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

export default SingleTicketItemCard; // Removed React.memo
