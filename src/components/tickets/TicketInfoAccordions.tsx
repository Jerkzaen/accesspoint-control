// RUTA: src/components/tickets/TicketInfoAccordions.tsx
'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Ticket } from '@/types/ticket'; // Importa tu tipo Ticket
import { cn } from '@/lib/utils'; // Importa cn para combinar clases

interface TicketInfoAccordionsProps {
  selectedTicket: Ticket | null;
  openInfoSections: string[];
  setOpenInfoSections: (values: string[]) => void;
  isBitacoraExpanded: boolean;
  fechaCreacionFormatted: string; // Recibir la fecha formateada como prop
}

const TicketInfoAccordions: React.FC<TicketInfoAccordionsProps> = ({
  selectedTicket,
  openInfoSections,
  setOpenInfoSections,
  isBitacoraExpanded,
  fechaCreacionFormatted,
}) => {
  if (!selectedTicket) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2 flex-shrink-0 transition-all duration-300 ease-in-out")}>
      <Accordion
        type="multiple"
        className="w-full space-y-2"
        value={openInfoSections}
        onValueChange={setOpenInfoSections}
      >
        <AccordionItem value="info-ticket" className="border rounded-lg shadow-none bg-muted/10 overflow-hidden">
          <AccordionTrigger className="px-3 py-2 text-sm font-semibold hover:no-underline flex items-center justify-between gap-1.5 rounded-t-lg min-h-0 h-10">
            <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-primary" />Información del Ticket</span>
          </AccordionTrigger>
          <AccordionContent className="p-3 pt-0">
            <div className="space-y-1 text-xs leading-tight">
              <p><strong>Título:</strong> {selectedTicket.titulo}</p>
              <p><strong>Tipo Incidente:</strong> {selectedTicket.tipoIncidente}</p>
              <p><strong>Prioridad:</strong> {selectedTicket.prioridad}</p>
              <p><strong>Creado:</strong> {fechaCreacionFormatted}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="info-solicitante" className="border rounded-lg shadow-none bg-muted/10 overflow-hidden">
          <AccordionTrigger className="px-3 py-2 text-sm font-semibold hover:no-underline flex items-center justify-between gap-1.5 rounded-t-lg min-h-0 h-10">
            <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-primary" />Información del Solicitante</span>
          </AccordionTrigger>
          <AccordionContent className="p-3 pt-0">
            <div className="space-y-1 text-xs leading-tight">
              <p><strong>Nombre:</strong> {selectedTicket.solicitanteNombre}</p>
              {selectedTicket.solicitanteTelefono && <p><strong>Teléfono:</strong> {selectedTicket.solicitanteTelefono}</p>}
              {selectedTicket.solicitanteCorreo && <p><strong>Correo:</strong> {selectedTicket.solicitanteCorreo}</p>}
              {selectedTicket.empresaCliente?.nombre && <p><strong>Empresa:</strong> {selectedTicket.empresaCliente.nombre}</p>}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default TicketInfoAccordions;

