// RUTA: src/components/admin/empresas/EmpresaDetailsPanel.tsx
'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, AlertTriangle, Info, MapPin, Building, Phone, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CreateEmpresaForm } from './CreateEmpresaForm'; // Importar el formulario unificado
import type { EmpresaConDetalles, ComunaOption } from '@/app/admin/empresas/page'; // Usar 'type' para importar los tipos

interface EmpresaDetailsPanelProps {
  selectedEmpresa: EmpresaConDetalles | null;
  comunas: ComunaOption[];
  onEmpresaUpdated: () => void;
  onClearSelection: () => void;
}

const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
    <div className="mt-2 p-2 text-xs bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" /><span>{error}</span>
    </div>
);

const EmpresaDetailsSkeleton: React.FC = () => (
    <Card className="shadow-lg rounded-lg p-4 h-full">
        <div className="w-full h-full flex flex-col gap-4 animate-pulse">
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-full w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
        </div>
    </Card>
);

const NoEmpresaSelectedMessage: React.FC = () => (
    <Card className="shadow-lg rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground text-center h-full">
        <Info className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold mb-2">Selecciona una Empresa</p>
        <p className="text-sm">Haz clic en una empresa de la lista para ver sus detalles aquí.</p>
    </Card>
);

const EmpresaDetailsPanelComponent: React.FC<EmpresaDetailsPanelProps> = ({
  selectedEmpresa,
  comunas,
  onEmpresaUpdated,
  onClearSelection,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setIsEditing(false);
  }, [selectedEmpresa]);

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSuccessEdit = useCallback(() => {
    setIsEditing(false);
    onEmpresaUpdated(); 
  }, [onEmpresaUpdated]);

  if (!selectedEmpresa) {
    return <NoEmpresaSelectedMessage />;
  }

  const fechaCreacionFormatted = new Date(selectedEmpresa.createdAt).toLocaleString('es-CL', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    hourCycle: 'h23' 
  });
  const fechaActualizacionFormatted = new Date(selectedEmpresa.updatedAt).toLocaleString('es-CL', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    hourCycle: 'h23' 
  });

  return (
    <Card className="shadow-lg rounded-lg p-0 flex flex-col h-full box-border overflow-hidden">
      <CardHeader className="flex-shrink-0 border-b p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Detalles de {selectedEmpresa.nombre}</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
        <CardDescription>{selectedEmpresa.rut}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {isEditing ? (
          <CreateEmpresaForm // Ahora usamos CreateEmpresaForm para la edición
            empresaToEdit={selectedEmpresa} 
            onSuccess={handleSuccessEdit} 
            onCancel={handleCancelEdit} 
            comunas={comunas}
          />
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p><strong>Teléfono:</strong> {selectedEmpresa.telefono || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p><strong>Email:</strong> {selectedEmpresa.email || 'N/A'}</p>
            </div>
            <Separator />
            <h3 className="font-semibold text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Dirección Comercial
            </h3>
            {selectedEmpresa.direccion ? (
              <div className="space-y-1">
                <p>{selectedEmpresa.direccion.calle} {selectedEmpresa.direccion.numero}</p>
                <p>{selectedEmpresa.direccion.comuna.nombre}, {selectedEmpresa.direccion.comuna.provincia.nombre}, {selectedEmpresa.direccion.comuna.provincia.region.nombre}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Sin dirección registrada.</p>
            )}
            <Separator />
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> Información General
            </h3>
            <div className="space-y-1">
              <p><strong>Sucursales Registradas:</strong> {selectedEmpresa._count.sucursales}</p>
              <p><strong>ID de Empresa:</strong> {selectedEmpresa.id}</p>
              <p><strong>Creada el:</strong> {fechaCreacionFormatted}</p>
              <p><strong>Última Actualización:</strong> {fechaActualizacionFormatted}</p>
            </div>
          </div>
        )}
      </CardContent>
      {isEditing && (
         <CardFooter className="flex-shrink-0 border-t p-3 bg-muted/30 flex justify-end">
             <Button variant="ghost" onClick={handleCancelEdit}>Cancelar Edición</Button>
         </CardFooter>
      )}
      {!isEditing && (
        <CardFooter className="flex-shrink-0 border-t p-3 bg-muted/30 flex justify-end">
          <Button variant="outline" onClick={onClearSelection}>Cerrar Detalles</Button>
        </CardFooter>
      )}
    </Card>
  );
};

export const EmpresaDetailsPanel = memo(EmpresaDetailsPanelComponent);
