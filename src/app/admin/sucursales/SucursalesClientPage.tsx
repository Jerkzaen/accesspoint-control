"use client";

import React, { useState, useEffect } from 'react';
import { Sucursal, Empresa, Direccion, Comuna, Prisma } from '@prisma/client';
import { getSucursales, addSucursal, updateSucursal, deleteSucursal, SucursalInput } from '../../actions/sucursalActions';
import { getEmpresas } from '@/app/actions/empresaActions';
import { searchComunas, getComunaById } from '@/app/actions/geografiaActions';
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

type SucursalWithRelations = Prisma.SucursalGetPayload<{
  include: {
    empresa: true;
    direccion: {
      include: {
        comuna: {
          include: {
            provincia: {
              include: {
                region: {
                  include: {
                    pais: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

type ComunaWithRelations = Prisma.ComunaGetPayload<{
  include: {
    provincia: {
      include: {
        region: {
          include: {
            pais: true;
          };
        };
      };
    };
  };
}>;

interface SucursalesClientPageProps {
  initialSucursales: SucursalWithRelations[];
  initialEmpresas: Empresa[];
}

const SucursalesClientPage: React.FC<SucursalesClientPageProps> = ({ initialSucursales, initialEmpresas }) => {
  const [sucursales, setSucursales] = useState<SucursalWithRelations[]>(initialSucursales);
  const [empresas, setEmpresas] = useState<Empresa[]>(initialEmpresas);
  const [newSucursal, setNewSucursal] = useState<SucursalInput>({
    nombre: '',
    telefono: '',
    email: '',
    direccionCalle: '',
    direccionNumero: '',
    direccionComunaId: '',
    empresaId: '',
  });
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);

  const [comunas, setComunas] = useState<ComunaWithRelations[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedSucursal, setSelectedSucursal] = useState<SucursalWithRelations | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // No es necesario cargar sucursales y empresas aquí, ya se pasan como props iniciales
  }, []);

  const loadSucursales = async () => {
    const fetchedSucursales = await getSucursales();
    setSucursales(fetchedSucursales as SucursalWithRelations[]);
  };

  const loadEmpresas = async () => {
    const result = await getEmpresas();
    if (result.success) {
      setEmpresas(result.data);
    } else {
      console.error("Error fetching empresas:", result.error);
    }
  };

  const handleChange = (field: keyof SucursalInput, value: string) => {
    setNewSucursal((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleComunaSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      const results = await searchComunas(query);
      setComunas(results);
    } else {
      setComunas([]);
    }
  };

  const handleSelectComuna = (comuna: ComunaWithRelations) => {
    setNewSucursal((prev) => ({
      ...prev,
      direccionComunaId: comuna.id, // Store the ID
    }));
    setSearchQuery(comuna.nombre); // Display the name in the input
    setComunas([]); // Clear search results
  };

  const handleAddSucursal = async () => {
    await addSucursal(newSucursal);
    setNewSucursal({
      nombre: '',
      telefono: '',
      email: '',
      direccionCalle: '',
      direccionNumero: '',
      direccionComunaId: '',
      empresaId: '',
    });
    loadSucursales();
  };

  const handleEditClick = async (sucursal: SucursalWithRelations) => {
    setEditingSucursal(sucursal);
    setNewSucursal({
      nombre: sucursal.nombre || '',
      telefono: sucursal.telefono || '',
      email: sucursal.email || '',
      direccionCalle: sucursal.direccion?.calle || '',
      direccionNumero: sucursal.direccion?.numero || '',
      direccionComunaId: sucursal.direccion?.comunaId || '',
      empresaId: sucursal.empresaId || '',
    });

    if (sucursal.direccion?.comunaId) {
      const comuna = await getComunaById(sucursal.direccion.comunaId);
      if (comuna) {
        setSearchQuery(comuna.nombre);
      }
    }
  };

  const handleUpdateSucursal = async () => {
    if (editingSucursal) {
      await updateSucursal(editingSucursal.id, newSucursal);
      setEditingSucursal(null);
      setNewSucursal({
        nombre: '',
        telefono: '',
        email: '',
        direccionCalle: '',
        direccionNumero: '',
        direccionComunaId: '',
        empresaId: '',
      });
      loadSucursales();
    }
  };

  const handleDeleteSucursal = async (id: string) => {
    await deleteSucursal(id);
    loadSucursales();
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="#">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="#">Sucursales</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar sucursales..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                Gestión de Sucursales
              </h1>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card x-chunk="dashboard-07-chunk-0">
                  <CardHeader>
                    <CardTitle>Añadir Nueva Sucursal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label htmlFor="nombre">Nombre de la Sucursal</Label>
                <Input
                  id="nombre"
                  placeholder="Nombre de la Sucursal"
                  value={newSucursal.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="empresa">Empresa Asociada</Label>
                <select
                  id="empresa"
                  value={newSucursal.empresaId}
                  onChange={(e) => handleChange('empresaId', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccione una empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="direccionCalle">Calle de la Dirección</Label>
                          <Input
                            id="direccionCalle"
                            type="text"
                            value={newSucursal.direccionCalle}
                            onChange={(e) =>
                              setNewSucursal({ ...newSucursal, direccionCalle: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="direccionNumero">Número de la Dirección</Label>
                          <Input
                            id="direccionNumero"
                            value={newSucursal.direccionNumero}
                            onChange={(e) => handleChange('direccionNumero', e.target.value)}
                            placeholder="Número de la Dirección"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comunaSearch">Comuna</Label>
                        <div className="relative">
                          <Input
                            id="comunaSearch"
                            type="text"
                            placeholder="Buscar Comuna"
                            value={searchQuery}
                            onChange={handleComunaSearchChange}
                          />
                          {comunas.length > 0 && searchQuery && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {comunas.map((comuna: ComunaWithRelations) => (
                                <li
                                  key={comuna.id}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleSelectComuna(comuna)}
                                >
                                  {comuna.nombre}, {comuna.provincia.nombre}, {comuna.provincia.region.nombre}, {comuna.provincia.region.pais.nombre}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {newSucursal.direccionComunaId && (
                          <p className="text-sm text-gray-600">
                            Comuna seleccionada: {searchQuery}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button onClick={editingSucursal ? handleUpdateSucursal : handleAddSucursal}>
                      {editingSucursal ? 'Actualizar Sucursal' : 'Añadir Sucursal'}
                    </Button>
                  </CardFooter>
                </Card>
                <Card x-chunk="dashboard-07-chunk-1">
                  <CardHeader>
                    <CardTitle>Listado de Sucursales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Dirección</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sucursales.map((sucursal) => (
                          <TableRow key={sucursal.id}>
                            <TableCell className="font-medium">{sucursal.nombre}</TableCell>
                            <TableCell>{sucursal.telefono}</TableCell>
                            <TableCell>{sucursal.email}</TableCell>
                            <TableCell>
                              {sucursal.direccion?.calle} {sucursal.direccion?.numero},
                              {sucursal.direccion?.comuna?.nombre}
                            </TableCell>
                            <TableCell>{sucursal.empresa?.nombre}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(sucursal)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteSucursal(sucursal.id)}
                                className="ml-2"
                              >
                                Eliminar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SucursalesClientPage;