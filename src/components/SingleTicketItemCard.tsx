'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  // CardFooter, // Ya no se usa en este diseño, se puede quitar si no hay planes inmediatos
} from '@/components/ui/card';

// CORRECCIÓN: Importamos la interfaz Ticket desde el archivo centralizado
import { Ticket } from '@/types/ticket'; // Asegúrate que la ruta sea correcta

interface SingleTicketItemCardProps {
  ticket: Ticket; // Ahora usa el tipo Ticket importado
  onSelectTicket: (ticket: Ticket) => void; // La función también espera el tipo Ticket importado
  isSelected: boolean; // Para resaltar la tarjeta seleccionada
}

export default function SingleTicketItemCard({ ticket, onSelectTicket, isSelected }: SingleTicketItemCardProps) {
  // Formatear la fecha de creación
  const createdAtDate = new Date(ticket.createdAt).toLocaleString('es-CL', {
    dateStyle: 'medium', // ej. 31 may. 2025
    timeStyle: 'short',  // ej. 21:36
  });

  // Determinar el color de la prioridad
  let prioridadColor = 'text-green-600 dark:text-green-400'; // Default para baja
  if (ticket.prioridad === 'media') {
    prioridadColor = 'text-yellow-600 dark:text-yellow-400';
  } else if (ticket.prioridad === 'alta' || ticket.prioridad === 'urgente') {
    prioridadColor = 'text-red-600 dark:text-red-400';
  }
  
  return (
    <Card
      className={`mb-4 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'}`}
      onClick={() => onSelectTicket(ticket)}
    >
      <CardHeader className="pb-3 pt-4"> {/* Ajuste de padding */}
        <div className="flex justify-between items-start gap-2"> {/* Añadido gap */}
          <div>
            <CardTitle className="text-lg leading-tight">Caso #{ticket.nroCaso}</CardTitle>
            <CardDescription className="text-xs mt-1">{ticket.empresa} - {ticket.tipo} - {ticket.ubicacion}</CardDescription>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
            ticket.estado === 'Abierto' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' : 
            ticket.estado === 'Cerrado' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' : 
            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'
          }`}>
            {ticket.estado}
          </span>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-3 pt-0 pb-4"> {/* Ajuste de padding y space */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-border pt-3 mt-2"> {/* Línea divisoria y espaciado */}
          <p><strong>Técnico:</strong> {ticket.tecnico}</p>
          <p className="sm:col-span-2"><strong>Creado:</strong> {createdAtDate}</p>
          <p><strong>Prioridad:</strong> <span className={`font-medium ${prioridadColor}`}>{ticket.prioridad ? ticket.prioridad.toUpperCase() : 'N/A'}</span></p>
          <p><strong>Contacto:</strong> {ticket.contacto}</p>

        </div>
        <div>
          <p className="font-semibold text-xs mt-2">Descripción:</p>
          <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md min-h-[60px] border border-border"> {/* Más padding, altura mínima y borde */}
            {ticket.descripcion ? ticket.descripcion : <span className="italic text-gray-500 dark:text-gray-400">No hay descripción proporcionada.</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}