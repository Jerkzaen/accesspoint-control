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

interface EditEmpresaFormProps {
  empresa: EmpresaConDetalles;
  onSuccess?: () => void;
}

export function EditEmpresaForm({ empresa, onSuccess }: EditEmpresaFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const onSubmit = async (values: EmpresaInput) => {
    setIsSubmitting(true);
    const result = await updateEmpresa(empresa.id, values);

    if (result.success) {
      toast.success(result.message);
      if (onSuccess) onSuccess();
    } else {
      if (result.issues) {
        result.issues.forEach((issue: z.ZodIssue) => {
          form.setError(issue.path[0] as keyof EmpresaInput, { message: issue.message });
        });
        toast.error("Por favor corrige los errores en el formulario.");
      } else {
        toast.error(result.message);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Editando: {empresa.nombre}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem> <FormLabel>Nombre</FormLabel> <FormControl> <Input {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
               <FormField control={form.control} name="rut" render={({ field }) => ( <FormItem> <FormLabel>RUT</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} /> </FormControl> <FormMessage /> </FormItem> )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <FormField control={form.control} name="calle" render={({ field }) => ( <FormItem> <FormLabel>Calle</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} placeholder="Ej: Av. Siempre Viva"/> </FormControl> <FormMessage /> </FormItem> )} />
                </div>
                 <FormField control={form.control} name="numero" render={({ field }) => ( <FormItem> <FormLabel>Número</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} placeholder="Ej: 123"/> </FormControl> <FormMessage /> </FormItem> )} />
            </div>

            <FormField
              control={form.control}
              name="comunaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comuna</FormLabel>
                  <FormControl>
                     <ComunaSelector 
                        initialComuna={empresa.direccionComercial?.comuna}
                        onSelect={(comuna) => {
                            field.onChange(comuna ? comuna.id : null);
                        }}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem> <FormLabel>Teléfono</FormLabel> <FormControl> <Input {...field} value={field.value ?? ''} /> </FormControl> <FormMessage /> </FormItem> )} />
            
            <div className="flex justify-end gap-2 pt-4">
                 <Button type="button" variant="ghost" onClick={onSuccess}>Cancelar</Button>
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
