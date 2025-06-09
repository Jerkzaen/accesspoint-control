// RUTA: src/components/tickets/TicketActionsBitacora.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info, Loader2 } from 'lucide-react';
import { ActionEntry } from '@/types/ticket';
// Asegurarse de que no hay importaciones de Input, Select, Tabs, AccordionContent, AccordionTrigger aquí.

interface TicketActionsBitacoraProps {
  actionsForSelectedTicket: ActionEntry[];
  editingActionId: string | null;
  editedActionDescription: string;
  setEditedActionDescription: (desc: string) => void;
  isProcessingAction: boolean;
  startEditingAction: (action: ActionEntry) => void;
  cancelEditingAction: () => void;
  saveEditedAction: () => Promise<void>;
}

const TicketActionsBitacora: React.FC<TicketActionsBitacoraProps> = ({
  actionsForSelectedTicket = [],
  editingActionId,
  editedActionDescription,
  setEditedActionDescription,
  isProcessingAction,
  startEditingAction,
  cancelEditingAction,
  saveEditedAction,
}) => {
  const commonDateTimeFormatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  };

  return (
    // Contenedor principal para scroll vertical y altura flexible
    <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
        {/* Contenedor interno para alineación horizontal del contenido y la línea vertical */}
        {/* Añadido px-4 para dar padding a la izquierda y derecha del contenido del timeline */}
        <div className="relative px-4 py-2"> 
            {actionsForSelectedTicket.length > 0 && <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted-foreground/20" aria-hidden="true"></div>} {/* Ajustado 'left-6' para la línea vertical */}
            <div className="space-y-6"> 
                {actionsForSelectedTicket.map((act) => (
                    <div key={act.id} className="relative pl-8"> {/* pl-8 para la sangría de los items */}
                        <div className="absolute -left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background" aria-hidden="true">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        </div>
                        <div className="text-xs">
                        {editingActionId === act.id ? (
                          <div className="flex flex-col gap-1.5">
                              <Textarea value={editedActionDescription} onChange={(e) => setEditedActionDescription(e.target.value)} disabled={isProcessingAction} rows={3} className="text-xs" />
                              <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={cancelEditingAction} disabled={isProcessingAction} className="h-7 text-xs">Cancelar</Button>
                                  <Button size="sm" onClick={saveEditedAction} disabled={isProcessingAction} className="h-7 text-xs">
                                      {isProcessingAction ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Guardando...</> : 'Guardar'}
                                  </Button>
                              </div>
                          </div>
                        ) : (
                          <div>
                              <div className="flex justify-between items-center mb-1">
                                  <time dateTime={act.fechaAccion.toString()} className="font-semibold text-primary">
                                    {new Date(act.fechaAccion).toLocaleString('es-CL', commonDateTimeFormatOptions)}
                                  </time>
                                  <Button variant="outline" size="sm" onClick={() => startEditingAction(act)} disabled={isProcessingAction} className="h-6 px-2 text-xs">Editar</Button>
                              </div>
                              <p className="text-foreground whitespace-pre-wrap text-[13px] leading-relaxed break-words"> 
                                {act.descripcion}
                              </p>
                              <p className="text-muted-foreground mt-1.5">por: {act.realizadaPor?.name || 'Sistema'}</p>
                            </div>
                          )}
                          </div>
                      </div>
                ))}
                {actionsForSelectedTicket.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No hay acciones registradas.</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default TicketActionsBitacora;
