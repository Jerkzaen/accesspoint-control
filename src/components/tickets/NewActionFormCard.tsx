// RUTA: src/components/tickets/NewActionFormCard.tsx
'use client';

import React from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info, Loader2 } from 'lucide-react';

interface NewActionFormCardProps {
  newActionDescription: string;
  setNewActionDescription: (desc: string) => void;
  isProcessingAction: boolean;
  addAction: () => Promise<void>;
  cardRef: React.RefObject<HTMLDivElement>; // Referencia para medir la altura
}

const NewActionFormCard: React.FC<NewActionFormCardProps> = ({
  newActionDescription,
  setNewActionDescription,
  isProcessingAction,
  addAction,
  cardRef,
}) => {
  return (
    // Contenedor FIJO para el formulario de nueva acción. Siempre visible en la parte inferior.
    // Se añade la referencia para medir su altura
    <div ref={cardRef} className="flex-shrink-0 pt-2 border-t mt-auto">
      <Card className="p-3 shadow-none border bg-muted/10">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5 mb-2">
          <Info className="h-3.5 w-3.5 text-primary" /> Agregar nueva acción
        </CardTitle>
        <Textarea
          id="newAction"
          className="mt-1 w-full text-xs"
          value={newActionDescription}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewActionDescription(e.target.value)}
          placeholder="Describe la acción realizada..."
          rows={2}
          disabled={isProcessingAction}
        />
        <Button
          className="mt-2 w-full h-8 text-sm"
          onClick={addAction}
          disabled={isProcessingAction || !newActionDescription.trim()}
        >
          {isProcessingAction ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Acción'}
        </Button>
      </Card>
    </div>
  );
};

export default NewActionFormCard;
