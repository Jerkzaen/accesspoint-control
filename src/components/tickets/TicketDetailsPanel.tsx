// RUTA: src/components/tickets/TicketDetailsPanel.tsx
'use client'; // Directiva para indicar que es un Client Component

import React, { memo, useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  // Estado para controlar qué paneles están abiertos
  const [openPanels, setOpenPanels] = useState<string[]>(["descripcion", "bitacora"]);

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

  // Ref para saber si el usuario cerró manualmente bitácora o descripción
  const userClosed = useRef<{ bitacora: boolean; descripcion: boolean }>({ bitacora: false, descripcion: false });

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

  const centralPanelRef = useRef<HTMLDivElement>(null);

  // Estado para forzar colapso automático de Descripción si el espacio es insuficiente
  const [forceCollapseDescripcion, setForceCollapseDescripcion] = useState(false);

  // Estado para el alto dinámico del área central
  const [centralHeight, setCentralHeight] = useState(0);

  // Reset al seleccionar ticket
  useEffect(() => {
    if (!selectedTicket) {
      setOpenPanels([]);
      userClosed.current = { bitacora: false, descripcion: false };
    } else {
      setOpenPanels(["descripcion", "bitacora"]);
      userClosed.current = { bitacora: false, descripcion: false };
    }
  }, [selectedTicket]);

  // Apertura automática de paneles centrales si hay espacio
  useEffect(() => {
    const infoClosed = !openPanels.includes("info-ticket") && !openPanels.includes("info-solicitante");
    if (infoClosed && !openPanels.includes("bitacora") && !userClosed.current.bitacora) {
      setOpenPanels((prev) => prev.includes("bitacora") ? prev : [...prev, "bitacora"]);
    }
    if (infoClosed && openPanels.includes("bitacora") && !openPanels.includes("descripcion") && !userClosed.current.descripcion) {
      setOpenPanels((prev) => prev.includes("descripcion") ? prev : [...prev, "descripcion"]);
    }
  }, [openPanels]);

  // ResizeObserver para reabrir bitacora si hay espacio tras cerrar paneles o cambiar tamaño
  useEffect(() => {
    if (!centralPanelRef.current) return;
    const observer = new window.ResizeObserver(() => {
      const infoClosed = !openPanels.includes("info-ticket") && !openPanels.includes("info-solicitante");
      if (infoClosed && !openPanels.includes("bitacora") && !userClosed.current.bitacora) {
        setOpenPanels((prev) => prev.includes("bitacora") ? prev : [...prev, "bitacora"]);
      }
    });
    observer.observe(centralPanelRef.current);
    return () => observer.disconnect();
  }, [openPanels]);

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

  // Lógica para colapsar automáticamente Descripción si el espacio central es insuficiente
  useLayoutEffect(() => {
    if (!centralPanelRef.current) return;
    const handleResize = () => {
      if (!centralPanelRef.current) return;
      const centralHeight = centralPanelRef.current.offsetHeight;
      if (openPanels.includes('descripcion') && openPanels.includes('bitacora')) {
        if (centralHeight < 220) {
          setForceCollapseDescripcion(true);
        } else {
          setForceCollapseDescripcion(false);
        }
      } else {
        setForceCollapseDescripcion(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [openPanels]);

  // ResizeObserver para medir el alto del área central dinámicamente
  useEffect(() => {
    if (!centralPanelRef.current) return;
    const updateHeight = () => {
      if (centralPanelRef.current) {
        setCentralHeight(centralPanelRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new window.ResizeObserver(updateHeight);
    observer.observe(centralPanelRef.current);
    window.addEventListener('resize', updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

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

  // Función para alternar paneles (completamente independiente)
  const handleTogglePanel = (panel: string) => {
    setOpenPanels((prev) => {
      const isOpen = prev.includes(panel);
      if (panel === "bitacora") userClosed.current.bitacora = isOpen;
      if (panel === "descripcion") userClosed.current.descripcion = isOpen;
      return isOpen ? prev.filter((p) => p !== panel) : [...prev, panel];
    });
  };

  // Renderizado del componente principal
  return (
    <Card className="shadow-lg rounded-lg p-4 sticky top-4 flex flex-col h-[calc(100vh-100px)] box-border">
      <div className="flex flex-col h-full min-h-0">
        {/* Paneles de información SIEMPRE presentes y visibles arriba */}
        <div className="flex flex-col gap-2 flex-shrink-0 mb-2 transition-all duration-300 ease-in-out">
          <TicketInfoAccordions
            selectedTicket={selectedTicket}
            openInfoSections={openPanels.filter(p => p === "info-ticket" || p === "info-solicitante")}
            setOpenInfoSections={(sections) => {
              setOpenPanels((prev) => {
                // Mantener los paneles centrales y solo actualizar los de información
                const centrales = prev.filter(p => p !== "info-ticket" && p !== "info-solicitante");
                return [...centrales, ...sections];
              });
            }}
            isBitacoraExpanded={openPanels.includes('bitacora')}
            fechaCreacionFormatted={fechaCreacionFormatted}
          />
        </div>
        {/* Área central: Descripción y Bitácora SIEMPRE ocupan todo el espacio restante */}
        <div className="flex flex-col flex-grow min-h-0 gap-2 transition-all duration-300 ease-in-out" ref={centralPanelRef}>
          {/* Ambos paneles pueden estar abiertos, Bitácora aprovecha el espacio sobrante */}
          <TicketDescriptionCard
            selectedTicketDescription={selectedTicket?.descripcionDetallada}
            isOpen={openPanels.includes('descripcion')}
            onToggle={() => handleTogglePanel('descripcion')}
            creatorName={selectedTicket?.solicitanteNombre}
            previewMode={false}
            className={openPanels.includes('descripcion') ? 'flex-shrink-0' : 'hidden'}
            centralHeight={centralHeight}
          />
          <TicketActionsBitacora
            selectedTicket={selectedTicket}
            onTicketUpdated={onTicketUpdated}
            isBitacoraExpanded={openPanels.includes('bitacora')}
            setIsBitacoraExpanded={() => handleTogglePanel('bitacora')}
            handleToggleBitacora={() => handleTogglePanel('bitacora')}
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
            className={openPanels.includes('bitacora') ? 'flex-1 min-h-0 flex flex-col' : 'hidden'}
            centralHeight={centralHeight}
          />
        </div>
        {/* Panel Agregar nueva acción SIEMPRE ABAJO */}
        <div className="flex-shrink-0 mt-2">
          <NewActionFormCard
            newActionDescription={newActionDescription}
            setNewActionDescription={setNewActionDescription}
            isProcessingAction={isProcessingAction}
            addAction={addAction}
            cardRef={newActionCardRef}
          />
        </div>
      </div>
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
