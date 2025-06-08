// RUTA: src/components/tickets/TicketDescriptionCard.tsx
'use client';

import React from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Info } from 'lucide-react';

interface TicketDescriptionCardProps {
  description?: string | null;
  creatorName?: string | null;
}

const TicketDescriptionCard: React.FC<TicketDescriptionCardProps> = ({
  description,
  creatorName,
}) => {
  return (
    <AccordionItem value="descripcion-panel" className="border rounded-lg bg-background shadow-sm">
      <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
        <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Descripción Detallada</span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-0">
        <div className="max-h-32 min-h-[2rem] overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap pr-2">
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
