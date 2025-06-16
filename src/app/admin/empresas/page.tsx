'use client';

import React, { useState, useEffect } from 'react';
// Importa los tipos directamente de @prisma/client si es necesario, 
// o si confías en que tus migraciones los tienen.
import type { Direccion as PrismaDireccion } from '@prisma/client'; 

// Importa tu tipo EmpresaWithDireccion desde empresaActions.ts
import { EmpresaWithDireccion, getEmpresas, addEmpresa, updateEmpresa, deleteEmpresa } from '@/app/actions/empresaActions';
// Importa los tipos de comuna desde comunaActions.ts
import { getComunas, searchComunas, ComunaWithProvinciaAndRegion } from '@/app/actions/comunaActions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PencilIcon, Trash2Icon, SaveIcon, XCircleIcon, PlusCircleIcon } from 'lucide-react';

const EmpresasPage = () => {
  const [empresas, setEmpresas] = useState<EmpresaWithDireccion[]>([]);
  const [newEmpresaName, setNewEmpresaName] = useState('');
  const [newEmpresaRut, setNewEmpresaRut] = useState('');
  const [newEmpresaLogoUrl, setNewEmpresaLogoUrl] = useState('');
  // Usa PrismaDireccion para el tipo de newEmpresaDireccion
  const [newEmpresaDireccion, setNewEmpresaDireccion] = useState<Partial<PrismaDireccion>>({
    calle: '',
    numero: '',
    comunaId: ''
  });

  const [editingSearchTerm, setEditingSearchTerm] = useState('');
  const [editingFilteredComunas, setEditingFilteredComunas] = useState<ComunaWithProvinciaAndRegion[]>([]);
  const [editingSelectedComuna, setEditingSelectedComuna] = useState<ComunaWithProvinciaAndRegion | null>(null);

  const [comunas, setComunas] = useState<ComunaWithProvinciaAndRegion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredComunas, setFilteredComunas] = useState<ComunaWithProvinciaAndRegion[]>([]);
  const [selectedComuna, setSelectedComuna] = useState<ComunaWithProvinciaAndRegion | null>(null);

  const [editingEmpresaId, setEditingEmpresaId] = useState<string | null>(null);
  const [editingEmpresaName, setEditingEmpresaName] = useState('');
  const [editingEmpresaRut, setEditingEmpresaRut] = useState('');
  const [editingEmpresaLogoUrl, setEditingEmpresaLogoUrl] = useState('');
  // Usa PrismaDireccion para el tipo de editingEmpresaDireccion
  const [editingEmpresaDireccion, setEditingEmpresaDireccion] = useState<Partial<PrismaDireccion>>({
    calle: '',
    numero: '',
    comunaId: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmpresas();
    fetchComunas('');
  }, []);

  const fetchComunas = async (search: string) => {
    const result = await searchComunas(search);
    if (result.success) {
      setComunas(result.data);
      setFilteredComunas(result.data); // Inicialmente, mostrar todas las comunas
    } else {
      toast.error(result.error || "Error al cargar las comunas.");
    }
  };

  const handleSearchComuna = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 0) {
      const result = await searchComunas(term);
      if (result.success) {
        setFilteredComunas(result.data);
      } else {
        toast.error(result.error || "Error al buscar comunas.");
      }
    } else {
      setFilteredComunas(comunas);
    }
    setSelectedComuna(null);
    setNewEmpresaDireccion((prev: Partial<PrismaDireccion>) => ({ ...prev, comunaId: '' })); // Tipado para 'prev'
  };

  const handleSelectComuna = (comuna: ComunaWithProvinciaAndRegion) => {
    setSelectedComuna(comuna);
    setSearchTerm(comuna.nombre);
    setNewEmpresaDireccion((prev: Partial<PrismaDireccion>) => ({ ...prev, comunaId: comuna.id })); // Tipado para 'prev'
    setFilteredComunas([]);
  };

  const handleEditingSearchComuna = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setEditingSearchTerm(term);
    if (term.length > 0) {
      const result = await searchComunas(term);
      if (result.success) {
        setEditingFilteredComunas(result.data);
      } else {
        toast.error(result.error || "Error al buscar comunas.");
      }
    } else {
      setEditingFilteredComunas(comunas); // Mostrar todas si el campo está vacío
    }
    setEditingSelectedComuna(null);
    setEditingEmpresaDireccion((prev: Partial<PrismaDireccion>) => ({ ...prev, comunaId: '' })); // Tipado para 'prev'
  };

  const handleEditingSelectComuna = (comuna: ComunaWithProvinciaAndRegion) => {
    setEditingSelectedComuna(comuna);
    setEditingSearchTerm(comuna.nombre);
    setEditingEmpresaDireccion((prev: Partial<PrismaDireccion>) => ({ ...prev, comunaId: comuna.id })); // Tipado para 'prev'
    setEditingFilteredComunas([]);
  };

  const fetchEmpresas = async () => {
    setLoading(true);
    setError(null);
    const result = await getEmpresas();
    if (result.success) {
      setEmpresas(result.data || []);
    } else {
      setError(result.error || "Error al cargar las empresas.");
      toast.error(result.error || "Error al cargar las empresas.");
    }
    setLoading(false);
  };

  const handleAddEmpresa = async () => {
    if (newEmpresaName.trim() === '') {
      toast.error("El nombre de la empresa no puede estar vacío.");
      return;
    }
    const data = {
      nombre: newEmpresaName.trim(),
      rut: newEmpresaRut.trim() || null,
      logoUrl: newEmpresaLogoUrl.trim() || null,
      direccion: newEmpresaDireccion.calle || newEmpresaDireccion.numero || newEmpresaDireccion.comunaId ? newEmpresaDireccion : null,
    };
    const result = await addEmpresa(data);
    if (result.success) {
      setNewEmpresaName('');
      setNewEmpresaRut('');
      setNewEmpresaLogoUrl('');
      setNewEmpresaDireccion({});
      toast.success("Empresa agregada exitosamente.");
      fetchEmpresas();
    } else {
      toast.error(result.error || "Error al agregar la empresa.");
    }
  };

  const handleEditClick = (empresa: EmpresaWithDireccion) => {
    setEditingEmpresaId(empresa.id);
    setEditingEmpresaName(empresa.nombre);
    setEditingEmpresaRut(empresa.rut || '');
    setEditingEmpresaLogoUrl(empresa.logoUrl || '');
    setEditingEmpresaDireccion({
      calle: empresa.direccionComercial?.calle || '',
      numero: empresa.direccionComercial?.numero || '',
      comunaId: empresa.direccionComercial?.comunaId || ''
    });
    if (empresa.direccionComercial?.comunaId) {
      const comuna = comunas.find(c => c.id === empresa.direccionComercial?.comunaId);
      if (comuna) {
        setEditingSelectedComuna(comuna);
        setEditingSearchTerm(comuna.nombre);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingEmpresaId(null);
    setEditingEmpresaName('');
    setEditingEmpresaRut('');
    setEditingEmpresaLogoUrl('');
    setEditingEmpresaDireccion({});
  };

  const handleSaveEdit = async (id: string) => {
    if (editingEmpresaName.trim() === '') {
      toast.error("El nombre de la empresa no puede estar vacío.");
      return;
    }
    const data = {
      nombre: editingEmpresaName.trim(),
      rut: editingEmpresaRut.trim() || null,
      logoUrl: editingEmpresaLogoUrl.trim() || null,
      direccion: editingEmpresaDireccion.calle || editingEmpresaDireccion.numero || editingEmpresaDireccion.comunaId ? editingEmpresaDireccion : null,
    };
    const result = await updateEmpresa(id, data);
    if (result.success) {
      toast.success("Empresa actualizada exitosamente.");
      setEditingEmpresaId(null);
      setEditingEmpresaName('');
      setEditingEmpresaRut('');
      setEditingEmpresaLogoUrl('');
      setEditingEmpresaDireccion({});
      fetchEmpresas();
    } else {
      toast.error(result.error || "Error al actualizar la empresa.");
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer.")) {
      const result = await deleteEmpresa(id);
      if (result.success) {
        toast.success("Empresa eliminada exitosamente.");
        fetchEmpresas();
      } else {
        toast.error(result.error || "Error al eliminar la empresa.");
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Cargando empresas...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Empresas</h1>

      <div className="mb-8 p-6 border border-gray-200 rounded-xl shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Agregar Nueva Empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Nombre de la nueva empresa"
            value={newEmpresaName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmpresaName(e.target.value)}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="RUT"
            value={newEmpresaRut}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmpresaRut(e.target.value)}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="URL del Logo"
            value={newEmpresaLogoUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmpresaLogoUrl(e.target.value)}
          />


          <div className="relative">
            <Input
              type="text"
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              placeholder="Buscar Comuna"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchComuna(e)}
            />
            {searchTerm.length > 0 && filteredComunas.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                {filteredComunas.map((comuna) => (
                  <li
                    key={comuna.id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSelectComuna(comuna)}
                  >
                    {comuna.nombre} ({comuna.provincia.nombre}, {comuna.provincia.region.nombre})
                  </li>
                ))}
              </ul>
            )}
            {selectedComuna && (
              <p className="text-sm text-gray-500 mt-1">Seleccionado: {selectedComuna.nombre}</p>
            )}
          </div>
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Calle"
            value={newEmpresaDireccion.calle || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmpresaDireccion({ ...newEmpresaDireccion, calle: e.target.value })}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Número"
            value={newEmpresaDireccion.numero || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmpresaDireccion({ ...newEmpresaDireccion, numero: e.target.value })}
          />
        </div>
        <Button
          onClick={handleAddEmpresa}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 w-full"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" /> Agregar Empresa
        </Button>
      </div>

      <div className="p-6 border border-gray-200 rounded-xl shadow-lg bg-white">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Listado de Empresas</h2>
        {empresas.length === 0 ? (
          <p className="text-gray-600">No hay empresas registradas.</p>
        ) : (
          <ul className="space-y-3">
            {empresas.map((empresa) => (
              <li key={empresa.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm">
                {editingEmpresaId === empresa.id ? (
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    <Input
                      type="text"
                      value={editingEmpresaName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEmpresaName(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre"
                    />
                    <Input
                      type="text"
                      value={editingEmpresaRut}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEmpresaRut(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="RUT"
                    />
                    <Input
                      type="text"
                      value={editingEmpresaLogoUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEmpresaLogoUrl(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="URL Logo"
                    />
                    <div className="relative">
                      <Input
                        type="text"
                        className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                        placeholder="Buscar Comuna"
                        value={editingSearchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEditingSearchComuna(e)}
                      />
                      {editingSearchTerm.length > 0 && editingFilteredComunas.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                          {editingFilteredComunas.map((comuna) => (
                            <li
                              key={comuna.id}
                              className="p-2 cursor-pointer hover:bg-gray-100"
                              onClick={() => handleEditingSelectComuna(comuna)}
                            >
                              {comuna.nombre} ({comuna.provincia.nombre}, {comuna.provincia.region.nombre})
                            </li>
                          ))}
                        </ul>
                      )}
                      {editingSelectedComuna && (
                        <p className="text-sm text-gray-500 mt-1">Seleccionado: {editingSelectedComuna.nombre}</p>
                      )}
                    </div>
                    <Input
                      type="text"
                      className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      placeholder="Calle"
                      value={editingEmpresaDireccion.calle || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, calle: e.target.value })}
                    />
                    <Input
                      type="text"
                      className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      placeholder="Número"
                      value={editingEmpresaDireccion.numero || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, numero: e.target.value })}
                    />

                <div className="flex space-x-2 col-span-full justify-end">
                      <Button
                        onClick={() => handleSaveEdit(empresa.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
                        size="sm"
                      >
                        <SaveIcon className="h-4 w-4" /> Guardar
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                        size="sm"
                      >
                        <XCircleIcon className="h-4 w-4" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-medium text-gray-800">{empresa.nombre}</span>
                    {empresa.rut && <span className="text-sm text-gray-600">RUT: {empresa.rut}</span>}
                    {empresa.logoUrl && <span className="text-sm text-gray-600">Logo: <a href={empresa.logoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{empresa.logoUrl}</a></span>}
                    {empresa.direccionComercial && (
                    <div className="text-sm text-gray-600">
      <p className="text-sm text-gray-600">Dirección: {empresa.direccionComercial?.calle || 'N/A'} {empresa.direccionComercial?.numero || ''}, {comunas.find(c => c.id === empresa.direccionComercial?.comunaId)?.nombre || 'N/A'}</p>
                    </div>
                  )}
                  </div>
                )}
                <div className="flex space-x-2 mt-3 md:mt-0">
                  {editingEmpresaId !== empresa.id && (
                    <Button
                      onClick={() => handleEditClick(empresa)}
                      className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-200"
                      size="sm"
                    >
                      <PencilIcon className="h-4 w-4" /> Editar
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteEmpresa(empresa.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                    size="sm"
                  >
                    <Trash2Icon className="h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmpresasPage;
