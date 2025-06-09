// RUTA: src/components/tickets/NewActionFormCard.tsx
'use client';

import React from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input'; // Importar Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Importar Select
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Importar Tabs

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
    <Card className="p-3 shadow-none border-0 bg-transparent">
      {/* Panel de búsqueda y filtros para las acciones */}
      <div className="space-y-2 mb-4">
          <Input placeholder="Buscar en bitácora..." className="h-8 text-xs" />
          <div className="flex gap-2">
              <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas las categorías" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem></SelectContent></Select>
              <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todo el tiempo" /></SelectTrigger><SelectContent><SelectItem value="all">Todo</SelectItem></SelectContent></Select>
          </div>
          <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          </Tabs>
      </div>

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
