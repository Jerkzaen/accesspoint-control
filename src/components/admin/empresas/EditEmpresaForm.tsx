// RUTA: src/components/admin/empresas/EditEmpresaForm.tsx
// Este archivo ahora está DEPRECADO. Su funcionalidad ha sido integrada
// en src/components/admin/empresas/CreateEmpresaForm.tsx para unificar
// la creación y edición de empresas en un solo formulario.
// Puedes eliminar este archivo después de verificar que la nueva implementación funciona correctamente.

// Este código se mantiene aquí solo como referencia histórica si fuera necesario,
// pero no se usa activamente en la aplicación con la nueva estructura.

/*
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { ComunaSelector } from "@/components/shared/ComunaSelector";
import { empresaSchema, type EmpresaInput } from "@/lib/validators/empresaValidator";
import { updateEmpresa, type EmpresaConDetalles } from "@/app/actions/empresaActions";
import type { ComunaOption } from '@/app/admin/empresas/page';

interface EditEmpresaFormProps {
  empresa: EmpresaConDetalles;
  onSuccess?: () => void;
  onCancel?: () => void;
  comunas: ComunaOption[];
}

export function EditEmpresaForm({ empresa, onSuccess, onCancel, comunas }: EditEmpresaFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombre: empresa.nombre || "",
      rut: empresa.rut || "",
      telefono: empresa.telefono || "",
      email: empresa.email || "",
      direccion: {
          calle: empresa.direccion?.calle || "",
          numero: empresa.direccion?.numero || "",
          comunaId: empresa.direccion?.comunaId || null,
      }
    },
  });

  React.useEffect(() => {
    form.reset({
      nombre: empresa.nombre || "",
      rut: empresa.rut || "",
      telefono: empresa.telefono || "",
      email: empresa.email || "",
      direccion: {
          calle: empresa.direccion?.calle || "",
          numero: empresa.direccion?.numero || "",
          comunaId: empresa.direccion?.comunaId || null,
      }
    });
  }, [empresa, form]);


  const onSubmit = async (values: EmpresaInput) => {
    setIsSubmitting(true);
    const result = await updateEmpresa(empresa.id, {
        ...values,
        email: values.email || undefined,
        direccion: {
            calle: values.direccion?.calle || '',
            numero: values.direccion?.numero || '',
            comunaId: values.direccion?.comunaId || '',
        }
    });

    if (result.success) {
      toast.success(result.message);
      if (onSuccess) onSuccess();
    } else {
      if (result.issues) {
        result.issues.forEach((issue: any) => {
          const path = Array.isArray(issue.path) ? issue.path.join('.') : issue.path;
          form.setError(path as keyof EmpresaInput, { message: issue.message });
        });
        toast.error("Por favor corrige los errores en el formulario.");
      } else {
        toast.error(result.message);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="border-none shadow-none -mt-4">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem> <FormLabel>Nombre</FormLabel> <FormControl> <Input {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
               <FormField control={form.control} name="rut" render={({ field }) => ( <FormItem> <FormLabel>RUT</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} /> </FormControl> <FormMessage /> </FormItem> )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem> <FormLabel>Teléfono</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} /> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} placeholder="contacto@empresa.cl" /> </FormControl> <FormMessage /> </FormItem> )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="direccion.calle" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Calle</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} placeholder="Ej: Av. Siempre Viva"/> </FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="direccion.numero" render={({ field }) => ( <FormItem> <FormLabel>Número</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} placeholder="Ej: 123"/> </FormControl> <FormMessage /> </FormItem> )} />
            </div>

            <FormField
              control={form.control}
              name="direccion.comunaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comuna</FormLabel>
                  <FormControl>
                     <ComunaSelector 
                        initialComuna={empresa.direccion?.comuna}
                        comunas={comunas}
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
                    Guardar Cambios
                 </FormSubmitButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
*/