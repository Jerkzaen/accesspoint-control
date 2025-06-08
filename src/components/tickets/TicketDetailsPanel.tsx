// RUTA: src/components/tickets/TicketDetailsPanel.tsx
'use client'; // Directiva para indicar que es un Client Component

import React, { memo, useState, useEffect, useRef } from 'react';
// Importaciones de Shadcn UI utilizadas directamente en este componente y sus auxiliares
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Importación CORRECTA para Button
import { Input } from '@/components/ui/input'; // Para EditTicketFormCard (si se mantiene aquí temporalmente)
import { Label } from '@/components/ui/label'; // Para EditTicketFormCard (si se mantiene aquí temporalmente)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Para EditTicketFormCard (si se mantiene aquí temporalmente)
import { Textarea } from '@/components/ui/textarea'; // Para NewActionFormCard (si se mantiene aquí temporalmente)


import { Edit3, AlertTriangle } from 'lucide-react'; // Iconos usados directamente aquí
import { Ticket } from '@/types/ticket';
import { useTicketEditor, EditableTicketFields } from '@/hooks/useTicketEditor';
import { useTicketActionsManager } from '@/hooks/useTicketActionsManager';
import { Badge } from '@/components/ui/badge';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Importamos los nuevos componentes modularizados
import TicketInfoAccordions from './TicketInfoAccordions';
import TicketDescriptionCard from './TicketDescriptionCard';
import TicketActionsBitacora from './TicketActionsBitacora';
import NewActionFormCard from './NewActionFormCard';
import EditTicketFormCard from './EditTicketFormCard'; // <-- NUEVO COMPONENTE

interface TicketDetailsPanelProps {
  selectedTicket: Ticket | null;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  headerAndPagePaddingOffset?: string;
  isLoadingGlobal?: boolean;
}

