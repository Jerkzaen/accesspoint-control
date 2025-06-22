// RUTA: src/app/admin/empresas/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlusCircle, Search } from 'lucide-react'; 
import { useMediaQuery } from 'usehooks-ts';
import { toast } from 'sonner';

// Importar EmpresaConDetalles desde empresaActions (su fuente principal)
import { getEmpresasConDetalles, type EmpresaConDetalles } from '@/app/actions/empresaActions'; 
import { getComunas } from '@/app/actions/comunaActions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

// Importaciones correctas de los nuevos componentes
import { EmpresaListPanel } from '@/components/admin/empresas/EmpresaListPanel';
import { EmpresaDetailsPanel } from '@/components/admin/empresas/EmpresaDetailsPanel';
import { CreateEmpresaForm } from '@/components/admin/empresas/CreateEmpresaForm'; 

// Definición de tipo para las opciones de comuna (para el frontend)
export type ComunaOption = { value: string; label: string; };

// --- COMPONENTE PRINCIPAL ---
export default function EmpresasDashboardPage() {
  const [empresas, setEmpresas] = useState<EmpresaConDetalles[]>([]);
  const [comunas, setComunas] = useState<ComunaOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false); 
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaConDetalles | null>(null); 

  const isDesktop = useMediaQuery('(min-width: 768px)');

  const fetchEmpresas = useCallback(async () => {
    setIsLoading(true);
    const response = await getEmpresasConDetalles();
    if (response.success && response.data) {
        setEmpresas(response.data);
    } else {
        toast.error(response.message || "Error al cargar empresas."); 
    }
    setIsLoading(false);
  }, []);

  const fetchComunasData = useCallback(async () => {
    const response = await getComunas("");
    if (response.success && response.data) {
        setComunas(response.data.map(c => ({ value: c.id, label: `${c.nombre}, ${c.provincia.region.nombre}` }))); 
    } else {
        toast.error(response.message || "Error al cargar comunas."); 
    }
  }, []);

  useEffect(() => {
    fetchEmpresas();
    fetchComunasData();
  }, [fetchEmpresas, fetchComunasData]);
  
  const handleSelectEmpresa = useCallback((empresa: EmpresaConDetalles) => {
    setSelectedEmpresa(empresa);
    if (!isDesktop) {
      setIsSheetOpen(true); 
    }
  }, [isDesktop]);

  const handleClearSelection = useCallback(() => {
    setSelectedEmpresa(null);
    if (!isDesktop) {
      setIsSheetOpen(false); 
    }
  }, [isDesktop]);

  const handleEmpresaUpdated = useCallback(() => {
    fetchEmpresas(); 
    // Al actualizar, se fuerza a que el selectedEmpresa se re-evalúe para refrescar los detalles.
    // Esto se puede hacer re-estableciendo el mismo objeto o buscando la empresa por ID si los detalles completos no se actualizan.
    if (selectedEmpresa) {
      // Una forma de forzar la actualización si la referencia no cambia pero el contenido sí
      setSelectedEmpresa(prev => prev ? { ...prev } : null); 
    }
  }, [fetchEmpresas, selectedEmpresa]);

  const handleOpenCreateModal = useCallback(() => {
    setSelectedEmpresa(null); 
    setIsSheetOpen(true); 
  }, []);
  
  const filteredEmpresas = useMemo(() => 
    empresas.filter(e => 
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.rut.includes(searchTerm)
    ), 
    [empresas, searchTerm]
  );

  return (
    <div className="flex flex-col flex-grow h-full p-1 sm:p-4 gap-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-3 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
          <p className="text-muted-foreground">Crea, edita y administra las empresas de tus clientes.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="mt-4 md:mt-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Empresa
        </Button>
      </div>

      {isDesktop ? (
        <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border">
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <EmpresaListPanel 
              empresas={filteredEmpresas}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              selectedEmpresa={selectedEmpresa}
              onSelectEmpresa={handleSelectEmpresa}
              onEmpresaDeleted={fetchEmpresas} 
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={30}>
            <EmpresaDetailsPanel 
              selectedEmpresa={selectedEmpresa} 
              comunas={comunas} 
              onEmpresaUpdated={handleEmpresaUpdated}
              onClearSelection={handleClearSelection}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          <div className="mb-4 px-3 sm:px-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o RUT..." 
                className="pl-10" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <EmpresaListPanel 
            empresas={filteredEmpresas}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedEmpresa={selectedEmpresa}
            onSelectEmpresa={handleSelectEmpresa}
            onEmpresaDeleted={fetchEmpresas}
          />
        </>
      )}
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedEmpresa ? `Editando: ${selectedEmpresa.nombre}` : 'Crear Nueva Empresa'}</SheetTitle>
            <SheetDescription>
              Completa los datos para {selectedEmpresa ? 'actualizar la' : 'registrar una nueva'} empresa.
            </SheetDescription>
          </SheetHeader>
          <CreateEmpresaForm 
            empresaToEdit={selectedEmpresa} 
            onSuccess={() => {
              setIsSheetOpen(false); 
              setSelectedEmpresa(null); 
              fetchEmpresas(); 
            }}
            comunas={comunas} 
            onCancel={() => setIsSheetOpen(false)} 
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
