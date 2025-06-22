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

  // Helper para normalizar valores de dirección a string vacío o string
  const normalizeDireccionInput = (
    direccion?: EmpresaConDetalles['direccion'] | null
  ) => {
    if (!direccion) {
      return {
        calle: "",
        numero: "",
        comunaId: "", // ComunaId debe ser string vacío si no hay dirección.
      };
    }
    return {
      calle: direccion.calle, // Debería ser string por el tipo EmpresaConDetalles
      numero: direccion.numero, // Debería ser string por el tipo EmpresaConDetalles
      comunaId: direccion.comuna.id, // Debería ser string por el tipo EmpresaConDetalles
    };
  };

  const form = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombre: empresaToEdit?.nombre || "",
      rut: empresaToEdit?.rut || "",
      telefono: empresaToEdit?.telefono || null, 
      email: empresaToEdit?.email || null,     
      logoUrl: empresaToEdit?.logoUrl || null, 
      direccion: normalizeDireccionInput(empresaToEdit?.direccion),
    },
    mode: 'onBlur', 
    reValidateMode: 'onChange', 
  });

  React.useEffect(() => {
    form.reset({
      nombre: empresaToEdit?.nombre || "",
      rut: empresaToEdit?.rut || "",
      telefono: empresaToEdit?.telefono || null,
      email: empresaToEdit?.email || null,
      logoUrl: empresaToEdit?.logoUrl || null,
      direccion: normalizeDireccionInput(empresaToEdit?.direccion),
    });
  }, [empresaToEdit, form.reset]); 

  const onSubmit = async (values: EmpresaInput) => {
    setIsSubmitting(true);
    let result;

    // Los valores de 'values' ya están validados por Zod.
    // Solo necesitamos asegurarnos de que los campos opcionales/nulos sean `null` en lugar de `''`.
    // Y que el objeto 'direccion' solo se envíe si sus campos obligatorios están rellenos.
    const formattedValues: EmpresaInput = {
        ...values,
        email: values.email || null, 
        telefono: values.telefono || null, 
        logoUrl: values.logoUrl || null, 
        // CAMBIO CRÍTICO: Si el objeto 'direccion' no tiene todos los campos requeridos,
        // lo enviamos como 'undefined' para que Prisma no intente crear/actualizar una Direccion inválida.
        direccion: (values.direccion && values.direccion.calle && values.direccion.numero && values.direccion.comunaId)
            ? { // Si todos los campos requeridos de direccion están presentes, los enviamos.
                calle: values.direccion.calle,
                numero: values.direccion.numero,
                comunaId: values.direccion.comunaId,
            } 
            : undefined, // Si falta algún campo requerido en direccion, se envía undefined
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
            <FormField control={form.control} name="logoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>URL del Logo (SVG/Imagen)</FormLabel>
                <FormControl>
                  <Input placeholder="https://ejemplo.com/logo.svg" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
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
                        initialComuna={empresaToEdit?.direccion?.comuna || null} 
                        onSelect={(comuna) => {
                            // CAMBIO CLAVE: Si no hay comuna, field.onChange recibe null.
                            // Esto se alinea con Zod. El error de validación de Zod se mostrará si la comuna es obligatoria.
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
