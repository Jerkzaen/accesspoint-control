// RUTA: src/components/tickets/TicketInfoAccordions.tsx
// Este archivo debería ser renombrado a algo como TicketInfoTicketContent.tsx
// para reflejar que solo contiene el contenido del acordeón "Información del Ticket".
'use client';

import React from 'react';
import { Ticket } from '@/types/ticket';

interface TicketInfoTicketContentProps { // Interfaz específica para el contenido del Ticket
  selectedTicket: Ticket;
  fechaCreacionFormatted: string;
}

const TicketInfoTicketContent: React.FC<TicketInfoTicketContentProps> = ({
  selectedTicket,
  fechaCreacionFormatted,
}) => {
  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
      <p><strong>Tipo Incidente:</strong> {selectedTicket.tipoIncidente}</p>
      <p><strong>Prioridad:</strong> {selectedTicket.prioridad}</p>
      <p><strong>Creado:</strong> {fechaCreacionFormatted}</p>
    </div>
  );
};

export default TicketInfoTicketContent;
