// RUTA: src/components/tickets/TicketDescriptionCard.tsx
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketDescriptionCardProps {
  selectedTicketDescription?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  creatorName?: string | null;
  className?: string;
  previewMode?: boolean;
  centralHeight?: number;
}

const TicketDescriptionCard: React.FC<TicketDescriptionCardProps> = ({
  selectedTicketDescription,
  isOpen,
  onToggle,
  creatorName,
  className,
  previewMode = false,
  centralHeight
}) => {
  // Calcular alto máximo dinámico para el preview (por ejemplo, 40% del área central)
  const dynamicMaxHeight = previewMode && centralHeight ? Math.max(80, Math.floor(centralHeight * 0.4)) : undefined;
  return (
    <Card className={cn("inline-flex flex-col flex-shrink-0 w-full transition-all duration-300 ease-in-out", { "flex-1 min-h-0 flex flex-col": !previewMode }, className)}>
      <button type="button" className="w-full flex items-center justify-between px-4 py-3 border-b bg-white/80 hover:bg-muted/20 transition-colors cursor-pointer focus:outline-none" onClick={onToggle} aria-expanded={isOpen}>
        <span className="text-sm font-semibold flex items-center gap-1.5">
          <Info className="h-4 w-4 text-primary" /> Descripción Detallada
        </span>
        <span className="ml-2">
          {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </span>
      </button>
      {isOpen && (
        <div className={cn("w-full px-4 pt-2 pb-3 bg-white/80", { "overflow-y-auto": previewMode })} style={previewMode ? { maxHeight: dynamicMaxHeight } : {}}>
          <div className={cn("text-xs space-y-1 break-words whitespace-pre-line w-full", { "overflow-y-auto h-full": !previewMode })}>
            <p>{selectedTicketDescription || 'Sin descripción.'}</p>
            {creatorName && (
              <p className="text-muted-foreground text-[10px] mt-2">por: {creatorName}</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TicketDescriptionCard;
