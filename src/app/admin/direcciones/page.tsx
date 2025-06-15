'use client';

import React, { useState, useEffect } from 'react';
import { Direccion } from '@prisma/client';
import { getDirecciones, addDireccion, updateDireccion, deleteDireccion, DireccionInput } from '@/app/actions/direccionActions';

const DireccionesPage: React.FC = () => {
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [newDireccion, setNewDireccion] = useState<DireccionInput>({
    calle: '',
    numero: '',
    comuna: '',
    provincia: '',
    region: '',
    pais: '',
    empresaId: null,
  });
  const [editingDireccion, setEditingDireccion] = useState<Direccion | null>(null);

  useEffect(() => {
    fetchDirecciones();
  }, []);

  const fetchDirecciones = async () => {
    const fetchedDirecciones = await getDirecciones();
    setDirecciones(fetchedDirecciones);
  };

  const handleAddDireccion = async () => {
    await addDireccion(newDireccion);
    setNewDireccion({
      calle: '',
      numero: '',
      comuna: '',
      provincia: '',
      region: '',
      pais: '',
      empresaId: null,
    });
    fetchDirecciones();
  };

  const handleEditClick = (direccion: Direccion) => {
    setEditingDireccion(direccion);
    setNewDireccion({
      calle: direccion.calle || '',
      numero: direccion.numero || '',
      comuna: direccion.comuna || '',
      provincia: direccion.provincia || '',
      region: direccion.region || '',
      pais: direccion.pais || '',
      empresaId: direccion.empresaId || null,
    });
  };

  const handleUpdateDireccion = async () => {
    if (editingDireccion) {
      await updateDireccion(editingDireccion.id, newDireccion);
      setEditingDireccion(null);
      setNewDireccion({
        calle: '',
        numero: '',
        comuna: '',
        provincia: '',
        region: '',
        pais: '',
        empresaId: null,
      });
      fetchDirecciones();
    }
  };

  const handleDeleteDireccion = async (id: string) => {
    await deleteDireccion(id);
    fetchDirecciones();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Direcciones</h1>

      <div className="mb-8 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">{editingDireccion ? 'Editar Dirección' : 'Añadir Nueva Dirección'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Calle"
            value={newDireccion.calle}
            onChange={(e) => setNewDireccion({ ...newDireccion, calle: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Número"
            value={newDireccion.numero}
            onChange={(e) => setNewDireccion({ ...newDireccion, numero: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Comuna"
            value={newDireccion.comuna}
            onChange={(e) => setNewDireccion({ ...newDireccion, comuna: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Provincia"
            value={newDireccion.provincia}
            onChange={(e) => setNewDireccion({ ...newDireccion, provincia: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Región"
            value={newDireccion.region}
            onChange={(e) => setNewDireccion({ ...newDireccion, region: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="País"
            value={newDireccion.pais}
            onChange={(e) => setNewDireccion({ ...newDireccion, pais: e.target.value })}
            className="p-2 border rounded"
          />
        </div>
        {editingDireccion ? (
          <button
            onClick={handleUpdateDireccion}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Actualizar Dirección
          </button>
        ) : (
          <button
            onClick={handleAddDireccion}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Añadir Dirección
          </button>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Listado de Direcciones</h2>
        <ul className="space-y-2">
          {direcciones.map((direccion) => (
            <li key={direccion.id} className="p-4 border rounded flex justify-between items-center shadow-sm">
              <div>
                <p className="font-medium">{direccion.calle} {direccion.numero}, {direccion.comuna}, {direccion.provincia}, {direccion.region}, {direccion.pais}</p>
                <p className="text-sm text-gray-500">ID: {direccion.id}</p>
              </div>
              <div>
                <button
                  onClick={() => handleEditClick(direccion)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteDireccion(direccion.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DireccionesPage;