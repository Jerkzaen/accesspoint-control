// RUTA: src/components/tickets/TicketDetailsPanel.tsx
'use client';

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, AlertTriangle } from 'lucide-react';
import { Ticket } from '@/types/ticket';
import { useTicketEditor } from '@/hooks/useTicketEditor';
import { useTicketActionsManager } from '@/hooks/useTicketActionsManager';
import { Badge } from '@/components/ui/badge';
import { EstadoTicket } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from '@/components/ui/accordion';

// Componentes Hijos
import TicketInfoAccordions from './TicketInfoAccordions';
import TicketDescriptionCard from './TicketDescriptionCard';
import TicketActionsBitacora from './TicketActionsBitacora';
import NewActionFormCard from './NewActionFormCard';
import EditTicketFormCard from './EditTicketFormCard';

interface TicketDetailsPanelProps {
  selectedTicket: Ticket | null;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  isLoadingGlobal?: boolean;
}

const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
    <div className="mt-2 p-2 text-xs bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" /><span>{error}</span>
    </div>
);

const TicketDetailsSkeleton: React.FC = () => (
    <Card className="shadow-lg rounded-lg p-4 h-full"><div className="w-full h-full flex flex-col gap-4 animate-pulse"><div className="flex justify-between items-center"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-8 w-24" /></div><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><div className="flex-1 space-y-2"><Skeleton className="h-full w-full" /></div><Skeleton className="h-24 w-full" /></div></Card>
);

const NoTicketSelectedMessage: React.FC = () => (
    <Card className="shadow-lg rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground text-center h-full"><AlertTriangle className="h-12 w-12 mb-4" /><p className="text-lg font-semibold mb-2">Selecciona un Ticket</p><p className="text-sm">Haz clic en un ticket de la lista para ver sus detalles aquí.</p></Card>
);

const TicketDetailsPanelComponent: React.FC<TicketDetailsPanelProps> = ({
  selectedTicket,
  onTicketUpdated,
  isLoadingGlobal = false,
}) => {
  const [openPanels, setOpenPanels] = useState<string[]>(['bitacora-panel', 'descripcion-panel']);
  const newActionCardRef = useRef<HTMLDivElement>(null);

  const {
    isEditingTicket, editableTicketData, isSaving: isSavingTicket, error: ticketEditorError,
    startEditingTicket, cancelEditingTicket, handleTicketInputChange, saveTicketChanges,
  } = useTicketEditor({ selectedTicket, onTicketUpdated });

  const {
    actionsForSelectedTicket, newActionDescription, setNewActionDescription,
    editingActionId, editedActionDescription, setEditedActionDescription,
    isProcessingAction, error: actionsManagerError, startEditingAction,
    cancelEditingAction, saveEditedAction, addAction,
  } = useTicketActionsManager({ selectedTicket, onTicketUpdated });
  
  const handlePanelChange = useCallback((newOpenValues: string[]) => {
      const wasBitacoraOpen = openPanels.includes('bitacora-panel');
      const isBitacoraNowOpen = newOpenValues.includes('bitacora-panel');
      const wasDescriptionOpen = openPanels.includes('descripcion-panel');

      // Escenario 1: ABRIENDO Bitácora (cuando estaba cerrada)
      if (isBitacoraNowOpen && !wasBitacoraOpen) {
          setOpenPanels(['bitacora-panel']); // Cierra todo excepto bitácora
          return;
      }
      
      // Escenario 2: CERRANDO Bitácora
      if (!isBitacoraNowOpen && wasBitacoraOpen) {
          setOpenPanels(['info-ticket', 'info-solicitante', 'descripcion-panel']); // Abre todo lo demás
          return;
      }

      // Escenario 3: Interacción con otros paneles mientras bitácora está abierta
      // Si la bitácora está abierta, solo permite que 'descripción' cambie su estado.
      if (isBitacoraNowOpen) {
          const descriptionPanelOnly = newOpenValues.filter(p => p === 'descripcion-panel');
          setOpenPanels(['bitacora-panel', ...descriptionPanelOnly]);
          return;
      }
      
      setOpenPanels(newOpenValues);
  }, [openPanels]);

  useEffect(() => {
    if (selectedTicket) {
      setOpenPanels(['descripcion-panel', 'bitacora-panel']);
    } else {
        setOpenPanels([]);
    }
  }, [selectedTicket]);

  if (isLoadingGlobal && !selectedTicket) return <TicketDetailsSkeleton />;
  if (!selectedTicket) return <NoTicketSelectedMessage />;

  const combinedError = ticketEditorError || actionsManagerError;

  const getEstadoBadgeVariant = (estado: EstadoTicket): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) {
      case EstadoTicket.ABIERTO: return "default";
      case EstadoTicket.CERRADO: return "destructive";
      case EstadoTicket.EN_PROGRESO: return "secondary";
      default: return "outline";
    }
  };

  const fechaCreacionFormatted = new Date(selectedTicket.fechaCreacion).toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  return (
    <Card className="shadow-lg rounded-lg p-0 flex flex-col h-full box-border">
      <div className="flex-shrink-0 border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><h2 className="text-lg font-bold">Ticket #{selectedTicket.numeroCaso}</h2><Badge variant={getEstadoBadgeVariant(selectedTicket.estado)}>{selectedTicket.estado}</Badge></div>
          {!isEditingTicket && (<Button variant="outline" size="sm" onClick={startEditingTicket} disabled={isLoadingGlobal}><Edit3 className="h-4 w-4 mr-2" />Editar</Button>)}
        </div>
        {combinedError && <ErrorMessage error={combinedError} />}
      </div>

      <ScrollArea className="flex-1">
        <div className={cn("p-3 space-y-3", { "opacity-50 pointer-events-none": isLoadingGlobal })}>
          {isEditingTicket && editableTicketData && (
            <EditTicketFormCard editableData={editableTicketData} isSaving={isSavingTicket} onInputChange={handleTicketInputChange} onSaveChanges={saveTicketChanges} onCancel={cancelEditingTicket}/>
          )}
          
          <Accordion type="multiple" value={openPanels} onValueChange={handlePanelChange} className="w-full space-y-2">
            <TicketInfoAccordions selectedTicket={selectedTicket} fechaCreacionFormatted={fechaCreacionFormatted} />
            <TicketDescriptionCard description={selectedTicket.descripcionDetallada} creatorName={selectedTicket.solicitanteNombre} />
            <TicketActionsBitacora actionsForSelectedTicket={actionsForSelectedTicket || []} editingActionId={editingActionId} editedActionDescription={editedActionDescription} setEditedActionDescription={setEditedActionDescription} isProcessingAction={isProcessingAction} startEditingAction={startEditingAction} cancelEditingAction={cancelEditingAction} saveEditedAction={saveEditedAction} />
          </Accordion>
        </div>
      </ScrollArea>
      
      <div className="flex-shrink-0 border-t p-3">
        <NewActionFormCard newActionDescription={newActionDescription} setNewActionDescription={setNewActionDescription} isProcessingAction={isProcessingAction} addAction={addAction} cardRef={newActionCardRef} />
      </div>
    </Card>
  );
};

export default memo(TicketDetailsPanelComponent);
