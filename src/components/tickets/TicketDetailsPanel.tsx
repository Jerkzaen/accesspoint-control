// RUTA: src/components/tickets/TicketDetailsPanel.tsx
'use client'; // Directiva para indicar que es un Client Component

import React, { memo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, AlertTriangle, Loader2, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Ticket, ActionEntry } from '@/types/ticket';
import { useTicketEditor, EditableTicketFields } from '@/hooks/useTicketEditor';
import { useTicketActionsManager } from '@/hooks/useTicketActionsManager';
import { Badge } from '@/components/ui/badge';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
// ExpandableText ya no es necesario importarlo directamente aquí
// Accordion, AccordionContent, AccordionItem, AccordionTrigger ya no son necesarios aquí
// Importamos los nuevos componentes
import TicketInfoAccordions from './TicketInfoAccordions';
import TicketDescriptionCard from './TicketDescriptionCard';


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
  // Cuando selectedTicket cambia, la bitácora se colapsa y los acordeones de información se abren.
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
          // Formulario de edición con scroll interno si es necesario
          <div className="flex-grow overflow-y-auto pr-2 -mr-2 pb-4 min-h-0">
            <EditTicketForm
              editableData={editableTicketData}
              isSaving={isSavingTicket}
              onInputChange={handleTicketInputChange}
              onSaveChanges={saveTicketChanges}
              onCancel={cancelEditingTicket}
            />
          </div>
        ) : (
          // Contenedor principal del contenido desplazable (Acordeones, Descripción, Bitácora)
          // Este div maneja el scroll principal del contenido "variable".
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

              {/* Card para Bitácora de Acciones: Gestiona su altura y scroll interno */}
              <Card
                className={cn(
                  "p-3 shadow-none border bg-muted/10 flex flex-col transition-all duration-300 ease-in-out",
                  { "flex-grow min-h-0": isBitacoraExpanded }, 
                  { "flex-shrink-0 h-auto": !isBitacoraExpanded }
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
                  // Contenido de la bitácora: este div es el que tiene el scroll interno
                  // Ajuste dinámico del max-height para que se apoye en la Card de "Agregar nueva acción"
                  <div className="mt-2 space-y-1 overflow-y-auto pr-2 -mr-2"
                       style={{ 
                         maxHeight: `calc(100vh - ${headerAndPagePaddingOffset} - ${ticketHeaderHeight}px - ${newActionCardHeight}px - 70px)` // Altura total de la ventana - offset global - altura del header del ticket - altura del newActionCard - padding/margenes/gaps extra
                       }} 
                  >
                    <ActionLog
                      actions={actionsForSelectedTicket}
                      editingActionId={editingActionId}
                      editedActionDescription={editedActionDescription}
                      setEditedActionDescription={setEditedActionDescription}
                      isProcessingAction={isProcessingAction}
                      startEditingAction={startEditingAction}
                      cancelEditingAction={cancelEditedAction}
                      saveEditedAction={saveEditedAction}
                      dateTimeFormatOptions={commonDateTimeFormatOptions}
                    />
                  </div>
                )}
              </Card>
          </div>
        )}
      </div>

      {/* Contenedor FIJO para el formulario de nueva acción. Siempre visible en la parte inferior. */}
      {/* Se añade la referencia para medir su altura */}
      <div ref={newActionCardRef} className="flex-shrink-0 pt-2 border-t mt-auto">
        <Card className="p-3 shadow-none border bg-muted/10">
          <NewActionForm
            newActionDescription={newActionDescription}
            setNewActionDescription={setNewActionDescription}
            isProcessingAction={isProcessingAction}
            addAction={addAction}
          />
        </Card>
      </div>
    </Card>
  );
};


// --- Componentes Auxiliares (sin cambios significativos en su funcionalidad) ---
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

// Estas interfaces y componentes auxiliares (ActionLog, NewActionForm, EditTicketForm)
// se mantendrán temporalmente aquí, pero serán extraídos en pasos posteriores.
// Componente auxiliar InfoAccordionItem ya ha sido extraído a TicketInfoAccordions.tsx.

