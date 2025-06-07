// RUTA: src/components/tickets/TicketListItem.tsx
'use client';

// Importaciones de componentes UI de shadcn/ui
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Importaciones de Next.js y React
import Image from 'next/image';
import React, { useState } from 'react';

// Importaciones de iconos
import { Loader2, Hash } from 'lucide-react';

// --- INICIO DE LA CORRECCIÓN: IMPORTAR TIPOS REALES ---
// Importar la interfaz Ticket y otras interfaces relacionadas desde tu archivo de tipos.
// ¡ASEGÚRATE DE QUE LA RUTA A TU ARCHIVO DE TIPOS ES CORRECTA!
import { Ticket, EmpresaClienteRelacion, UbicacionRelacion, UsuarioBasico } from '@/types/ticket';

// Importar los enums de Prisma directamente
import { EstadoTicket, PrioridadTicket } from '@prisma/client';
// --- FIN DE LA CORRECCIÓN: IMPORTAR TIPOS REALES ---

// Importaciones de funciones de utilidad (asegúrate de que lib/utils.ts las exporta)
import { cn, formatTicketNumber, getCompanyLogoUrl } from '@/lib/utils';

// La interfaz de props para el componente TicketListItem
interface TicketListItemProps {
  ticket: Ticket | undefined | null;
  onSelectTicket: (ticket: Ticket) => void;
  onTicketUpdatedInList: (updatedTicket: Ticket) => void;
  isSelected: boolean;
  isNew?: boolean;
}

