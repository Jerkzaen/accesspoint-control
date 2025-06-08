// RUTA: src/components/tickets/TicketInfoAccordions.tsx
'use client';

import React from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Ticket } from '@/types/ticket';
import { Info } from 'lucide-react';

// Props simplificadas.
interface TicketInfoAccordionsProps {
  selectedTicket: Ticket;
  fechaCreacionFormatted: string;
}

const TicketInfoAccordions: React.FC<TicketInfoAccordionsProps> = ({
  selectedTicket,
  fechaCreacionFormatted,
}) => {
  return (
    <>
      <AccordionItem value="info-ticket" className="border rounded-lg bg-background shadow-sm">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
          <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Información del Ticket</span>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <p><strong>Tipo Incidente:</strong> {selectedTicket.tipoIncidente}</p>
            <p><strong>Prioridad:</strong> {selectedTicket.prioridad}</p>
            <p><strong>Creado:</strong> {fechaCreacionFormatted}</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="info-solicitante" className="border rounded-lg bg-background shadow-sm">
        <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
           <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Información del Solicitante</span>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <p><strong>Nombre:</strong> {selectedTicket.solicitanteNombre}</p>
            {selectedTicket.solicitanteTelefono && <p><strong>Teléfono:</strong> {selectedTicket.solicitanteTelefono}</p>}
            {selectedTicket.solicitanteCorreo && <p><strong>Correo:</strong> {selectedTicket.solicitanteCorreo}</p>}
            {selectedTicket.empresaCliente?.nombre && <p><strong>Empresa:</strong> {selectedTicket.empresaCliente.nombre}</p>}
          </div>
        </AccordionContent>
      </AccordionItem>
    </>
  );
};

export default TicketInfoAccordions;
