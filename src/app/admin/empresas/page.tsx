"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PlusCircle, Search, MoreVertical, Pencil, Trash2, Building, MapPin, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { getEmpresasConDetalles, createEmpresa, updateEmpresa, deleteEmpresa } from '@/app/actions/empresaActions';
import { getComunas } from '@/app/actions/comunaActions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

// --- COMPONENTES INTERNOS ---
const FormSubmitButton = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { pending } = useFormStatus();
    return (<Button type="submit" disabled={pending} className={className}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{children}</Button>);
};

const ComunaSelector = ({ onValueChange, defaultValue, comunas }: { onValueChange: (value: string) => void; defaultValue?: string; comunas: {value: string, label: string}[] }) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = comunas.find((comuna) => comuna.value === defaultValue)?.label;
    return (<Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">{defaultValue && selectedLabel ? selectedLabel : "Selecciona una comuna..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Buscar comuna..." /><CommandEmpty>No se encontró la comuna.</CommandEmpty><CommandList><CommandGroup>{comunas.map((comuna) => (<CommandItem key={comuna.value} value={comuna.label} onSelect={() => { onValueChange(comuna.value); setOpen(false); }}><Check className={cn("mr-2 h-4 w-4", defaultValue === comuna.value ? "opacity-100" : "opacity-0")} />{comuna.label}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>);
};

// --- TIPOS Y VALIDACIÓN ---
type EmpresaConDetalles = Exclude<Awaited<ReturnType<typeof getEmpresasConDetalles>>['data'], undefined>[0];

const formSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  rut: z.string().min(8, "El RUT es obligatorio y debe ser válido."),
  telefono: z.string().optional(),
  email: z.string().email("Debe ser un email válido.").optional().or(z.literal('')),
  direccion: z.object({
      calle: z.string().min(1, "La calle es obligatoria"),
      numero: z.string().min(1, "El número es obligatorio"),
      comunaId: z.string().min(1, "Debe seleccionar una comuna"),
  })
});
type FormValues = z.infer<typeof formSchema>;

const EmpresaForm = ({ empresa, comunas, closeSheet }: { empresa?: EmpresaConDetalles | null, comunas: {value: string, label: string}[], closeSheet: () => void }) => {
  const form = useForm<FormValues>({ 
    resolver: zodResolver(formSchema), 
    defaultValues: { 
      nombre: empresa?.nombre || "", 
      rut: empresa?.rut || "", 
      telefono: empresa?.telefono || "",
      email: empresa?.email || "",
      direccion: {
          calle: empresa?.direccion?.calle || "",
          numero: empresa?.direccion?.numero || "",
          comunaId: empresa?.direccion?.comunaId || "",
      }
    } 
  });

  async function onSubmit(values: FormValues) {
    const result = empresa
      ? await updateEmpresa(empresa.id, values)
      : await createEmpresa(values);

    if (result.success) {
      toast.success(result.message);
      closeSheet();
    } else {
      toast.error(result.error);
    }
  }

  return (<Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
      <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem> <FormLabel>Nombre</FormLabel> <FormControl> <Input placeholder="Nombre de la Empresa" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
      <FormField control={form.control} name="rut" render={({ field }) => ( <FormItem> <FormLabel>RUT</FormLabel> <FormControl> <Input placeholder="76.123.456-7" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem> <FormLabel>Teléfono</FormLabel> <FormControl> <Input placeholder="+56 9..." {...field} value={field.value || ''} /> </FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl> <Input placeholder="contacto@empresa.cl" {...field} value={field.value || ''}/> </FormControl> <FormMessage /> </FormItem> )}/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="direccion.calle" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Calle</FormLabel> <FormControl> <Input placeholder="Av. Siempre Viva" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="direccion.numero" render={({ field }) => ( <FormItem> <FormLabel>Número</FormLabel> <FormControl> <Input placeholder="742" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
      </div>
      <FormField control={form.control} name="direccion.comunaId" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Comuna</FormLabel> <ComunaSelector onValueChange={field.onChange} defaultValue={field.value} comunas={comunas} /> <FormMessage /> </FormItem> )}/>
      <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="ghost" onClick={closeSheet}>Cancelar</Button><FormSubmitButton>{empresa ? 'Guardar Cambios' : 'Crear Empresa'}</FormSubmitButton></div></form></Form>);
};