// El componente se exporta por defecto con su nuevo nombre, más descriptivo.
export default function TicketListItem({
  ticket,
  onSelectTicket,
  onTicketUpdatedInList,
  isSelected,
  isNew = false
}: TicketListItemProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Manejo de caso donde el ticket es nulo o indefinido
  if (!ticket) {
    return (
      <Card className="mb-3 p-4 border-destructive bg-destructive/10 rounded-lg">
        <p className="text-destructive-foreground text-sm">Error al cargar datos del ticket.</p>
      </Card>
    );
  }

  // Formateo de la fecha de creación
  const fechaCreacionDateObj = new Date(ticket.fechaCreacion);
  const fechaCreacionDateFormatted = fechaCreacionDateObj.toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  // Determina la variante de la insignia de prioridad basada en el enum PrioridadTicket
  let prioridadVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  switch (ticket.prioridad) {
    case PrioridadTicket.BAJA: prioridadVariant = "secondary"; break;
    case PrioridadTicket.MEDIA: prioridadVariant = "default"; break;
    case PrioridadTicket.ALTA: prioridadVariant = "outline"; break;
    case PrioridadTicket.URGENTE: prioridadVariant = "destructive"; break;
    default: prioridadVariant = "outline"; // Variante por defecto si la prioridad no coincide
  }

  // Determina la variante de la insignia de estado basada en el enum EstadoTicket
  const getEstadoBadgeVariant = (estado: EstadoTicket): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) {
      case EstadoTicket.ABIERTO: return "default";
      case EstadoTicket.CERRADO: return "destructive";
      case EstadoTicket.EN_PROGRESO: return "secondary";
      case EstadoTicket.PENDIENTE_TERCERO: return "outline";
      case EstadoTicket.PENDIENTE_CLIENTE: return "outline";
      case EstadoTicket.RESUELTO: return "default";
      case EstadoTicket.CANCELADO: return "destructive";
      default: return "outline"; // Variante por defecto si el estado no coincide
    }
  };

  // Formateo del número de caso y obtención del URL del logo de la empresa
  const formattedNumeroCaso = formatTicketNumber(ticket.numeroCaso);
  const companyLogoUrl = getCompanyLogoUrl(ticket.empresaCliente?.nombre);

  // Manejador para cambiar el estado del ticket vía API
  const handleStatusChange = async (newStatus: EstadoTicket) => {
    if (!ticket) return; // Salir si no hay ticket
    setIsUpdatingStatus(true); // Activar el indicador de carga
    try {
      // Simula una llamada a la API para actualizar el estado del ticket
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }), // Envía el nuevo estado
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del ticket');
      }

      const updatedTicketData: Ticket = await response.json(); // Recibe los datos actualizados
      onTicketUpdatedInList(updatedTicketData); // Notifica al componente padre sobre la actualización
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setIsUpdatingStatus(false); // Desactivar el indicador de carga
    }
  };

  return (
    <Card
      // Clases condicionales para el estilo de la tarjeta (seleccionado, hover, nuevo)
      className={cn("mb-3 cursor-pointer transition-all duration-150 rounded-lg", "hover:shadow-xl",
        {
          "shadow-lg bg-primary/15 dark:bg-primary/25": isSelected, // Estilo si está seleccionado
          "shadow-md dark:border-slate-700 hover:bg-primary/10 dark:hover:bg-primary/15": !isSelected, // Estilo si no está seleccionado
          "animate-pulse-bg": isNew // Animación si es un ticket nuevo
        }
      )}
      onClick={() => onSelectTicket(ticket)} // Manejador de clic para seleccionar el ticket
    >
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
        <div className="flex justify-between items-start gap-2">
          {/* Título del Ticket */}
          <CardTitle className="text-sm sm:text-base leading-tight flex-grow truncate pr-4">
            {ticket.titulo}
          </CardTitle>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 sm:flex-row sm:items-center sm:gap-1.5">
            {/* Logo de la empresa o nombre si no hay logo */}
            {companyLogoUrl ? (
              <Badge variant="secondary" className="w-12 p-0 flex items-center justify-center overflow-hidden rounded-md h-6">
                <Image
                  src={companyLogoUrl}
                  alt={`${ticket.empresaCliente?.nombre || 'Empresa'} logo`}
                  width={48}
                  height={24}
                  className="object-cover w-full h-full"
                />
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-6 px-2.5 text-xs">
                {ticket.empresaCliente?.nombre || 'N/A'}
              </Badge>
            )}
            {/* Número de caso del ticket */}
            <Badge variant="secondary" className="h-6 px-2.5 text-xs">
              <Hash size={12} className="mr-0.5" />
              {formattedNumeroCaso}
            </Badge>
            {/* Popover para cambiar el estado del ticket */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={getEstadoBadgeVariant(ticket.estado)}
                  className="h-6 px-2.5 text-xs"
                  size="sm"
                  disabled={isUpdatingStatus} // Deshabilitar si se está actualizando
                >
                  {ticket.estado}
                  {isUpdatingStatus && <Loader2 className="ml-1.5 h-3 w-3 animate-spin" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <p className="text-sm font-semibold mb-2">Cambiar Estado</p>
                <div className="flex flex-col gap-1">
                  {/* Opciones para cambiar el estado */}
                  {Object.values(EstadoTicket).map(status => (
                    <Button
                      key={status}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(status); }}
                    >
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
          {/* Detalles del ticket */}
          <div><strong>Tipo Incidente:</strong> {ticket.tipoIncidente || 'N/A'}</div>
          <div><strong>Ubicación:</strong> {ticket.ubicacion?.nombreReferencial || ticket.ubicacion?.direccionCompleta || 'N/A'}</div>
          <div><strong>Técnico:</strong> {ticket.tecnicoAsignado?.name || ticket.tecnicoAsignado?.email || 'No asignado'}</div>
          <div><strong>Contacto:</strong> {ticket.solicitanteNombre || 'N/A'}</div>
          <div className="sm:col-span-2"><strong>Creado:</strong> {fechaCreacionDateFormatted}</div>
          <div>
            <strong>Prioridad:</strong>{' '}
            <Badge
              variant={prioridadVariant}
              className={cn("px-2 py-0.5 text-xs h-auto")}
            >
              {ticket.prioridad?.toUpperCase() || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