const TicketDetailsPanelComponent: React.FC<TicketDetailsPanelProps> = ({
  selectedTicket,
  onTicketUpdated,
  headerAndPagePaddingOffset = '100px', // Offset fijo del header y padding de la página
  isLoadingGlobal = false,
}) => {
  // Estado para controlar qué acordeones de información están abiertos
  const [openInfoSections, setOpenInfoSections] = useState<string[]>([]);
  // Estado para controlar si la bitácora está expandida o colapsada.
  // Se inicializa a 'false' para que siempre empiece colapsada.
  const [isBitacoraExpanded, setIsBitacoraExpanded] = useState<boolean>(false); 

  // Referencia para la Card de "Agregar nueva acción" para calcular su altura
  const newActionCardRef = useRef<HTMLDivElement>(null);
  // Estado para almacenar la altura dinámica de la Card de "Agregar nueva acción"
  const [newActionCardHeight, setNewActionCardHeight] = useState(0);

  // Referencia para el encabezado del panel de ticket (Ticket #, Estado, Editar Ticket)
  const ticketHeaderRef = useRef<HTMLDivElement>(null);
  const [ticketHeaderHeight, setTicketHeaderHeight] = useState(0);


  const {
    isEditingTicket,
    editableTicketData,
    isSaving: isSavingTicket,
    error: ticketEditorError,
    startEditingTicket,
    cancelEditingTicket,
    handleTicketInputChange,
    saveTicketChanges,
  } = useTicketEditor({ selectedTicket, onTicketUpdated });

  const {
    actionsForSelectedTicket,
    newActionDescription, 
    setNewActionDescription, 
    editingActionId, 
    editedActionDescription, 
    setEditedActionDescription, 
    isProcessingAction, 
    error: actionsManagerError, 
    startEditingAction, 
    cancelEditingAction, 
    saveEditedAction, 
    addAction, 
  } = useTicketActionsManager({ selectedTicket, onTicketUpdated });

  // Efecto para resetear estados al cambiar de ticket.
  useEffect(() => {
    if (!selectedTicket) {
      setOpenInfoSections([]); 
      setIsBitacoraExpanded(false); 
    } else {
      setOpenInfoSections(['info-ticket', 'info-solicitante']); 
      setIsBitacoraExpanded(false); 
    }
  }, [selectedTicket]);

  // Efecto para medir la altura de la Card de "Agregar nueva acción" y el encabezado del ticket
  useEffect(() => {
    const measureHeights = () => {
      if (newActionCardRef.current) {
        setNewActionCardHeight(newActionCardRef.current.offsetHeight);
      }
      if (ticketHeaderRef.current) {
        setTicketHeaderHeight(ticketHeaderRef.current.offsetHeight);
      }
    };

    measureHeights(); 
    const timeoutId = setTimeout(measureHeights, 100); 

    window.addEventListener('resize', measureHeights); 
    const observer = new MutationObserver(measureHeights); 
    if (newActionCardRef.current) observer.observe(newActionCardRef.current, { childList: true, subtree: true, attributes: true });
    if (ticketHeaderRef.current) observer.observe(ticketHeaderRef.current, { childList: true, subtree: true, attributes: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureHeights);
      observer.disconnect();
    };
  }, [selectedTicket, isBitacoraExpanded, isEditingTicket]); 


  // Manejo de estados de carga y cuando no hay ticket seleccionado
  if (isLoadingGlobal && !selectedTicket) {
    return <TicketDetailsSkeleton headerAndPagePaddingOffset={headerAndPagePaddingOffset} />;
  }

  if (!selectedTicket) {
    return <NoTicketSelectedMessage headerAndPagePaddingOffset={headerAndPagePaddingOffset} />;
  }

  // Clases para el overlay de opacidad durante la carga
  const panelContentOverlayClasses = cn({
    "opacity-50 pointer-events-none transition-opacity duration-300": isLoadingGlobal && !isEditingTicket,
  });

  const combinedError = ticketEditorError || actionsManagerError;

  const commonDateTimeFormatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  const fechaCreacionFormatted = new Date(selectedTicket.fechaCreacion).toLocaleString('es-CL', commonDateTimeFormatOptions);

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

  // Función para alternar la bitácora y ajustar acordeones/descripción
  const handleToggleBitacora = () => {
    setIsBitacoraExpanded(prev => {
      const newState = !prev;
      if (newState) {
          setOpenInfoSections([]); // Cierra acordeones de info si la bitácora se expande
      } else {
          setOpenInfoSections(['info-ticket', 'info-solicitante']); // Abre acordeones de info si la bitácora se colapsa
      }
      return newState;
    });
  };

  // Renderizado del componente principal
  return (
    <Card
        className="shadow-lg rounded-lg p-4 sticky top-4 flex flex-col h-[calc(100vh-100px)]" // Altura explícita para la Card principal
    >
      <div className={cn("flex flex-col flex-grow min-h-0", panelContentOverlayClasses)}>
        {/* Sección de Encabezado Fijo del Ticket (Número y Estado) */}
        <div ref={ticketHeaderRef} className="mb-3 pb-2 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Ticket #{selectedTicket.numeroCaso}</CardTitle>
              <Badge variant={getEstadoBadgeVariant(selectedTicket.estado)} className="mt-1 text-xs px-2 py-0.5 h-auto rounded-full">
                Estado: {selectedTicket.estado}
              </Badge>
            </div>
            {!isEditingTicket && (
              <Button variant="outline" size="sm" onClick={startEditingTicket} className="ml-auto">
                <Edit3 className="h-3 w-3 mr-1.5" /> Editar Ticket
              </Button>
            )}
          </div>
        </div>

        {combinedError && <ErrorMessage error={combinedError} />}

        {isEditingTicket && editableTicketData ? (
          // Componente de Formulario de Edición de Ticket
          <EditTicketFormCard
            editableData={editableTicketData}
            isSaving={isSavingTicket}
            onInputChange={handleTicketInputChange}
            onSaveChanges={saveTicketChanges}
            onCancel={cancelEditingTicket}
          />
        ) : (
          // Contenedor principal del contenido desplazable (Acordeones, Descripción, Bitácora)
          <div className="flex-grow overflow-y-auto pr-2 -mr-2 flex flex-col gap-2 min-h-0">
              {/* Nuevo componente: Acordeones de Información */}
              <TicketInfoAccordions
                selectedTicket={selectedTicket}
                openInfoSections={openInfoSections}
                setOpenInfoSections={setOpenInfoSections}
                isBitacoraExpanded={isBitacoraExpanded}
                fechaCreacionFormatted={fechaCreacionFormatted}
              />

              {/* Nuevo componente: Card de Descripción Detallada */}
              <TicketDescriptionCard 
                selectedTicketDescription={selectedTicket?.descripcionDetallada}
                isBitacoraExpanded={isBitacoraExpanded}
              />

              {/* Nuevo componente: Bitácora de Acciones */}
              <TicketActionsBitacora
                selectedTicket={selectedTicket}
                onTicketUpdated={onTicketUpdated}
                isBitacoraExpanded={isBitacoraExpanded}
                setIsBitacoraExpanded={setIsBitacoraExpanded}
                handleToggleBitacora={handleToggleBitacora}
                ticketHeaderHeight={ticketHeaderHeight}
                newActionCardHeight={newActionCardHeight}
                headerAndPagePaddingOffset={headerAndPagePaddingOffset}
                actionsForSelectedTicket={actionsForSelectedTicket}
                editingActionId={editingActionId}
                editedActionDescription={editedActionDescription}
                setEditedActionDescription={setEditedActionDescription}
                isProcessingAction={isProcessingAction}
                startEditingAction={startEditingAction}
                cancelEditingAction={cancelEditingAction}
                saveEditedAction={saveEditedAction}
                actionsManagerError={actionsManagerError}
              />
          </div>
        )}
      </div>

      {/* Nuevo componente: Formulario para Nueva Acción */}
      <NewActionFormCard
        newActionDescription={newActionDescription}
        setNewActionDescription={setNewActionDescription}
        isProcessingAction={isProcessingAction}
        addAction={addAction}
        cardRef={newActionCardRef} // Pasamos la ref al componente hijo
      />
    </Card>
  );
};


