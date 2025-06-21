'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Loader2, Pencil, Trash2 } from 'lucide-react';

// CORRECCIÓN: Se importa solo lo necesario desde las acciones del servidor
import { getEmpresas, createEmpresa, updateEmpresa, deleteEmpresa, type EmpresaConDetalles } from '@/app/actions/empresaActions';
import { ComunaSelector, type ComunaConProvinciaYRegion } from "@/components/shared/ComunaSelector";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';


// --- VALIDATOR Y TIPOS DEFINIDOS DENTRO DEL COMPONENTE CLIENTE ---
const empresaSchema = z.object({
    nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
    rut: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    calle: z.string().optional().nullable(),
    numero: z.string().optional().nullable(),
    comunaId: z.string().uuid({ message: "La comuna seleccionada no es válida." }).nullable().optional(),
});
type EmpresaInput = z.infer<typeof empresaSchema>;


// --- Formulario de Creación (interno en la página) ---
function CreateForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: { nombre: "", rut: "", telefono: "", calle: "", numero: "", comunaId: null },
  });

  function onSubmit(values: EmpresaInput) {
    startTransition(async () => {
      const result = await createEmpresa(values);
      if (result.success) {
        toast.success(result.message);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <>
      <DialogHeader><DialogTitle>Crear Nueva Empresa</DialogTitle></DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="rut" render={({ field }) => ( <FormItem><FormLabel>RUT</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="calle" render={({ field }) => ( <FormItem><FormLabel>Calle</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="numero" render={({ field }) => ( <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="comunaId" render={({ field }) => ( <FormItem><FormLabel>Comuna</FormLabel><FormControl><ComunaSelector onSelect={(c) => field.onChange(c?.id ?? null)} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onSuccess}>Cancelar</Button>
            <FormSubmitButton pending={isPending}>Crear Empresa</FormSubmitButton>
          </div>
        </form>
      </Form>
    </>
  );
}

// --- Formulario de Edición (interno en la página) ---
function EditForm({ empresa, onSuccess }: { empresa: EmpresaConDetalles, onSuccess?: () => void }) {
    const [isPending, startTransition] = useTransition();
    const form = useForm<EmpresaInput>({
        resolver: zodResolver(empresaSchema),
        defaultValues: {
            nombre: empresa.nombre || "",
            rut: empresa.rut || "",
            telefono: empresa.telefono || "",
            calle: empresa.direccionComercial?.calle || "",
            numero: empresa.direccionComercial?.numero || "",
            comunaId: empresa.direccionComercial?.comunaId || null,
        },
    });

    function onSubmit(values: EmpresaInput) {
        startTransition(async () => {
            const result = await updateEmpresa(empresa.id, values);
            if (result.success) {
                toast.success(result.message);
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <>
            <DialogHeader><DialogTitle>Editando: {empresa.nombre}</DialogTitle></DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="rut" render={({ field }) => ( <FormItem><FormLabel>RUT</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="calle" render={({ field }) => ( <FormItem><FormLabel>Calle</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="numero" render={({ field }) => ( <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="comunaId" render={({ field }) => ( <FormItem><FormLabel>Comuna</FormLabel><FormControl><ComunaSelector initialComuna={empresa.direccionComercial?.comuna as ComunaConProvinciaYRegion} onSelect={(c) => field.onChange(c?.id ?? null)} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onSuccess}>Cancelar</Button>
                        <FormSubmitButton pending={isPending}>Guardar Cambios</FormSubmitButton>
                    </div>
                </form>
            </Form>
        </>
    );
}

// --- Componente de Página Principal ---
export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaConDetalles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaConDetalles | null>(null);
  const [deletingEmpresa, setDeletingEmpresa] = useState<EmpresaConDetalles | null>(null);

  const fetchEmpresas = () => {
    setIsLoading(true);
    getEmpresas().then(data => {
      setEmpresas(data);
    }).catch(() => {
        toast.error("Error al cargar las empresas.");
    }).finally(() => {
        setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingEmpresa(null);
    fetchEmpresas();
  };
  
  const handleDeleteConfirm = async () => {
    if (!deletingEmpresa) return;
    const result = await deleteEmpresa(deletingEmpresa.id);
    if (result.success) {
      toast.success(result.message);
      fetchEmpresas(); 
    } else {
      toast.error(result.message);
    }
    setDeletingEmpresa(null);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Empresas</h1>
        <Button onClick={() => { setEditingEmpresa(null); setIsModalOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />Crear Empresa
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          {editingEmpresa ? (
            <EditForm empresa={editingEmpresa} onSuccess={handleSuccess} />
          ) : (
            <CreateForm onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingEmpresa} onOpenChange={(open: boolean) => !open && setDeletingEmpresa(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Se eliminará permanentemente la empresa <strong className="text-foreground">{deletingEmpresa?.nombre}</strong>.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm}>Continuar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader><CardTitle>Empresas Registradas</CardTitle><CardDescription>Total de {empresas.length} empresas.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Dirección</TableHead><TableHead># Sucursales</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mr-2 h-6 w-6 animate-spin inline-block" /></TableCell></TableRow>
              ) : empresas.length > 0 ? (
                empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-medium">{empresa.nombre}</TableCell>
                    <TableCell>{empresa.direccionComercial ? `${empresa.direccionComercial.calle} ${empresa.direccionComercial.numero}, ${empresa.direccionComercial.comuna?.nombre}` : 'N/A'}</TableCell>
                    <TableCell>{empresa._count.sucursales}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => { setEditingEmpresa(empresa); setIsModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                       <Button variant="destructive" size="sm" onClick={() => setDeletingEmpresa(empresa)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No se encontraron empresas.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