const EmpresaCardSkeleton = () => (<Card className="flex flex-col"><CardHeader className="flex flex-row items-start justify-between"><div className="flex items-center space-x-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[150px]" /><Skeleton className="h-4 w-[100px]" /></div></div><Skeleton className="h-8 w-8" /></CardHeader><CardContent className="flex-grow space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-[120px]" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>);

export default function EmpresasPageMejorada() {
  const [empresas, setEmpresas] = useState<EmpresaConDetalles[]>([]);
  const [comunas, setComunas] = useState<{value: string, label: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaConDetalles | null>(null);

  const fetchEmpresas = useCallback(async () => {
    setIsLoading(true);
    const response = await getEmpresasConDetalles();
    if (response.success && response.data) {
        setEmpresas(response.data);
    } else {
        toast.error(response.error || "Error al cargar empresas.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchEmpresas();
    const fetchComunas = async () => {
        const response = await getComunas("");
        if (response.success && response.data) {
            setComunas(response.data.map(c => ({ value: c.id, label: c.nombre })));
        } else {
            toast.error(response.error || "Error al cargar comunas.");
        }
    };
    fetchComunas();
  }, [fetchEmpresas]);
  
  const handleCloseSheet = () => {
      setIsSheetOpen(false);
      setEditingEmpresa(null);
      fetchEmpresas();
  }

  const filteredEmpresas = useMemo(() => empresas.filter(e => e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || e.rut.includes(searchTerm)), [empresas, searchTerm]);
  const handleCreateClick = () => { setEditingEmpresa(null); setIsSheetOpen(true); };
  const handleEditClick = (empresa: EmpresaConDetalles) => { setEditingEmpresa(empresa); setIsSheetOpen(true); };
  const handleDeleteClick = async (empresaId: string) => { if (window.confirm('¿Seguro?')) { const result = await deleteEmpresa(empresaId); if(result.success) { toast.success(result.message); fetchEmpresas(); } else { toast.error(result.error) } } };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8"><div><h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1><p className="text-muted-foreground">Crea, edita y administra las empresas de tus clientes.</p></div><Button onClick={handleCreateClick} className="mt-4 md:mt-0"><PlusCircle className="mr-2 h-4 w-4" />Crear Empresa</Button></div>
      <div className="mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input placeholder="Buscar por nombre o RUT..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div></div>
      {isLoading ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{Array.from({ length: 4 }).map((_, i) => <EmpresaCardSkeleton key={i} />)}</div>) : 
       filteredEmpresas.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredEmpresas.map((empresa) => (<Card key={empresa.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300"><CardHeader className="flex flex-row items-start justify-between"><div className="flex items-center space-x-4"><Avatar className="h-12 w-12"><AvatarImage src={`https://avatar.vercel.sh/${empresa.rut}.png?text=${empresa.nombre.substring(0,2)}`} alt={empresa.nombre} /><AvatarFallback>{empresa.nombre.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><CardTitle className="text-base">{empresa.nombre}</CardTitle><CardDescription>{empresa.rut}</CardDescription></div></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEditClick(empresa)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-50" onClick={() => handleDeleteClick(empresa.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></CardHeader><CardContent className="flex-grow"><div className="space-y-3 text-sm text-muted-foreground"><div className="flex items-start"><MapPin className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" /><span>{empresa.direccion ? `${empresa.direccion.calle} ${empresa.direccion.numero}, ${empresa.direccion.comuna.nombre}`: 'Sin dirección'}</span></div><div className="flex items-center"><Building className="mr-2 h-4 w-4 flex-shrink-0" /><span>{`${empresa._count.sucursales} Sucursales`}</span></div></div></CardContent><CardFooter><Button variant="outline" className="w-full">Ver Sucursales</Button></CardFooter></Card>))}</div>) : 
       (<div className="text-center py-16 border-2 border-dashed rounded-lg"><h3 className="text-xl font-semibold">No se encontraron empresas</h3><p className="text-muted-foreground mt-2">Prueba a cambiar el término de búsqueda o crea una nueva empresa.</p></div>)}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto"><SheetHeader><SheetTitle>{editingEmpresa ? `Editando: ${editingEmpresa.nombre}` : 'Crear Nueva Empresa'}</SheetTitle><SheetDescription>Completa los datos para {editingEmpresa ? 'actualizar la' : 'registrar una nueva'} empresa.</SheetDescription></SheetHeader><EmpresaForm empresa={editingEmpresa} comunas={comunas} closeSheet={handleCloseSheet}/></SheetContent></Sheet>
    </div>
  );
}