interface ActionLogProps { actions: ActionEntry[]; editingActionId: string | null; editedActionDescription: string; setEditedActionDescription: (desc: string) => void; isProcessingAction: boolean; startEditingAction: (action: ActionEntry) => void; cancelEditingAction: () => void; saveEditedAction: () => Promise<void>; dateTimeFormatOptions: Intl.DateTimeFormatOptions; }
const ActionLog: React.FC<ActionLogProps> = ({ actions, editingActionId, editedActionDescription, setEditedActionDescription, isProcessingAction, startEditingAction, cancelEditingAction, saveEditedAction, dateTimeFormatOptions }) => (
  <>
    {actions.length > 0 ? actions.map((act) => (
      <div key={act.id} className="text-xs border-b pb-1 mb-1 last:border-b-0 last:pb-0 last:mb-0">
        {editingActionId === act.id ? (
          <div className="flex flex-col gap-1.5">
            <Textarea value={editedActionDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedActionDescription(e.target.value)} disabled={isProcessingAction} rows={2} className="text-xs" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEditingAction} disabled={isProcessingAction} className="h-7 text-xs">Cancelar</Button>
              <Button size="sm" onClick={saveEditedAction} disabled={isProcessingAction} className="h-7 text-xs">{isProcessingAction ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Guardando...</> : 'Guardar'}</Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <p className="flex-grow pr-1.5">
              <span className="font-semibold">{new Date(act.fechaAccion).toLocaleString('es-CL', dateTimeFormatOptions)} - </span>{act.descripcion}
              <span className="text-muted-foreground ml-1">(por: {act.realizadaPor?.name || 'Sistema'})</span>
            </p>
            <Button variant="outline" size="sm" onClick={() => startEditingAction(act)} disabled={isProcessingAction} className="h-7 text-xs flex-shrink-0">Editar</Button>
          </div>
        )}
      </div>
    )) : <p className="text-xs text-muted-foreground text-center pt-4">No hay acciones registradas.</p>}
  </>
);

interface NewActionFormProps { newActionDescription: string; setNewActionDescription: (desc: string) => void; isProcessingAction: boolean; addAction: () => Promise<void>; }
const NewActionForm: React.FC<NewActionFormProps> = ({ newActionDescription, setNewActionDescription, isProcessingAction, addAction }) => (
  <div>
    <CardTitle className="text-sm font-semibold flex items-center gap-1.5 mb-2">
      <Info className="h-3.5 w-3.5 text-primary" /> Agregar nueva acción
    </CardTitle>
    <Textarea id="newAction" className="mt-1 w-full text-xs" value={newActionDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewActionDescription(e.target.value)} placeholder="Describe la acción realizada..." rows={2} disabled={isProcessingAction} />
    <Button className="mt-2 w-full h-8 text-sm" onClick={addAction} disabled={isProcessingAction || !newActionDescription.trim()}>{isProcessingAction ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Acción'}</Button>
  </div>
);

interface EditTicketFormProps { editableData: EditableTicketFields; isSaving: boolean; onInputChange: (field: keyof EditableTicketFields, value: any) => void; onSaveChanges: () => void; onCancel: () => void; }
const EditTicketForm: React.FC<EditTicketFormProps> = ({ editableData, isSaving, onInputChange, onSaveChanges, onCancel }) => (
  <Card className="mb-3 p-3 border-dashed flex-shrink-0 bg-muted/30 dark:bg-muted/10">
    <CardHeader className="p-1 pb-2"><CardTitle className="text-sm">Editando Ticket</CardTitle></CardHeader>
    <CardContent className="space-y-2 p-1 text-xs">
      <div className="space-y-0.5"><Label htmlFor="tecnicoAsignadoEdit" className="text-xs">Técnico Asignado</Label><Input id="tecnicoAsignadoEdit" value={editableData.tecnicoAsignado} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange('tecnicoAsignado', e.target.value)} className="h-8 text-xs" disabled={isSaving} /></div>
      <div className="space-y-0.5"><Label htmlFor="prioridadEdit" className="text-xs">Prioridad</Label><Select value={editableData.prioridad} onValueChange={(value) => onInputChange('prioridad', value)} disabled={isSaving}><SelectTrigger id="prioridadEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{Object.values(PrioridadTicket).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-0.5"><Label htmlFor="estadoEdit" className="text-xs">Estado</Label><Select value={editableData.estado} onValueChange={(value) => onInputChange('estado', value)} disabled={isSaving}><SelectTrigger id="estadoEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{Object.values(EstadoTicket).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
    </CardContent>
    <div className="flex justify-end gap-2 p-1 pt-2"><Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>Cancelar</Button><Button size="sm" onClick={onSaveChanges} disabled={isSaving}>{isSaving ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Guardando...</> : 'Guardar'}</Button></div>
  </Card>
);

export default memo(TicketDetailsPanelComponent);
