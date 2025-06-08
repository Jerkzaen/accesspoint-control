// RUTA: src/components/tickets/TicketActionsBitacora.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Importación correcta para Button
import { Textarea } from '@/components/ui/textarea'; // Importación correcta para Textarea
import { Info, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ticket, ActionEntry } from '@/types/ticket';
import { useTicketActionsManager } from '@/hooks/useTicketActionsManager'; // Se re-importa el hook aquí para la modularización
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  actionsForSelectedTicket: ActionEntry[];
  editingActionId: string | null;
  editedActionDescription: string;
  setEditedActionDescription: (desc: string) => void;
  isProcessingAction: boolean;
  startEditingAction: (action: ActionEntry) => void;
  cancelEditingAction: () => void;
  saveEditedAction: () => Promise<void>;
  actionsManagerError: string | null;
  className?: string;
  centralHeight?: number;
}

interface BitacoraFilters {
  searchTerm: string
  category: string
  dateRange: string
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
  actionsForSelectedTicket,
  editingActionId,
  editedActionDescription,
  setEditedActionDescription,
  isProcessingAction,
  startEditingAction,
  cancelEditingAction,
  saveEditedAction,
  actionsManagerError,
  className,
  centralHeight
}) => {
  const [filters, setFilters] = React.useState<BitacoraFilters>({
    searchTerm: '',
    category: 'all',
    dateRange: 'all'
  })

  // Estado local para colapsar/expandir Bitácora
  const [isCollapsed, setIsCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showCollapseBtn, setShowCollapseBtn] = useState(false);

  // Detectar si el contenido supera el alto máximo (60% del área central)
  useEffect(() => {
    if (!contentRef.current) return;
    const maxHeight = centralHeight ? centralHeight * 0.6 : 300;
    setShowCollapseBtn(contentRef.current.scrollHeight > maxHeight);
  }, [actionsForSelectedTicket, isCollapsed, centralHeight]);

  const maxBitacoraHeight = centralHeight ? centralHeight * 0.6 : 300;

  const filteredActions = React.useMemo(() => {
    return actionsForSelectedTicket.filter(action => {
      const matchesSearch = action.descripcion.toLowerCase().includes(filters.searchTerm.toLowerCase())
      const matchesCategory = filters.category === 'all' || action.categoria === filters.category
      // Implementar lógica de filtrado por fecha según dateRange
      return matchesSearch && matchesCategory
    })
  }, [actionsForSelectedTicket, filters])

  // Altura máxima para el listado de acciones (ajustable según diseño)
  const MAX_ACTIONS_HEIGHT = 220;

  const commonDateTimeFormatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };

  return (
    <Card className={cn("p-0 shadow-none border bg-muted/10 flex-1 min-h-0 flex flex-col transition-all duration-300 ease-in-out", { "flex-shrink-0 h-auto": isCollapsed }, className)}>
      <button type="button" className="w-full flex items-center justify-between px-4 py-3 border-b bg-white/80 hover:bg-muted/20 transition-colors cursor-pointer focus:outline-none" onClick={handleToggleBitacora} aria-expanded={!isCollapsed}>
        <span className="text-sm font-semibold flex items-center gap 1.5">
          <Info className="h-4 w-4 text-primary" /> Bitácora de Acciones
        </span>
        <span className="ml-2">
          {isCollapsed ? <ChevronDown className="h-5 w-5 text-muted-foreground" onClick={() => setIsCollapsed(false)} /> : <ChevronUp className="h-5 w-5 text-muted-foreground" onClick={() => setIsCollapsed(true)} />}
        </span>
      </button>
      {!isCollapsed && (
        <div ref={contentRef} className="flex-grow overflow-auto flex flex-col">
          <div className="flex flex-col gap-2 flex-shrink-0 px-4 pt-3 pb-2 border-b bg-white/80">
            <Input placeholder="Buscar en bitácora..." value={filters.searchTerm} onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))} className="h-8 text-xs" />
            <div className="flex gap-2">
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="update">Actualizaciones</SelectItem>
                  <SelectItem value="comment">Comentarios</SelectItem>
                  <SelectItem value="status">Cambios de estado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Rango de fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue="timeline" className="w-full flex-shrink-0">
              <TabsList className="w-full grid grid-cols-2 h-8">
                <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                <TabsTrigger value="list" className="text-xs">Lista</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col flex-grow min-h-0 px-4 pt-2 pb-3 bg-white/80">
            <Tabs defaultValue="timeline" className="w-full h-full flex flex-col flex-grow min-h-0">
              <TabsContent value="timeline" className="flex flex-col flex-grow min-h-0">
                <div className="space-y-4 flex-grow min-h-0 overflow-y-auto">
                  {filteredActions.map((action, index) => (
                    <div key={action.id} className="relative pl-4 border-l-2 border-primary/20">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary/20 border-2 border-background" />
                      <div className="text-xs space-y-1 break-words whitespace-pre-line">
                        <p className="font-semibold text-primary">
                          {new Date(action.fechaAccion).toLocaleString('es-CL', commonDateTimeFormatOptions)}
                        </p>
                        <p>{action.descripcion}</p>
                        <p className="text-muted-foreground text-[10px]"> por: {action.realizadaPor?.name || 'Sistema'} </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TicketActionsBitacora;
