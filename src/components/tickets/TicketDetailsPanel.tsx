// RUTA: src/components/tickets/TicketDetailsPanel.tsx
'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
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
import { Accordion } from '@/components/ui/accordion'; // Importar Accordion

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
  // Nombres de los paneles para fácil referencia
  const INFO_TICKET_PANEL = 'info-ticket';
  const INFO_SOLICITANTE_PANEL = 'info-solicitante';
  const DESCRIPCION_PANEL = 'descripcion-panel';
  const BITACORA_PANEL = 'bitacora-panel';

  // Estado para controlar qué paneles del acordeón están abiertos
  const [openPanels, setOpenPanels] = useState<string[]>([]);

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

  // Efecto para inicializar el estado de los paneles cuando se selecciona un nuevo ticket
  // O al cargar el componente si ya hay un ticket seleccionado (ej. al refrescar la página)
  useEffect(() => {
    if (selectedTicket) {
      // Estado inicial: todos los paneles abiertos (como en la primera imagen)
      setOpenPanels([INFO_TICKET_PANEL, INFO_SOLICITANTE_PANEL, DESCRIPCION_PANEL, BITACORA_PANEL]);
    } else {
      setOpenPanels([]); // Si no hay ticket seleccionado, no hay paneles abiertos
    }
  }, [selectedTicket]);

  // Función para manejar el cambio de estado de los acordeones
  const handleAccordionValueChange = useCallback((newOpenValues: string[]) => {
    const prevOpenPanels = openPanels;

    const wasBitacoraOpen = prevOpenPanels.includes(BITACORA_PANEL);
    const isBitacoraNowOpen = newOpenValues.includes(BITACORA_PANEL);

    let nextPanelsState: string[];

    // Escenario: La Bitácora cambia de estado (se abre o se cierra)
    if (wasBitacoraOpen !== isBitacoraNowOpen) {
        // Si la Bitácora se acaba de COLAPSAR (estaba abierta y ahora se cierra)
        if (wasBitacoraOpen && !isBitacoraNowOpen) {
            nextPanelsState = [INFO_TICKET_PANEL, INFO_SOLICITANTE_PANEL, DESCRIPCION_PANEL];
        }
        // Si la Bitácora se acaba de EXPANDIR (estaba cerrada y ahora se abre)
        else { // (!wasBitacoraOpen && isBitacoraNowOpen)
            nextPanelsState = [BITACORA_PANEL];
        }
    } else {
        // Si la Bitácora no cambió de estado, o si se interactuó con otros paneles
        // Mantener el comportamiento predeterminado de un acordeón múltiple para los demás paneles
        // Esto permite abrir/cerrar Información y Descripción libremente si la Bitácora está colapsada
        nextPanelsState = newOpenValues;
    }
    
    setOpenPanels(nextPanelsState);
  }, [openPanels]); // Dependencia de openPanels para acceder a su estado anterior

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

  // Determinar si la bitácora está actualmente expandida para pasar la prop a TicketDescriptionCard
  const isBitacoraExpanded = openPanels.includes(BITACORA_PANEL);

  return (
    <Card className="shadow-lg rounded-lg p-0 flex flex-col h-full box-border overflow-hidden">
      {/* SECCIÓN 1: HEADER (TAMAÑO FIJO) */}
      <div className="flex-shrink-0 border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><h2 className="text-lg font-bold">Ticket #{selectedTicket.numeroCaso}</h2><Badge variant={getEstadoBadgeVariant(selectedTicket.estado)}>{selectedTicket.estado}</Badge></div>
          {!isEditingTicket && (<Button variant="outline" size="sm" onClick={startEditingTicket} disabled={isLoadingGlobal}><Edit3 className="h-4 w-4 mr-2" />Editar</Button>)}
        </div>
        {combinedError && <ErrorMessage error={combinedError} />}
      </div>

      {/* SECCIÓN 2: CONTENIDO CENTRAL (FLEXIBLE) */}
      <div className={cn("flex-1 p-3 flex flex-col gap-3 overflow-hidden", { "opacity-50 pointer-events-none": isLoadingGlobal })}>
        
        {isEditingTicket && editableTicketData && (
          <div className="flex-shrink-0">
            <EditTicketFormCard editableData={editableTicketData} isSaving={isSavingTicket} onInputChange={handleTicketInputChange} onSaveChanges={saveTicketChanges} onCancel={cancelEditingAction}/>
          </div>
        )}
        
        {/* ÚNICO Accordion que gestiona todos los paneles de información y la bitácora */}
        <Accordion type="multiple" value={openPanels} onValueChange={handleAccordionValueChange} className="w-full flex-1 flex flex-col min-h-0 space-y-2">
            {/* Estos componentes renderizan sus propios AccordionItem */}
            <TicketInfoAccordions selectedTicket={selectedTicket} fechaCreacionFormatted={fechaCreacionFormatted} />
            {/* Pasamos la prop isMinimizedForBitacora a TicketDescriptionCard */}
            <TicketDescriptionCard description={selectedTicket.descripcionDetallada} creatorName={selectedTicket.solicitanteNombre} isMinimizedForBitacora={isBitacoraExpanded} />
            <TicketActionsBitacora 
              actionsForSelectedTicket={actionsForSelectedTicket || []}
              editingActionId={editingActionId} 
              editedActionDescription={editedActionDescription} 
              setEditedActionDescription={setEditedActionDescription} 
              isProcessingAction={isProcessingAction} 
              startEditingAction={startEditingAction} 
              cancelEditingAction={cancelEditingAction} 
              saveEditedAction={saveEditedAction} 
            />
        </Accordion>
      </div>
      
      {/* SECCIÓN 3: FOOTER (TAMAÑO FIJO) */}
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
