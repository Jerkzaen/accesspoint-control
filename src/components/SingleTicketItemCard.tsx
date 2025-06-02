// src/components/SingleTicketItemCard.tsx
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

interface SingleTicketItemCardProps {
  ticket: Ticket;
  onSelectTicket: (ticket: Ticket) => void;
  isSelected: boolean;
}

export default function SingleTicketItemCard({ ticket, onSelectTicket, isSelected }: SingleTicketItemCardProps) {
  const createdAtDate = new Date(ticket.createdAt).toLocaleString('es-CL', {
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // hour12: true, 
  });

  let prioridadVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  
  switch (ticket.prioridad?.toLowerCase()) {
    case 'baja':
      prioridadVariant = "secondary";
      break;
    case 'media':
      prioridadVariant = "default"; 
      break;
    case 'alta':
      prioridadVariant = "outline"; 
      // Para 'alta', podrías considerar un color personalizado si 'outline' no es suficiente.
      // Ejemplo: className="bg-yellow-100 text-yellow-700 border-yellow-300"
      break;
    case 'urgente':
      prioridadVariant = "destructive"; 
      break;
    default:
      prioridadVariant = "outline";
  }
  
  let estadoVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  switch (ticket.estado?.toLowerCase()) {
    case 'abierto':
      estadoVariant = "default"; // Asumiendo que 'default' (primary) es un color distintivo como azul o verde.
      break;
    case 'cerrado':
      estadoVariant = "destructive";
      break;
    case 'en progreso':
      estadoVariant = "secondary"; // Podría ser un amarillo o un color que indique actividad.
      break;
    case 'pendiente':
      estadoVariant = "outline"; 
      break;
  }


  return (
    <Card
      className={`mb-3 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg ${isSelected ? 'ring-2 ring-primary shadow-lg dark:ring-primary-foreground' : 'shadow-md dark:border-slate-700'}`}
      onClick={() => onSelectTicket(ticket)}
    >
      <CardHeader className="pb-2 pt-4 px-4 sm:px-5"> {/* Aumentado pt y px ligeramente */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1 sm:gap-2">
          <div className="flex-grow">
            {/* Aumentado tamaño de fuente para el título */}
            <CardTitle className="text-base sm:text-lg md:text-xl leading-tight">
              Caso #{ticket.nroCaso} - {ticket.empresa}
            </CardTitle>
            {/* Aumentado tamaño de fuente para la descripción */}
            <CardDescription className="text-xs sm:text-sm mt-0.5"> 
              {ticket.tipo} - {ticket.ubicacion}
            </CardDescription>
          </div>
          {/* Asegurar que el Badge sea legible */}
          <Badge variant={estadoVariant} className="mt-1 sm:mt-0 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1 h-auto sm:h-6">
            {ticket.estado || 'N/A'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pt-2 pb-3 px-4 sm:px-5"> {/* Aumentado padding y tamaño de fuente base */}
        {/* Aumentado tamaño de fuente para los detalles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm pt-2 mt-1">
          <div><strong>Técnico:</strong> {ticket.tecnico}</div>
          <div><strong>Contacto:</strong> {ticket.contacto}</div>
          <div className="sm:col-span-2"><strong>Creado:</strong> {createdAtDate}</div>
          <div>
            <strong>Prioridad:</strong>{' '}
            {/* Ajustado Badge de prioridad para mejor legibilidad */}
            <Badge variant={prioridadVariant} className="px-2 py-0.5 text-xs sm:text-sm h-auto">
              {ticket.prioridad?.toUpperCase() || 'N/A'}
            </Badge>
          </div>
        </div>
        {ticket.descripcion && (
          <div className="mt-2.5"> {/* Aumentado margen superior */}
            <p className="font-semibold text-xs sm:text-sm">Descripción:</p> {/* Aumentado tamaño de fuente */}
            {/* Aumentado tamaño de fuente y padding para el bloque de descripción */}
            <div className="mt-1 text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-md border border-border min-h-[48px]">
              {ticket.descripcion}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
