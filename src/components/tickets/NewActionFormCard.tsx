// RUTA: src/components/tickets/NewActionFormCard.tsx
'use client';

import React from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info, Loader2 } from 'lucide-react';

// Se define la interfaz de props sin 'cardRef'
interface NewActionFormCardProps {
  newActionDescription: string;
  setNewActionDescription: (desc: string) => void;
  isProcessingAction: boolean;
  addAction: () => Promise<void>;
}

const NewActionFormCard: React.FC<NewActionFormCardProps> = ({
  newActionDescription,
  setNewActionDescription,
  isProcessingAction,
  addAction,
}) => {
  return (
    // Se elimina el div contenedor y la ref, ya que no son necesarios
    <Card className="p-3 shadow-none border-0 bg-transparent">
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
  );
};

export default NewActionFormCard;
