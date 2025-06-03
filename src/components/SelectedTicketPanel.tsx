// src/components/SelectedTicketPanel.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, AlertTriangle } from 'lucide-react';
import { Ticket, ActionEntry } from '@/types/ticket';
import { useTicketEditor, EditableTicketFields } from '@/hooks/useTicketEditor';
import { useTicketActionsManager } from '@/hooks/useTicketActionsManager';

interface SelectedTicketPanelProps {
  selectedTicket: Ticket | null;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  headerAndPagePaddingOffset?: string; // Aunque ya no se usa directamente en el style de la Card raíz, se mantiene por si el padre lo necesita.
}

export default function SelectedTicketPanel({
  selectedTicket,
  onTicketUpdated,
  headerAndPagePaddingOffset = '100px', 
}: SelectedTicketPanelProps) {
  
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
    addAction,
    saveEditedAction,
  } = useTicketActionsManager({ selectedTicket, onTicketUpdated });

  if (!selectedTicket) {
    return (
      // Esta Card es para el estado vacío, su estilo es independiente del panel principal.
      // El contenedor en TicketCard.tsx le dará la altura.
      <Card
        className="shadow-lg rounded-lg p-4 flex flex-col items-center justify-center h-full"
      >
        <div className="text-sm text-muted-foreground text-center">
          <Edit3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Selecciona un ticket de la lista</p>
          <p>para ver sus detalles y acciones.</p>
        </div>
      </Card>
    );
  }

  const combinedError = ticketEditorError || actionsManagerError;

  // Formateo de fechas para visualización
  const fechaActualizacionFormatted = new Date(selectedTicket.fechaActualizacion).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const fechaCreacionFormatted = new Date(selectedTicket.fechaCreacion).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const fechaSolucionFormatted = selectedTicket.fechaSolucion 
    ? new Date(selectedTicket.fechaSolucion).toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) 
    : null;

  return (
    <Card
      className="shadow-lg rounded-lg p-4 flex flex-col h-full" // MODIFICADO: Quitado sticky, maxHeight, overflowY. Añadido h-full.
      // El estilo de maxHeight y sticky debe ser manejado por el div contenedor en TicketCard.tsx
    >
      {/* Div interno que manejará el scroll y la distribución flex del contenido */}
      <div className="flex flex-col h-full overflow-y-auto pr-1"> {/* pr-1 para espacio de la scrollbar */}
        
        {/* Encabezado del Ticket y botón Editar */}
        <div className="mb-3 pb-2 border-b flex-shrink-0"> {/* flex-shrink-0 para que no se encoja */}
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Ticket #{selectedTicket.numeroCaso} - {selectedTicket.titulo}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Actualizado: {fechaActualizacionFormatted} | Estado: {selectedTicket.estado}
              </CardDescription>
            </div>
            {!isEditingTicket && (
              <Button variant="outline" size="sm" onClick={startEditingTicket} className="ml-auto">
                <Edit3 className="h-3 w-3 mr-1.5" /> Editar Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Mensaje de Error Combinado */}
        {combinedError && (
          <div className="mb-3 p-2 text-xs bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2 flex-shrink-0">
            <AlertTriangle className="h-4 w-4" />
            <span>{combinedError}</span>
          </div>
        )}

        {/* Formulario de Edición del Ticket (si está activo) */}
        {isEditingTicket && editableTicketData && (
          <Card className="mb-3 p-3 border-dashed flex-shrink-0 bg-muted/30 dark:bg-muted/10">
            <CardHeader className="p-1 pb-2">
              <CardTitle className="text-sm">Editando Ticket #{selectedTicket.numeroCaso}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-1 text-xs">
              {/* Técnico Asignado */}
              <div className="space-y-0.5">
                <Label htmlFor="tecnicoAsignadoEdit" className="text-xs">Técnico Asignado</Label>
                <Select
                  value={editableTicketData.tecnicoAsignado} 
                  onValueChange={(value) => handleTicketInputChange('tecnicoAsignado', value)}
                  disabled={isSavingTicket}
                >
                  <SelectTrigger id="tecnicoAsignadoEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Miguel Chervellino">M.Chervellino</SelectItem>
                    <SelectItem value="Christian Torrenss">C. Torrens</SelectItem>
                    <SelectItem value="jerson Armijo">J. Armijo</SelectItem>
                    <SelectItem value="No Asignado">No Asignado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Prioridad */}
              <div className="space-y-0.5">
                <Label htmlFor="prioridadEdit" className="text-xs">Prioridad</Label>
                <Select
                  value={editableTicketData.prioridad}
                  onValueChange={(value) => handleTicketInputChange('prioridad', value)}
                  disabled={isSavingTicket}
                >
                  <SelectTrigger id="prioridadEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">BAJA</SelectItem>
                    <SelectItem value="media">MEDIA</SelectItem>
                    <SelectItem value="alta">ALTA</SelectItem>
                    <SelectItem value="urgente">URGENTE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Solicitante */}
              <div className="space-y-0.5">
                <Label htmlFor="solicitanteEdit" className="text-xs">Solicitante</Label>
                <Input
                  id="solicitanteEdit"
                  value={editableTicketData.solicitante}
                  onChange={(e) => handleTicketInputChange('solicitante', e.target.value)}
                  className="h-8 text-xs"
                  disabled={isSavingTicket}
                />
              </div>
              {/* Estado */}
              <div className="space-y-0.5">
                <Label htmlFor="estadoEdit" className="text-xs">Estado</Label>
                <Select
                  value={editableTicketData.estado}
                  onValueChange={(value) => handleTicketInputChange('estado', value)}
                  disabled={isSavingTicket}
                >
                  <SelectTrigger id="estadoEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Abierto">ABIERTO</SelectItem>
                    <SelectItem value="En Progreso">EN PROGRESO</SelectItem>
                    <SelectItem value="Cerrado">CERRADO</SelectItem>
                    <SelectItem value="Pendiente">PENDIENTE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-1 pt-2">
              <Button variant="ghost" size="sm" onClick={cancelEditingTicket} disabled={isSavingTicket}>Cancelar</Button>
              <Button size="sm" onClick={saveTicketChanges} disabled={isSavingTicket}>
                {isSavingTicket ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Detalles del Ticket (si no está en modo edición) */}
        {!isEditingTicket && (
          <>
            {/* Información detallada del ticket */}
            <div className="py-2 my-1 text-xs space-y-1 flex-shrink-0">
              <p><strong>Título:</strong> {selectedTicket.titulo}</p>
              <p><strong>Tipo Incidente:</strong> {selectedTicket.tipoIncidente}</p>
              <p><strong>Ubicación:</strong> {selectedTicket.ubicacion}</p>
              <p><strong>Técnico Asignado:</strong> {selectedTicket.tecnicoAsignado}</p>
              <p><strong>Solicitante:</strong> {selectedTicket.solicitante}</p>
              <p><strong>Prioridad:</strong> {selectedTicket.prioridad.toUpperCase()}</p>
              <p><strong>Fecha Creación:</strong> {fechaCreacionFormatted}</p>
              {fechaSolucionFormatted && <p><strong>Fecha Solución:</strong> {fechaSolucionFormatted}</p>}
              {selectedTicket.descripcionDetallada && (
                <div className="mt-2">
                  <strong>Descripción Detallada:</strong>
                  <div className="mt-1 text-xs whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-border">
                    {selectedTicket.descripcionDetallada}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones Rápidas */}
            <div className="py-2 my-2 border-y flex-shrink-0">
              <span className="text-sm font-semibold mb-2 block">Acciones Rápidas</span>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" disabled>Cambiar Estado (Próximamente)</Button>
                <Button variant="destructive" size="sm" disabled>Cerrar Ticket (Próximamente)</Button>
              </div>
            </div>

            {/* Encabezado de la Bitácora */}
            <div className="mb-2 mt-1 flex-shrink-0">
              <span className="text-sm font-semibold">Bitácora de acciones</span>
            </div>

            {/* Contenedor de la Bitácora de Acciones */}
            <div className="overflow-y-auto space-y-2 mb-3 flex-grow"> 
              {actionsForSelectedTicket.length > 0 ? actionsForSelectedTicket.map((act) => (
                <div key={act.id} className="text-xs border-b pb-1 flex items-start justify-between gap-2">
                  {editingActionId === act.id ? (
                    <Textarea
                      value={editedActionDescription}
                      onChange={(e) => setEditedActionDescription(e.target.value)}
                      className="flex-grow" 
                      rows={2}
                      disabled={isProcessingAction}
                    />
                  ) : (
                    <span className="font-medium flex-grow break-all pt-1">{act.fecha}: {act.descripcion}</span>
                  )}
                  <div className="flex-shrink-0 flex flex-col gap-1 items-end"> 
                    {editingActionId === act.id ? (
                      <>
                        <Button variant="default" size="sm" onClick={saveEditedAction} disabled={isProcessingAction}>
                          {isProcessingAction ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditingAction} disabled={isProcessingAction}>Cancelar</Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => startEditingAction(act)} disabled={isProcessingAction}>Editar</Button>
                    )}
                  </div>
                </div>
              )) : <p className="text-xs text-muted-foreground">No hay acciones registradas.</p>}
            </div>

            {/* Sección para Agregar Nueva Acción */}
            <div className="pt-2 border-t flex-shrink-0"> 
              <div className="mb-2">
                <span className="text-sm font-semibold">Agregar nueva acción</span>
              </div>
              <Textarea
                className="mt-1 w-full"
                value={newActionDescription}
                onChange={(e) => setNewActionDescription(e.target.value)}
                placeholder="Describe la acción realizada..."
                rows={3} 
                disabled={isProcessingAction || isEditingTicket}
              />
              <Button
                className="mt-2 w-full" 
                onClick={addAction}
                disabled={isProcessingAction || isEditingTicket || !newActionDescription.trim()}
              >
                {isProcessingAction ? 'Guardando...' : 'Guardar acción'}
              </Button>
            </div>
          </>
        )}
        
      </div>
    </Card>
  );
}
