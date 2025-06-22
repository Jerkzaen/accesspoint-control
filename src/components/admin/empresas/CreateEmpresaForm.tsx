// RUTA: src/components/admin/empresas/CreateEmpresaForm.tsx
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; 
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card"; 
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { ComunaSelector, type ComunaConProvinciaYRegion } from "@/components/shared/ComunaSelector"; 
import { createEmpresa, updateEmpresa, type EmpresaConDetalles } from "@/app/actions/empresaActions";
import { empresaSchema, type EmpresaInput } from "@/lib/validators/empresaValidator"; 
import type { ComunaOption } from '@/app/admin/empresas/page'; 

interface CreateEmpresaFormProps {
  onSuccess?: () => void;
  empresaToEdit?: EmpresaConDetalles | null; 
  comunas: ComunaOption[]; 
  onCancel?: () => void; 
}

export function CreateEmpresaForm({ onSuccess, empresaToEdit, comunas, onCancel }: CreateEmpresaFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombre: empresaToEdit?.nombre || "",
      rut: empresaToEdit?.rut || "",
      telefono: empresaToEdit?.telefono || "",
      email: empresaToEdit?.email || "", 
      direccion: empresaToEdit?.direccion ? { 
        calle: empresaToEdit.direccion.calle || "",
        numero: empresaToEdit.direccion.numero || "",
        comunaId: empresaToEdit.direccion.comuna.id, 
      } : undefined, 
    },
  });

  React.useEffect(() => {
    form.reset({
      nombre: empresaToEdit?.nombre || "",
      rut: empresaToEdit?.rut || "",
      telefono: empresaToEdit?.telefono || "",
      email: empresaToEdit?.email || "",
      direccion: empresaToEdit?.direccion ? {
        calle: empresaToEdit.direccion.calle || "",
        numero: empresaToEdit.direccion.numero || "",
        comunaId: empresaToEdit.direccion.comuna.id,
      } : undefined,
    });
  }, [empresaToEdit, form]); 

  const onSubmit = async (values: EmpresaInput) => {
    setIsSubmitting(true);
    let result;

    const formattedValues = {
        ...values,
        email: values.email === '' ? null : values.email, 
        direccion: values.direccion && (values.direccion.calle !== '' || values.direccion.numero !== '' || (values.direccion.comunaId !== null && values.direccion.comunaId !== undefined && values.direccion.comunaId !== ''))
            ? {
                calle: values.direccion.calle === '' ? null : values.direccion.calle,
                numero: values.direccion.numero === '' ? null : values.direccion.numero,
                comunaId: values.direccion.comunaId === '' ? null : values.direccion.comunaId, 
            } 
            : undefined, 
    };

    if (empresaToEdit) {
      result = await updateEmpresa(empresaToEdit.id, formattedValues);
    } else {
      result = await createEmpresa(formattedValues);
    }

    if (result.success) {
      toast.success(result.message);
      if (!empresaToEdit) { 
        form.reset(); 
      }
      if (onSuccess) {
        onSuccess(); 
      }
    } else {
      if (result.issues) {
        result.issues.forEach((issue: z.ZodIssue) => {
          const path = Array.isArray(issue.path) ? issue.path.join('.') : issue.path;
          form.setError(path as keyof EmpresaInput, { message: issue.message });
        });
        toast.error("Por favor corrige los errores en el formulario.");
      } else {
        toast.error(result.message || "Ocurrió un error desconocido.");
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="border-none shadow-none"> 
      <CardContent className="p-0"> 
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem> <FormLabel>Nombre</FormLabel> <FormControl><Input placeholder="Nombre de la Empresa" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
               <FormField control={form.control} name="rut" render={({ field }) => ( <FormItem> <FormLabel>RUT</FormLabel> <FormControl><Input placeholder="76.123.456-7" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem> <FormLabel>Teléfono</FormLabel> <FormControl><Input placeholder="+56 9..." {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input placeholder="contacto@empresa.cl" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="direccion.calle" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Calle</FormLabel> <FormControl><Input placeholder="Av. Siempre Viva" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="direccion.numero" render={({ field }) => ( <FormItem> <FormLabel>Número</FormLabel> <FormControl><Input placeholder="742" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
             <FormField
              control={form.control}
              name="direccion.comunaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comuna</FormLabel>
                  <FormControl>
                     <ComunaSelector 
                        initialComuna={empresaToEdit?.direccion?.comuna} 
                        onSelect={(comuna) => {
                            field.onChange(comuna ? comuna.id : null);
                        }}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
                 {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
                 <FormSubmitButton pending={isSubmitting}>
                    {empresaToEdit ? 'Guardar Cambios' : 'Crear Empresa'}
                 </FormSubmitButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
