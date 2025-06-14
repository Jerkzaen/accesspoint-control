// RUTA: src/components/tickets/TicketDetailsPanel.tsx
'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, AlertTriangle, Info } from 'lucide-react'; 
import { Ticket } from '@/types/ticket';
import { useTicketEditor } from '@/hooks/useTicketEditor';
import { useTicketActionsManager } from '@/hooks/useTicketActionsManager';
import { Badge } from '@/components/ui/badge';
import { EstadoTicket } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import TicketInfoContent from './TicketInfoAccordions'; 
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
    <Card className="shadow-lg rounded-lg p-4 h-full">
        <div className="w-full h-full flex flex-col gap-4 animate-pulse">
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-full w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
        </div>
    </Card>
);

const NoTicketSelectedMessage: React.FC = () => (
    <Card className="shadow-lg rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground text-center h-full">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold mb-2">Selecciona un Ticket</p>
        <p className="text-sm">Haz clic en un ticket de la lista para ver sus detalles aquí.</p>
    </Card>
);

const TicketDetailsPanelComponent: React.FC<TicketDetailsPanelProps> = ({
  selectedTicket,
  onTicketUpdated,
  isLoadingGlobal = false,
}) => {
  const INFO_TICKET_PANEL = 'info-ticket';
  const INFO_SOLICITANTE_PANEL = 'info-solicitante';
  const DESCRIPCION_PANEL = 'descripcion-panel';

  const [openAccordionPanels, setOpenAccordionPanels] = useState<string[]>([]);

  const {
    isEditingTicket, editableTicketData, isSaving: isSavingTicket, error: ticketEditorError,
    startEditingTicket, cancelEditingTicket, handleTicketInputChange, saveTicketChanges,
  } = useTicketEditor({ selectedTicket, onTicketUpdated });

  const {
    actions, isLoadingActions, newActionDescription, setNewActionDescription,
    editingActionId, editedActionDescription, setEditedActionDescription,
    isProcessingAction, error: actionsManagerError, startEditingAction,
    cancelEditingAction, saveEditedAction, addAction,
  } = useTicketActionsManager({ selectedTicket });

  useEffect(() => {
    if (selectedTicket) {
      setOpenAccordionPanels([]);
    } else {
      setOpenAccordionPanels([]); 
    }
  }, [selectedTicket]);

  const handleAccordionValueChange = useCallback((newOpenValues: string[]) => {
    setOpenAccordionPanels(newOpenValues);
  }, []);

  if (isLoadingGlobal && !selectedTicket) return <TicketDetailsSkeleton />;
  if (!selectedTicket) return <NoTicketSelectedMessage />;

  const combinedError = ticketEditorError || actionsManagerError;

  const getEstadoBadgeVariant = (estado: EstadoTicket): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) {
      case EstadoTicket.ABIERTO: return "default";
      case EstadoTicket.CERRADO: return "destructive";
      case EstadoTicket.EN_PROGRESO: return "secondary";
      case EstadoTicket.PENDIENTE_TERCERO: return "outline";
      case EstadoTicket.PENDIENTE_CLIENTE: return "outline";
      case EstadoTicket.RESUELTO: return "default";
      case EstadoTicket.CANCELADO: return "destructive";
      default: return "outline";
    }
  };

  const fechaCreacionFormatted = new Date(selectedTicket.fechaCreacion).toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  return (
    <Card className="shadow-lg rounded-lg p-0 flex flex-col h-full box-border overflow-hidden">
      <div className="flex-shrink-0 border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><h2 className="text-lg font-bold">Ticket #{selectedTicket.numeroCaso}</h2><Badge variant={getEstadoBadgeVariant(selectedTicket.estado)}>{selectedTicket.estado}</Badge></div>
          {!isEditingTicket && (<Button variant="outline" size="sm" onClick={startEditingTicket} disabled={isLoadingGlobal}><Edit3 className="h-4 w-4 mr-2" />Editar</Button>)}
        </div>
        {combinedError && <ErrorMessage error={combinedError} />}
      </div>

      <div className={cn("flex-1 p-3 flex flex-col gap-3 overflow-hidden", { "opacity-50 pointer-events-none": isLoadingGlobal })}>
        
        {isEditingTicket && editableTicketData && (
          <div className="flex-shrink-0">
            <EditTicketFormCard editableData={editableTicketData} isSaving={isSavingTicket} onInputChange={handleTicketInputChange} onSaveChanges={saveTicketChanges} onCancel={cancelEditingTicket}/>
          </div>
        )}
        
        <Accordion type="multiple" value={openAccordionPanels} onValueChange={handleAccordionValueChange} className="w-full space-y-2 flex-shrink-0">
            <AccordionItem value={INFO_TICKET_PANEL} className="border rounded-lg bg-background shadow-sm flex-shrink-0">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Información del Ticket</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    <TicketInfoContent selectedTicket={selectedTicket} fechaCreacionFormatted={fechaCreacionFormatted} />
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value={INFO_SOLICITANTE_PANEL} className="border rounded-lg bg-background shadow-sm flex-shrink-0">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Información del Solicitante</span>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                        <p><strong>Nombre:</strong> {selectedTicket.solicitanteNombre}</p>
                        {selectedTicket.solicitanteTelefono && <p><strong>Teléfono:</strong> {selectedTicket.solicitanteTelefono}</p>}
                        {selectedTicket.solicitanteCorreo && <p><strong>Correo:</strong> {selectedTicket.solicitanteCorreo}</p>}
                        {selectedTicket.empresaCliente?.nombre && <p><strong>Empresa:</strong> {selectedTicket.empresaCliente.nombre}</p>}
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value={DESCRIPCION_PANEL} className="border rounded-lg bg-background shadow-sm flex-shrink-0">
                <TicketDescriptionCard 
                    description={selectedTicket.descripcionDetallada} 
                    creatorName={selectedTicket.solicitanteNombre} 
                    isPanelOpen={openAccordionPanels.includes(DESCRIPCION_PANEL)}
                />
            </AccordionItem>
        </Accordion>

        <Card className="border rounded-lg bg-background shadow-sm mt-3 flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 text-sm font-semibold flex-shrink-0 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />Bitácora de Acciones
            </div>
            <div className="p-0 flex-1 flex flex-col min-h-0">
                {isLoadingActions ? (
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <TicketActionsBitacora 
                      actionsForSelectedTicket={actions}
                      editingActionId={editingActionId} 
                      editedActionDescription={editedActionDescription} 
                      setEditedActionDescription={setEditedActionDescription} 
                      isProcessingAction={isProcessingAction} 
                      startEditingAction={startEditingAction} 
                      cancelEditingAction={cancelEditingAction} 
                      saveEditedAction={saveEditedAction} 
                  />
                )}
            </div>
        </Card>
      </div>
      
      <div className="flex-shrink-0 border-t p-3 bg-muted/30">
        <NewActionFormCard 
          newActionDescription={newActionDescription} 
          setNewActionDescription={setNewActionDescription} 
          isProcessingAction={isProcessingAction} 
          addAction={addAction}
        />
      </div>
    </Card>
  );
};

export default memo(TicketDetailsPanelComponent);
