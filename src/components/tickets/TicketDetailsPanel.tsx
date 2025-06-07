// RUTA: src/components/tickets/TicketDetailsPanel.tsx
'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, AlertTriangle, Loader2 } from 'lucide-react';
import { Ticket, ActionEntry } from '@/types/ticket';
import { useTicketEditor } from '@/hooks/useTicketEditor';
import { useTicketActionsManager } from '@/hooks/useTicketActionsManager';
import { Badge } from '@/components/ui/badge';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TicketDetailsPanelProps {
  selectedTicket: Ticket | null;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  headerAndPagePaddingOffset?: string;
  isLoadingGlobal?: boolean;
}

const TicketDetailsPanelComponent: React.FC<TicketDetailsPanelProps> = ({
  selectedTicket,
  onTicketUpdated,
  headerAndPagePaddingOffset = '100px',
  isLoadingGlobal = false,
}) => {
  
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

  if (isLoadingGlobal && !selectedTicket) { 
    return (
      <Card className="shadow-lg rounded-lg p-4 sticky top-4 flex flex-col" style={{ height: `calc(100vh - ${headerAndPagePaddingOffset})` }}>
        <div className="w-full h-full flex flex-col gap-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-2 mt-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
          <Skeleton className="h-20 w-full mt-4" />
          <Skeleton className="h-6 w-1/3 mt-4" />
          {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
          <Skeleton className="h-20 w-full mt-auto" />
        </div>
      </Card>
    );
  }

  if (!selectedTicket) {
    return (
      <Card className="shadow-lg rounded-lg p-4 sticky top-4 flex flex-col items-center justify-center text-muted-foreground text-center" style={{ height: `calc(100vh - ${headerAndPagePaddingOffset})` }}>
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold mb-2">Selecciona un Ticket</p>
        <p className="text-sm">Haz clic en un ticket de la lista para ver sus detalles aquí.</p>
      </Card>
    );
  }

  const panelContentClasses = cn("flex flex-col h-full overflow-hidden", {
    "opacity-50 pointer-events-none transition-opacity duration-300": isLoadingGlobal && !isEditingTicket,
  });

  const combinedError = ticketEditorError || actionsManagerError;

  const commonDateTimeFormatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  const fechaCreacionFormatted = new Date(selectedTicket.fechaCreacion).toLocaleString('es-CL', commonDateTimeFormatOptions);
  const fechaSolucionFormatted = selectedTicket.fechaSolucionReal ? new Date(selectedTicket.fechaSolucionReal).toLocaleString('es-CL', commonDateTimeFormatOptions) : null;

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

  return (
    <Card className="shadow-lg rounded-lg p-4 sticky top-4 flex flex-col" style={{ height: `calc(100vh - ${headerAndPagePaddingOffset})` }}>
      <div className={panelContentClasses}>
        <div className="mb-3 pb-2 border-b flex-shrink-0">
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

        {combinedError && (
          <div className="mb-3 p-2 text-xs bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2 flex-shrink-0">
            <AlertTriangle className="h-4 w-4" />
            <span>{combinedError}</span>
          </div>
        )}

        {isEditingTicket && editableTicketData && (
          <Card className="mb-3 p-3 border-dashed flex-shrink-0 bg-muted/30 dark:bg-muted/10 overflow-y-auto">
            <CardHeader className="p-1 pb-2"><CardTitle className="text-sm">Editando Ticket</CardTitle></CardHeader>
            <CardContent className="space-y-2 p-1 text-xs">
              <div className="space-y-0.5">
                <Label htmlFor="tecnicoAsignadoEdit" className="text-xs">Técnico Asignado</Label>
                <Input id="tecnicoAsignadoEdit" value={editableTicketData.tecnicoAsignado} onChange={(e) => handleTicketInputChange('tecnicoAsignado', e.target.value)} className="h-8 text-xs" disabled={isSavingTicket} />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="prioridadEdit" className="text-xs">Prioridad</Label>
                <Select value={editableTicketData.prioridad} onValueChange={(value) => handleTicketInputChange('prioridad', value)} disabled={isSavingTicket}>
                  <SelectTrigger id="prioridadEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(PrioridadTicket).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="estadoEdit" className="text-xs">Estado</Label>
                <Select value={editableTicketData.estado} onValueChange={(value) => handleTicketInputChange('estado', value)} disabled={isSavingTicket}>
                  <SelectTrigger id="estadoEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                     {Object.values(EstadoTicket).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-1 pt-2">
              <Button variant="ghost" size="sm" onClick={cancelEditingTicket} disabled={isSavingTicket}>Cancelar</Button>
              <Button size="sm" onClick={saveTicketChanges} disabled={isSavingTicket}>
                {isSavingTicket ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Guardando...</> : 'Guardar'}
              </Button>
            </div>
          </Card>
        )}

        {!isEditingTicket && (
          <div className="flex flex-col flex-grow overflow-hidden">
            <div className="space-y-2 text-xs mb-3 flex-shrink-0">
                <p><strong>Título:</strong> {selectedTicket.titulo}</p>
                <p><strong>Tipo Incidente:</strong> {selectedTicket.tipoIncidente}</p>
                <p><strong>Prioridad:</strong> {selectedTicket.prioridad}</p>
                <p><strong>Contacto:</strong> {selectedTicket.solicitanteNombre}</p>
                <p><strong>Técnico:</strong> {selectedTicket.tecnicoAsignado?.name || 'No asignado'}</p>
                <p><strong>Creado:</strong> {fechaCreacionFormatted}</p>
                {fechaSolucionFormatted && <p><strong>Solucionado:</strong> {fechaSolucionFormatted}</p>}
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-2 border-t pt-2">
              <h4 className="text-sm font-semibold mb-2">Bitácora de acciones</h4>
              {actionsForSelectedTicket.length > 0 ? actionsForSelectedTicket.map((act: ActionEntry) => (
                <div key={act.id} className="text-xs border-b pb-1.5 mb-1.5">
                  {editingActionId === act.id ? (
                     <div className="flex flex-col gap-2">
                        <Textarea value={editedActionDescription} onChange={(e) => setEditedActionDescription(e.target.value)} disabled={isProcessingAction} rows={3} />
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="sm" onClick={cancelEditingAction} disabled={isProcessingAction}>Cancelar</Button>
                           <Button size="sm" onClick={saveEditedAction} disabled={isProcessingAction}>
                              {isProcessingAction ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : 'Guardar'}
                           </Button>
                        </div>
                     </div>
                  ) : (
                     <div className="flex justify-between items-start">
                        <p className="flex-grow pr-2">
                           <span className="font-semibold">{new Date(act.fechaAccion).toLocaleString('es-CL', commonDateTimeFormatOptions)} - </span>
                           {act.descripcion}
                           <span className="text-muted-foreground ml-1"> (por: {act.realizadaPor?.name || 'Sistema'})</span>
                        </p>
                        <Button variant="outline" size="sm" onClick={() => startEditingAction(act)} disabled={isProcessingAction}>Editar</Button>
                     </div>
                  )}
                </div>
              )) : <p className="text-xs text-muted-foreground">No hay acciones registradas.</p>}
            </div>

            <div className="pt-2 border-t mt-2 flex-shrink-0">
              <Label htmlFor="newAction" className="text-sm font-semibold">Agregar nueva acción</Label>
              <Textarea id="newAction" className="mt-1 w-full" value={newActionDescription} onChange={(e) => setNewActionDescription(e.target.value)} placeholder="Describe la acción realizada..." rows={3} disabled={isProcessingAction} />
              <Button className="mt-2 w-full" onClick={addAction} disabled={isProcessingAction || !newActionDescription.trim()}>
                {isProcessingAction ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Acción'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default memo(TicketDetailsPanelComponent);
