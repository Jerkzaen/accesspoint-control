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
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

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

  const getEstadoBadgeVariant = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado?.toLowerCase()) {
      case 'abierto': return "default";
      case 'cerrado': return "destructive";
      case 'en progreso': return "secondary";
      case 'pendiente': return "outline";
      default: return "outline";
    }
  };

  const formattedNumeroCaso = formatTicketNumber(ticket.numeroCaso);
  const companyLogoUrl = getCompanyLogoUrl(ticket.empresa);

  const handleStatusChange = async (newStatus: string) => {
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

  // Definimos una altura común para los badges
  const commonBadgeHeight = "h-6"; // 24px
  const commonBadgeTextSize = "text-xs";
  const commonBadgePaddingX = "px-2.5"; // Padding horizontal

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
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1 sm:gap-2">
          <div className="flex-grow">
            <CardTitle className="text-sm sm:text-base leading-tight">
              {ticket.titulo}
            </CardTitle>
          </div>
          {/* Contenedor de Badges en la esquina superior derecha */}
          <div className="flex flex-wrap sm:flex-nowrap gap-1.5 items-center mt-1 sm:mt-0">
            <Badge 
              variant="secondary"
              className={cn("whitespace-nowrap", commonBadgeTextSize, commonBadgeHeight, commonBadgePaddingX)}
            >
              Caso #{formattedNumeroCaso}
            </Badge>

            {companyLogoUrl ? (
              <Badge 
                variant="secondary" 
                // Ancho fijo para el logo, p-0 para que la imagen lo cubra todo.
                // overflow-hidden para recortar la imagen si no encaja perfectamente.
                className={cn("w-12 p-0 flex items-center justify-center overflow-hidden rounded-md", commonBadgeHeight)}
              >
                <Image 
                  src={companyLogoUrl} 
                  alt={`${ticket.empresa} logo`} 
                  width={48} // Corresponde a w-12
                  height={24} // Corresponde a h-6
                  className="object-cover w-full h-full" // object-cover es clave aquí
                />
              </Badge>
            ) : (
              <Badge 
                variant="secondary" 
                className={cn("whitespace-nowrap", commonBadgeTextSize, commonBadgeHeight, commonBadgePaddingX)}
              >
                {ticket.empresa}
              </Badge>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={getEstadoBadgeVariant(ticket.estado)}
                  className={cn("whitespace-nowrap cursor-pointer flex items-center", commonBadgeTextSize, commonBadgeHeight, commonBadgePaddingX)}
                  size="sm" // Usar size="sm" de Button puede ayudar a controlar mejor el padding si es necesario
                  disabled={isUpdatingStatus}
                >
                  {ticket.estado || 'N/A'}
                  {isUpdatingStatus ? <Loader2 className="ml-1.5 h-3 w-3 animate-spin" /> : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <p className="text-sm font-semibold mb-2">Cambiar Estado</p>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange('Abierto')}>Abierto</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange('En Progreso')}>En Progreso</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange('Cerrado')}>Cerrado</Button>
                  <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => handleStatusChange('Pendiente')}>Pendiente</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-1.5 pt-2 pb-3 px-4 sm:px-5", commonBadgeTextSize)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          <div><strong>Tipo Incidente:</strong> {ticket.tipoIncidente}</div>
          <div><strong>Ubicación:</strong> {ticket.ubicacion}</div>
          <div><strong>Técnico:</strong> {ticket.tecnicoAsignado}</div>
          <div><strong>Contacto:</strong> {ticket.solicitante}</div>
          <div className="sm:col-span-2"><strong>Creado:</strong> {fechaCreacionDate}</div>
          <div>
            <strong>Prioridad:</strong>{' '}
            <Badge 
              variant={prioridadVariant} 
              className={cn(commonBadgeTextSize, commonBadgeHeight, "px-2 py-0.5")} // Ajustar padding si es necesario
            >
              {ticket.prioridad?.toUpperCase() || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
