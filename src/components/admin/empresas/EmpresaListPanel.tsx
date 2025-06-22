// RUTA: src/components/admin/empresas/EmpresaListPanel.tsx
'use client';

import * as React from 'react';
import { Loader2, Search, MoreVertical, Pencil, Trash2, Building, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner'; 
import { deleteEmpresa, type EmpresaConDetalles } from '@/app/actions/empresaActions'; // Importar el tipo desde actions

interface EmpresaListPanelProps {
    empresas: EmpresaConDetalles[]; 
    isLoading: boolean; 
    searchTerm: string; 
    onSearchTermChange: (term: string) => void; 
    selectedEmpresa: EmpresaConDetalles | null; 
    onSelectEmpresa: (empresa: EmpresaConDetalles) => void; 
    onEmpresaDeleted: () => void; 
}

const EmpresaCardSkeleton: React.FC = () => (
    <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                </div>
            </div>
            <Skeleton className="h-8 w-8" />
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[120px]" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);

export const EmpresaListPanel: React.FC<EmpresaListPanelProps> = ({
    empresas,
    isLoading,
    searchTerm,
    onSearchTermChange,
    selectedEmpresa,
    onSelectEmpresa,
    onEmpresaDeleted,
}) => {
    const handleDeleteClick = async (empresaId: string, empresaNombre: string) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la empresa "${empresaNombre}"? Esta acción no se puede deshacer.`)) {
            const result = await deleteEmpresa(empresaId);
            if (result.success) {
                toast.success(result.message);
                onEmpresaDeleted(); 
            } else {
                toast.error(result.message); 
            }
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden p-4">
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o RUT..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 relative">
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => <EmpresaCardSkeleton key={i} />)}
                    </div>
                ) : empresas.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {empresas.map((empresa) => (
                            <Card
                                key={empresa.id}
                                className={cn(
                                    "flex flex-col cursor-pointer transition-all duration-200",
                                    "hover:shadow-lg hover:border-primary/50",
                                    { "border-primary ring-2 ring-primary/50 shadow-lg": selectedEmpresa?.id === empresa.id }
                                )}
                                onClick={() => onSelectEmpresa(empresa)}
                            >
                                <CardHeader className="flex flex-row items-start justify-between pb-3">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={`https://avatar.vercel.sh/${empresa.rut}.png?text=${empresa.nombre.substring(0,2)}`} alt={empresa.nombre} />
                                            <AvatarFallback>{empresa.nombre.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">{empresa.nombre}</CardTitle>
                                            <CardDescription className="text-sm">{empresa.rut}</CardDescription>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onSelectEmpresa(empresa)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-red-500 focus:text-red-500 focus:bg-red-50" 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(empresa.id, empresa.nombre); }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="flex-grow pt-0 pb-3">
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-start">
                                            <MapPin className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>
                                                {empresa.direccion ? 
                                                    `${empresa.direccion.calle} ${empresa.direccion.numero}, ${empresa.direccion.comuna.nombre}` : 
                                                    'Sin dirección'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                                            <span>{`${empresa._count.sucursales} Sucursales`}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button variant="outline" className="w-full" onClick={() => onSelectEmpresa(empresa)}>
                                        Ver Detalles
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    !isLoading && (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <h3 className="text-xl font-semibold">No se encontraron empresas</h3>
                            <p className="text-muted-foreground mt-2">Prueba a cambiar el término de búsqueda o crea una nueva empresa.</p>
                        </div>
                    )
                )}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg animate-shimmer">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};
