// RUTA: src/components/tickets/TicketActionsBitacora.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info, Loader2 } from 'lucide-react';
import { ActionEntry } from '@/types/ticket';
import { Input } from '@/components/ui/input';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    // LAYOUT FIX: Este item ahora es un contenedor flex que crece para ocupar el espacio disponible.
    <AccordionItem value="bitacora-panel" className="border rounded-lg bg-background shadow-sm flex-1 flex flex-col min-h-0">
      <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline flex-shrink-0">
        <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Bitácora de Acciones</span>
      </AccordionTrigger>
      {/* LAYOUT FIX: El contenido también es un contenedor flex para manejar sus hijos */}
      <AccordionContent className="p-4 pt-0 flex-1 flex flex-col min-h-0">
        {/* Controles de filtro (tamaño fijo) */}
        <div className="space-y-2 mb-4 flex-shrink-0">
            <Input placeholder="Buscar en bitácora..." className="h-8 text-xs" />
            <div className="flex gap-2">
                <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas las categorías" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem></SelectContent></Select>
                <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todo el tiempo" /></SelectTrigger><SelectContent><SelectItem value="all">Todo</SelectItem></SelectContent></Select>
            </div>
            <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
            </Tabs>
        </div>
        
        {/* LAYOUT FIX: La lista de acciones es ahora el elemento flexible con scroll interno */}
        <div className="flex-1 overflow-y-auto pr-2">
            <div className="relative">
            {actionsForSelectedTicket.length > 0 && <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-muted-foreground/20" aria-hidden="true"></div>}
            <div className="space-y-6">
                {actionsForSelectedTicket.map((act) => (
                    <div key={act.id} className="relative pl-8">
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
                              <p className="text-foreground whitespace-pre-wrap text-[13px] leading-relaxed">{act.descripcion}</p>
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
      </AccordionContent>
    </AccordionItem>
  );
};

export default TicketActionsBitacora;
