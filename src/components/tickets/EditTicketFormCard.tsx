// RUTA: src/components/tickets/EditTicketFormCard.tsx
'use client';

import React, { memo } from 'react'; // Agregado memo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { EditableTicketFields } from '@/hooks/useTicketEditor';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';

interface EditTicketFormCardProps {
  editableData: EditableTicketFields;
  isSaving: boolean;
  onInputChange: (field: keyof EditableTicketFields, value: any) => void;
  onSaveChanges: () => void;
  onCancel: () => void;
}

const EditTicketFormCardComponent: React.FC<EditTicketFormCardProps> = ({ // Cambiado a Component
  editableData,
  isSaving,
  onInputChange,
  onSaveChanges,
  onCancel,
}) => {
  return (
    <Card className="mb-3 p-3 border-dashed flex-shrink-0 bg-muted/30 dark:bg-muted/10">
      <CardHeader className="p-1 pb-2"><CardTitle className="text-sm">Editando Ticket</CardTitle></CardHeader>
      <CardContent className="space-y-2 p-1 text-xs">
        <div className="space-y-0.5">
          <Label htmlFor="tecnicoAsignadoEdit" className="text-xs">Técnico Asignado</Label>
          <Input
            id="tecnicoAsignadoEdit"
            value={editableData.tecnicoAsignado}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange('tecnicoAsignado', e.target.value)}
            className="h-8 text-xs"
            disabled={isSaving}
          />
        </div>
        <div className="space-y-0.5">
          <Label htmlFor="prioridadEdit" className="text-xs">Prioridad</Label>
          <Select value={editableData.prioridad} onValueChange={(value) => onInputChange('prioridad', value)} disabled={isSaving}>
            <SelectTrigger id="prioridadEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(PrioridadTicket).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-0.5">
          <Label htmlFor="estadoEdit" className="text-xs">Estado</Label>
          <Select value={editableData.estado} onValueChange={(value) => onInputChange('estado', value)} disabled={isSaving}>
            <SelectTrigger id="estadoEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(EstadoTicket).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <div className="flex justify-end gap-2 p-1 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
        <Button size="sm" onClick={onSaveChanges} disabled={isSaving}>
          {isSaving ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Guardando...</> : 'Guardar'}
        </Button>
      </div>
    </Card>
  );
};

export default memo(EditTicketFormCardComponent); // Exportación correcta