// --- Componentes Auxiliares que se mantienen aquí (esqueletos y mensajes de error) ---
const TicketDetailsSkeleton: React.FC<{ headerAndPagePaddingOffset: string }> = ({ headerAndPagePaddingOffset }) => (
  <Card className="shadow-lg rounded-lg p-4 sticky top-4 flex flex-col" style={{ height: `calc(100vh - ${headerAndPagePaddingOffset})` }}>
    <div className="w-full h-full flex flex-col gap-4">
      <Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-2 mt-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
      <Skeleton className="h-20 w-full mt-4" /><Skeleton className="h-6 w-1/3 mt-4" />
      {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
      <Skeleton className="h-20 w-full mt-auto" />
    </div>
  </Card>
);

const NoTicketSelectedMessage: React.FC<{ headerAndPagePaddingOffset: string }> = ({ headerAndPagePaddingOffset }) => (
  <Card className="shadow-lg rounded-lg p-4 sticky top-4 flex flex-col items-center justify-center text-muted-foreground text-center" style={{ height: `calc(100vh - ${headerAndPagePaddingOffset})` }}>
    <AlertTriangle className="h-12 w-12 mb-4" /><p className="text-lg font-semibold mb-2">Selecciona un Ticket</p>
    <p className="text-sm">Haz clic en un ticket de la lista para ver sus detalles aquí.</p>
  </Card>
);

const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
  <div className="mb-3 p-2 text-xs bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2 flex-shrink-0">
    <AlertTriangle className="h-4 w-4" /><span>{error}</span>
  </div>
);

export default memo(TicketDetailsPanelComponent);
