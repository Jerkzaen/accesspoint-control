// RUTA: src/components/tickets/TicketDescriptionCard.tsx
'use client';

import React from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils'; // Asegúrate de importar cn para las clases condicionales

interface TicketDescriptionCardProps {
  description?: string | null;
  creatorName?: string | null;
  isMinimizedForBitacora?: boolean; // Nueva prop para controlar la minimización
}

const TicketDescriptionCard: React.FC<TicketDescriptionCardProps> = ({
  description,
  creatorName,
  isMinimizedForBitacora = false, // Valor por defecto: false
}) => {
  return (
    <AccordionItem value="descripcion-panel" className="border rounded-lg bg-background shadow-sm">
      <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
        <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Descripción Detallada</span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-0">
        <div 
          className={cn(
            "text-xs text-muted-foreground whitespace-pre-wrap pr-2 transition-all duration-300 ease-in-out",
            {
              "max-h-32 min-h-[2rem] overflow-y-auto": !isMinimizedForBitacora, // Altura original si no está minimizado
              "max-h-[6em] min-h-[2rem] overflow-y-auto": isMinimizedForBitacora, // Aprox. 4 líneas (1.5em/línea * 4) cuando está minimizado
            }
          )}
        >
          <p>{description || 'No se proporcionó descripción detallada.'}</p>
          {creatorName && (
              <p className="text-muted-foreground text-[10px] mt-2">por: {creatorName}</p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TicketDescriptionCard;
