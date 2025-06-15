'use client';

import React, { useState, useEffect } from 'react';
import { Direccion } from '@prisma/client'; // Importar el tipo de Prisma
import { EmpresaWithDireccion } from '@/app/actions/empresaActions';
import { getEmpresas, addEmpresa, updateEmpresa, deleteEmpresa } from '@/app/actions/empresaActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PencilIcon, Trash2Icon, SaveIcon, XCircleIcon, PlusCircleIcon } from 'lucide-react';

const EmpresasPage = () => {
  const [empresas, setEmpresas] = useState<EmpresaWithDireccion[]>([]);
  const [newEmpresaName, setNewEmpresaName] = useState('');
  const [newEmpresaRut, setNewEmpresaRut] = useState('');
  const [newEmpresaLogoUrl, setNewEmpresaLogoUrl] = useState('');
  // const [newEmpresaTelefono, setNewEmpresaTelefono] = useState('');
  // const [newEmpresaEmail, setNewEmpresaEmail] = useState('');
  const [newEmpresaDireccion, setNewEmpresaDireccion] = useState<Partial<Direccion>>({
    calle: '',
    numero: '',
    comuna: '',
    provincia: '',
    region: '',
    pais: '',
  });

  const [editingEmpresaId, setEditingEmpresaId] = useState<string | null>(null);
  const [editingEmpresaName, setEditingEmpresaName] = useState('');
  const [editingEmpresaRut, setEditingEmpresaRut] = useState('');
  const [editingEmpresaLogoUrl, setEditingEmpresaLogoUrl] = useState('');
  // const [editingEmpresaTelefono, setEditingEmpresaTelefono] = useState('');
  // const [editingEmpresaEmail, setEditingEmpresaEmail] = useState('');
  const [editingEmpresaDireccion, setEditingEmpresaDireccion] = useState<Partial<Direccion>>({
    calle: '',
    numero: '',
    comuna: '',
    provincia: '',
    region: '',
    pais: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmpresas();
  }, []);

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
      // telefono: newEmpresaTelefono.trim() || null,
      // email: newEmpresaEmail.trim() || null,
      direccion: newEmpresaDireccion.pais || newEmpresaDireccion.region || newEmpresaDireccion.provincia || newEmpresaDireccion.comuna || newEmpresaDireccion.calle || newEmpresaDireccion.numero ? newEmpresaDireccion : null,
    };
    const result = await addEmpresa(data);
    if (result.success) {
      setNewEmpresaName('');
      setNewEmpresaRut('');
      setNewEmpresaLogoUrl('');
      // setNewEmpresaTelefono('');
      // setNewEmpresaEmail('');
      setNewEmpresaDireccion({});
      toast.success("Empresa agregada exitosamente.");
      fetchEmpresas(); // Recargar la lista de empresas
    } else {
      toast.error(result.error || "Error al agregar la empresa.");
    }
  };

  const handleEditClick = (empresa: EmpresaWithDireccion) => {
    setEditingEmpresaId(empresa.id);
    setEditingEmpresaName(empresa.nombre);
    setEditingEmpresaRut(empresa.rut || '');
    setEditingEmpresaLogoUrl(empresa.logoUrl || '');
    // setEditingEmpresaTelefono(empresa.telefono || '');
    // setEditingEmpresaEmail(empresa.email || '');
    setEditingEmpresaDireccion({
      calle: empresa.direccion?.calle || '',
      numero: empresa.direccion?.numero || '',
      comuna: empresa.direccion?.comuna || '',
      provincia: empresa.direccion?.provincia || '',
      region: empresa.direccion?.region || '',
      pais: empresa.direccion?.pais || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingEmpresaId(null);
    setEditingEmpresaName('');
    setEditingEmpresaRut('');
    setEditingEmpresaLogoUrl('');
    // setEditingEmpresaTelefono('');
    // setEditingEmpresaEmail('');
    setEditingEmpresaDireccion({
      calle: '',
      numero: '',
      comuna: '',
      provincia: '',
      region: '',
      pais: '',
    });
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
      // telefono: editingEmpresaTelefono.trim() || null,
      // email: editingEmpresaEmail.trim() || null,
      direccion: editingEmpresaDireccion.pais || editingEmpresaDireccion.region || editingEmpresaDireccion.provincia || editingEmpresaDireccion.comuna || editingEmpresaDireccion.calle || editingEmpresaDireccion.numero ? editingEmpresaDireccion : null,
    };
    const result = await updateEmpresa(id, data);
    if (result.success) {
      toast.success("Empresa actualizada exitosamente.");
      setEditingEmpresaId(null);
      setEditingEmpresaName('');
      setEditingEmpresaRut('');
      setEditingEmpresaLogoUrl('');
      // setEditingEmpresaTelefono('');
      // setEditingEmpresaEmail('');
      setEditingEmpresaDireccion({
        calle: '',
        numero: '',
        comuna: '',
        provincia: '',
        region: '',
        pais: '',
      });
      fetchEmpresas(); // Recargar la lista de empresas
    } else {
      toast.error(result.error || "Error al actualizar la empresa.");
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer.")) {
      const result = await deleteEmpresa(id);
      if (result.success) {
        toast.success("Empresa eliminada exitosamente.");
        fetchEmpresas(); // Recargar la lista de empresas
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
            onChange={(e) => setNewEmpresaName(e.target.value)}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="RUT"
            value={newEmpresaRut}
            onChange={(e) => setNewEmpresaRut(e.target.value)}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="URL del Logo"
            value={newEmpresaLogoUrl}
            onChange={(e) => setNewEmpresaLogoUrl(e.target.value)}
          />
          {/* <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Teléfono"
            value={newEmpresaTelefono}
            onChange={(e) => setNewEmpresaTelefono(e.target.value)}
          />
          <Input
            type="email"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Email"
            value={newEmpresaEmail}
            onChange={(e) => setNewEmpresaEmail(e.target.value)}
          /> */}
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="País"
            value={newEmpresaDireccion.pais || ''}
            onChange={(e) => setNewEmpresaDireccion({ ...newEmpresaDireccion, pais: e.target.value })}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Región"
            value={newEmpresaDireccion.region || ''}
            onChange={(e) => setNewEmpresaDireccion({ ...newEmpresaDireccion, region: e.target.value })}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Provincia"
            value={newEmpresaDireccion.provincia || ''}
            onChange={(e) => setNewEmpresaDireccion({ ...newEmpresaDireccion, provincia: e.target.value })}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Comuna"
            value={newEmpresaDireccion.comuna || ''}
            onChange={(e) => setNewEmpresaDireccion({ ...newEmpresaDireccion, comuna: e.target.value })}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Calle"
            value={newEmpresaDireccion.calle || ''}
            onChange={(e) => setNewEmpresaDireccion({ ...newEmpresaDireccion, calle: e.target.value })}
          />
          <Input
            type="text"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Número"
            value={newEmpresaDireccion.numero || ''}
            onChange={(e) => setNewEmpresaDireccion({ ...newEmpresaDireccion, numero: e.target.value })}
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
                      onChange={(e) => setEditingEmpresaName(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre"
                    />
                    <Input
                      type="text"
                      value={editingEmpresaRut}
                      onChange={(e) => setEditingEmpresaRut(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="RUT"
                    />
                    <Input
                      type="text"
                      value={editingEmpresaLogoUrl}
                      onChange={(e) => setEditingEmpresaLogoUrl(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="URL Logo"
                    />
                    <Input
                      type="text"
                      className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      placeholder="Calle"
                      value={editingEmpresaDireccion.calle || ''}
                      onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, calle: e.target.value })}
                    />
                    <Input
                      type="text"
                      className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      placeholder="Número"
                      value={editingEmpresaDireccion.numero || ''}
                      onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, numero: e.target.value })}
                    />
                    <Input
                      type="text"
                      className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      placeholder="Comuna"
                      value={editingEmpresaDireccion.comuna || ''}
                      onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, comuna: e.target.value })}
                    />
                    <Input
                      type="text"
                      className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      placeholder="Provincia"
                      value={editingEmpresaDireccion.provincia || ''}
                      onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, provincia: e.target.value })}
                    />
                    <Input
                      type="text"
                      className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                      placeholder="Región"
                      value={editingEmpresaDireccion.region || ''}
                      onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, region: e.target.value })}
                />
                <Input
                  type="text"
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="Provincia"
                  value={editingEmpresaDireccion.provincia || ''}
                  onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, provincia: e.target.value })}
                />
                <Input
                  type="text"
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="Comuna"
                  value={editingEmpresaDireccion.comuna || ''}
                  onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, comuna: e.target.value })}
                />
                <Input
                  type="text"
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="Calle"
                  value={editingEmpresaDireccion.calle || ''}
                  onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, calle: e.target.value })}
                />
                <Input
                  type="text"
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="Número"
                  value={editingEmpresaDireccion.numero || ''}
                  onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, numero: e.target.value })}
                />
                <Input
                  type="text"
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  placeholder="País"
                  value={editingEmpresaDireccion.pais || ''}
                  onChange={(e) => setEditingEmpresaDireccion({ ...editingEmpresaDireccion, pais: e.target.value })}
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
                    {empresa.direccion && (
                    <div className="text-sm text-gray-600">
                      <p className="text-sm text-gray-600">Dirección: {empresa.direccion?.calle || 'N/A'} {empresa.direccion?.numero || ''}, {empresa.direccion?.comuna || 'N/A'}, {empresa.direccion?.provincia || 'N/A'}, {empresa.direccion?.region || 'N/A'}, {empresa.direccion?.pais || 'N/A'}</p>
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