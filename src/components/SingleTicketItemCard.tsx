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
import { Badge } from '@/components/ui/badge'; // Para el estado

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
    // hour12: true, // Opcional, para formato AM/PM
  });

  let prioridadVariant: "default" | "secondary" | "destructive" | "outline" = "default";
  let prioridadText = ticket.prioridad?.toUpperCase() || 'N/A';

  switch (ticket.prioridad?.toLowerCase()) {
    case 'baja':
      prioridadVariant = "secondary"; // Un color suave para baja
      break;
    case 'media':
      prioridadVariant = "default"; // Azul por defecto para media
      break;
    case 'alta':
      prioridadVariant = "outline"; // Naranja/amarillo (requiere color personalizado o ajuste)
                                    // Por ahora, outline para diferenciar. Podrías usar text-yellow-600 bg-yellow-100
      prioridadText = `ALTA - ${ticket.prioridad.toUpperCase()}`;
      break;
    case 'urgente':
      prioridadVariant = "destructive"; // Rojo para urgente
      break;
    default:
      prioridadVariant = "outline";
  }
  
  let estadoVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  switch (ticket.estado?.toLowerCase()) {
    case 'abierto':
      estadoVariant = "default"; // Verde (si tu primary es verde) o un color específico
      break;
    case 'cerrado':
      estadoVariant = "destructive";
      break;
    case 'en progreso':
      estadoVariant = "secondary"; // Amarillo/naranja
      break;
    case 'pendiente':
      estadoVariant = "outline"; // Gris
      break;
  }


  return (
    <Card
      className={`mb-3 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg ${isSelected ? 'ring-2 ring-primary shadow-lg dark:ring-primary-foreground' : 'shadow-md dark:border-slate-700'}`}
      onClick={() => onSelectTicket(ticket)}
    >
      <CardHeader className="pb-2 pt-3 px-4"> {/* Padding ajustado */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1 sm:gap-2">
          <div className="flex-grow">
            <CardTitle className="text-base md:text-lg leading-tight">
              Caso #{ticket.nroCaso} - {ticket.empresa}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">{ticket.tipo} - {ticket.ubicacion}</CardDescription>
          </div>
          <Badge variant={estadoVariant} className="mt-1 sm:mt-0 whitespace-nowrap text-xs px-2 py-0.5 h-5">
            {ticket.estado || 'N/A'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pt-2 pb-3 px-4"> {/* Padding ajustado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs pt-2 mt-1">
          <div><strong>Técnico:</strong> {ticket.tecnico}</div>
          <div><strong>Contacto:</strong> {ticket.contacto}</div>
          <div className="sm:col-span-2"><strong>Creado:</strong> {createdAtDate}</div>
          <div>
            <strong>Prioridad:</strong>{' '}
            <Badge variant={prioridadVariant} className="px-1.5 py-0 text-[10px] h-4">
              {ticket.prioridad?.toUpperCase() || 'N/A'}
            </Badge>
          </div>
        </div>
        {ticket.descripcion && (
          <div className="mt-2">
            <p className="font-semibold text-xs">Descripción:</p>
            <div className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-border min-h-[40px]">
              {ticket.descripcion}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
