// RUTA: src/components/tickets/TicketDescriptionCard.tsx
'use client';

import React from 'react';
import {
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils'; 
// Eliminar la importación de ExpandableText, ya no se usa aquí

interface TicketDescriptionCardProps {
  description?: string | null;
  creatorName?: string | null;
  isPanelOpen?: boolean; // Para controlar la altura del contenido interno cuando el AccordionContent está abierto
}

const TicketDescriptionCard: React.FC<TicketDescriptionCardProps> = ({
  description,
  creatorName,
  isPanelOpen = false,
}) => {
  return (
    <> {/* Fragmento para envolver el Trigger y Content */}
      <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
        <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Descripción Detallada</span>
      </AccordionTrigger>
      {/* El AccordionContent gestiona la animación de colapso */}
      <AccordionContent className="px-4 pb-4 pt-0"> 
        <div 
          className={cn(
            "text-xs text-muted-foreground whitespace-pre-wrap pr-2 transition-all duration-300 ease-in-out",
            {
              "max-h-[8em] overflow-y-auto": isPanelOpen, // Aproximadamente 5 líneas (1.5em/línea * 5 = 7.5em, ajustamos a 8em)
              "max-h-0 overflow-hidden": !isPanelOpen // Completamente oculto si no está abierto
            }
          )}
        >
          <p>{description || 'No se proporcionó descripción detallada.'}</p>
          {creatorName && (
              <p className="text-muted-foreground text-[10px] mt-2">por: {creatorName}</p>
          )}
        </div>
      </AccordionContent>
    </>
  );
};

export default TicketDescriptionCard;
