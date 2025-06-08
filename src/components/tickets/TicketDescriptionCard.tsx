// RUTA: src/components/tickets/TicketDescriptionCard.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import ExpandableText from '@/components/ui/ExpandableText';
import { cn } from '@/lib/utils'; // Importa cn para combinar clases

interface TicketDescriptionCardProps {
  selectedTicketDescription?: string | null;
  isBitacoraExpanded: boolean;
}

const TicketDescriptionCard: React.FC<TicketDescriptionCardProps> = ({
  selectedTicketDescription,
  isBitacoraExpanded,
}) => {
  return (
    // Card para la descripción detallada:
    // Controlado con max-h y opacity para una transición suave, y se oculta con 'hidden' cuando la bitácora está expandida
    <Card
      className={cn(
        "p-3 shadow-none border bg-muted/10 flex-shrink-0 transition-all duration-300 ease-in-out",
        { "max-h-0 overflow-hidden opacity-0": isBitacoraExpanded }, // Si bitácora expandida, contrae a 0 y oculta
        { "max-h-full opacity-100": !isBitacoraExpanded } // Si bitácora colapsada, permite su altura completa y visibilidad
      )}
    >
      <CardHeader className="p-0 pb-1.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary" /> Descripción Detallada
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 text-xs max-h-40 overflow-y-auto"> {/* max-h y overflow-y-auto para scroll interno */}
        <ExpandableText text={selectedTicketDescription} initialLines={2} showFade={true} />
      </CardContent>
    </Card>
  );
};

export default TicketDescriptionCard;
