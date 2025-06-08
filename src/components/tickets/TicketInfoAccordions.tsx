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
import { Info } from 'lucide-react';
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
    return null; // No renderizar si no hay ticket seleccionado
  }

  return (
    // Contenedor de Acordeones e Descripción
    // Controlado con max-h y opacity para una transición suave, sin hidden completo
    <div
      className={cn(
        "flex flex-col gap-2 flex-shrink-0 transition-all duration-300 ease-in-out",
        { "max-h-0 overflow-hidden opacity-0": isBitacoraExpanded }, // Si bitácora expandida, contrae a 0 y oculta
        { "max-h-full opacity-100": !isBitacoraExpanded } // Si bitácora colapsada, permite su altura completa y visibilidad
      )}
    >
      <Accordion type="multiple" className="w-full space-y-2" value={openInfoSections} onValueChange={setOpenInfoSections}>
        <InfoAccordionItem title="Información del Ticket" value="info-ticket">
          <p><strong>Título:</strong> {selectedTicket.titulo}</p>
          <p><strong>Tipo Incidente:</strong> {selectedTicket.tipoIncidente}</p>
          <p><strong>Prioridad:</strong> {selectedTicket.prioridad}</p>
          <p><strong>Creado:</strong> {fechaCreacionFormatted}</p>
        </InfoAccordionItem>
        <InfoAccordionItem title="Información del Solicitante" value="info-solicitante">
          <p><strong>Nombre:</strong> {selectedTicket.solicitanteNombre}</p>
          {selectedTicket.solicitanteTelefono && <p><strong>Teléfono:</strong> {selectedTicket.solicitanteTelefono}</p>}
          {selectedTicket.solicitanteCorreo && <p><strong>Correo:</strong> {selectedTicket.solicitanteCorreo}</p>}
          {selectedTicket.empresaCliente?.nombre && <p><strong>Empresa:</strong> {selectedTicket.empresaCliente.nombre}</p>}
        </InfoAccordionItem>
      </Accordion>
    </div>
  );
};

export default TicketInfoAccordions;

// Componente auxiliar InfoAccordionItem (se mantiene aquí, ya que es interno a la lógica de acordeones)
interface InfoAccordionItemProps {
  title: string;
  value: string;
  children: React.ReactNode;
}

const InfoAccordionItem: React.FC<InfoAccordionItemProps> = ({ title, value, children }) => (
  <AccordionItem value={value} className="border-none rounded-lg shadow-none bg-muted/10">
    <AccordionTrigger className="px-3 py-2 text-sm font-semibold hover:no-underline flex items-center justify-between gap-1.5 rounded-t-lg">
      <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-primary" />{title}</span>
    </AccordionTrigger>
    <AccordionContent className="p-3 pt-0"><div className="space-y-1 text-xs leading-tight">{children}</div></AccordionContent>
  </AccordionItem>
);

