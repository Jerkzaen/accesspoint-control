// RUTA: src/components/tickets/TicketActionsBitacora.tsx
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Importación correcta para Button
import { Textarea } from '@/components/ui/textarea'; // Importación correcta para Textarea
import { Info, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ticket, ActionEntry } from '@/types/ticket';
import { useTicketActionsManager } from '@/hooks/useTicketActionsManager'; // Se re-importa el hook aquí para la modularización

// Componente auxiliar ActionLog (se mueve aquí, ya que es interno a la bitácora)
interface ActionLogProps {
  actions: ActionEntry[];
  editingActionId: string | null;
  editedActionDescription: string;
  setEditedActionDescription: (desc: string) => void;
  isProcessingAction: boolean;
  startEditingAction: (action: ActionEntry) => void;
  cancelEditingAction: () => void;
  saveEditedAction: () => Promise<void>;
  dateTimeFormatOptions: Intl.DateTimeFormatOptions;
}

const ActionLog: React.FC<ActionLogProps> = ({
  actions,
  editingActionId,
  editedActionDescription,
  setEditedActionDescription,
  isProcessingAction,
  startEditingAction,
  cancelEditingAction,
  saveEditedAction,
  dateTimeFormatOptions,
}) => (
  <>
    {actions.length > 0 ? actions.map((act) => (
      <div key={act.id} className="text-xs border-b pb-1 mb-1 last:border-b-0 last:pb-0 last:mb-0">
        {editingActionId === act.id ? (
          <div className="flex flex-col gap-1.5">
            <Textarea
              value={editedActionDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedActionDescription(e.target.value)}
              disabled={isProcessingAction}
              rows={2}
              className="text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEditingAction} disabled={isProcessingAction} className="h-7 text-xs">Cancelar</Button>
              <Button size="sm" onClick={saveEditedAction} disabled={isProcessingAction} className="h-7 text-xs">
                {isProcessingAction ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Guardando...</> : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <p className="flex-grow pr-1.5">
              <span className="font-semibold">{new Date(act.fechaAccion).toLocaleString('es-CL', dateTimeFormatOptions)} - </span>
              {act.descripcion}
              <span className="text-muted-foreground ml-1">(por: {act.realizadaPor?.name || 'Sistema'})</span>
            </p>
            <Button variant="outline" size="sm" onClick={() => startEditingAction(act)} disabled={isProcessingAction} className="h-7 text-xs flex-shrink-0">Editar</Button>
          </div>
        )}
      </div>
    )) : <p className="text-xs text-muted-foreground text-center pt-4">No hay acciones registradas.</p>}
  </>
);


interface TicketActionsBitacoraProps {
  selectedTicket: Ticket | null;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  isBitacoraExpanded: boolean;
  setIsBitacoraExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  handleToggleBitacora: () => void;
  ticketHeaderHeight: number;
  newActionCardHeight: number;
  headerAndPagePaddingOffset: string;
  // Propiedades directamente de useTicketActionsManager que se pasan
  actionsForSelectedTicket: ActionEntry[]; // Añadido
  editingActionId: string | null; // Añadido
  editedActionDescription: string; // Añadido
  setEditedActionDescription: (desc: string) => void; // Añadido
  isProcessingAction: boolean; // Añadido
  startEditingAction: (action: ActionEntry) => void; // Añadido
  cancelEditingAction: () => void; // Añadido
  saveEditedAction: () => Promise<void>; // Añadido
  actionsManagerError: string | null; // Añadido
}

const TicketActionsBitacora: React.FC<TicketActionsBitacoraProps> = ({
  selectedTicket,
  onTicketUpdated,
  isBitacoraExpanded,
  setIsBitacoraExpanded,
  handleToggleBitacora,
  ticketHeaderHeight,
  newActionCardHeight,
  headerAndPagePaddingOffset,
  // Desestructuramos las nuevas props
  actionsForSelectedTicket,
  editingActionId,
  editedActionDescription,
  setEditedActionDescription,
  isProcessingAction,
  startEditingAction,
  cancelEditingAction,
  saveEditedAction,
  actionsManagerError,
}) => {
  // El hook useTicketActionsManager no se usa directamente aquí, las props ya vienen de TicketDetailsPanelComponent
  // const { ... } = useTicketActionsManager({ selectedTicket, onTicketUpdated });

  const commonDateTimeFormatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };

  return (
    <Card
      className={cn(
        "p-3 shadow-none border bg-muted/10 flex flex-col transition-all duration-300 ease-in-out",
        { "flex-grow min-h-0": isBitacoraExpanded }, // Permite que crezca y maneje su propio scroll cuando expandida
        { "flex-shrink-0 h-auto": !isBitacoraExpanded } // Contrae la altura para el header solamente
      )}
    >
      <CardHeader className="p-0 pb-1.5 flex flex-row justify-between items-center flex-shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary" /> Bitácora de Acciones
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleToggleBitacora}>
          <span className="sr-only">{isBitacoraExpanded ? 'Colapsar Bitácora' : 'Expandir Bitácora'}</span>
          {isBitacoraExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </CardHeader>
      {isBitacoraExpanded && (
        <div
          className="mt-2 space-y-1 overflow-y-auto pr-2 -mr-2"
          style={{
            // Calcula el espacio restante en el panel principal para la bitácora
            // Altura total de la ventana - (altura del header principal + altura del header del ticket + altura del newActionCard + paddings/gaps/bordes extras)
            // NOTA: El '70px' es un ajuste aproximado para compensar paddings/gaps/bordes del layout.
            // Es crucial que este valor se ajuste bien.
            maxHeight: `calc(100vh - ${headerAndPagePaddingOffset} - ${ticketHeaderHeight}px - ${newActionCardHeight}px - 70px)`
          }}
        >
          <ActionLog
            actions={actionsForSelectedTicket}
            editingActionId={editingActionId}
            editedActionDescription={editedActionDescription}
            setEditedActionDescription={setEditedActionDescription}
            isProcessingAction={isProcessingAction}
            startEditingAction={startEditingAction}
            cancelEditingAction={cancelEditingAction}
            saveEditedAction={saveEditedAction}
            dateTimeFormatOptions={commonDateTimeFormatOptions}
          />
          {actionsManagerError && (
            <div className="mt-2 text-destructive text-xs">
              Error: {actionsManagerError}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default TicketActionsBitacora;
