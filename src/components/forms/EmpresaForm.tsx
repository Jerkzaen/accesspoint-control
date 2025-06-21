'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,

} from '@/components/ui/form';
import { empresaSchema, EmpresaInput } from '@/lib/validators/empresaValidator';
import { ComunaSelector } from '@/components/shared/ComunaSelector';

interface EmpresaFormProps {
  onSubmit: (data: EmpresaInput) => void;
  initialData?: EmpresaInput | null;
}

export function EmpresaForm({ onSubmit, initialData }: EmpresaFormProps) {
  const form = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: initialData ? {
      ...initialData,
      direccion: initialData.direccion ? {
        ...initialData.direccion,
        comunaId: initialData.direccion.comuna?.id || null,
      } : { calle: '', numero: '', comunaId: null },
    } : {
      nombre: '',
      rut: '',
      direccion: { calle: '', numero: '', comunaId: null },
      telefono: '',
    },
  });

  function handleSubmit(values: EmpresaInput) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la Empresa" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RUT</FormLabel>
              <FormControl>
                <Input placeholder="12.345.678-9" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="direccion.calle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Calle"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direccion.numero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input
                  placeholder="Número"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direccion.comunaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comuna</FormLabel>
              <FormControl>
                <ComunaSelector
                  initialComuna={initialData?.direccion?.comuna}
                  onSelect={(comuna) => {
                    field.onChange(comuna ? comuna.id : null);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />



        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="Teléfono" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}