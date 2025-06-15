"use client";

import React, { useState, useEffect } from 'react';
import { Sucursal, Empresa, Direccion, Comuna, Provincia, Region, Pais, Prisma } from '@prisma/client';
import { getSucursales, addSucursal, updateSucursal, deleteSucursal, SucursalInput } from '../../actions/sucursalActions';
import { getEmpresas } from '@/app/actions/empresaActions';
import { getRegiones, getProvincias, getComunas, getComunaById } from '@/app/actions/geografiaActions';

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

interface SucursalesClientPageProps {
  initialSucursales: SucursalWithRelations[];
  initialEmpresas: Empresa[];
  initialPaises: Pais[];
}

export const SucursalesClientPage: React.FC<SucursalesClientPageProps> = ({
  initialSucursales,
  initialEmpresas,
  initialPaises,
}) => {
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

  const [paises, setPaises] = useState<Pais[]>(initialPaises);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);

  const [selectedPais, setSelectedPais] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProvincia, setSelectedProvincia] = useState<string | null>(null);
  const [selectedComuna, setSelectedComuna] = useState<string | null>(null);

  useEffect(() => {
    // No need to fetch initially, data comes from props
  }, []);

  useEffect(() => {
    if (selectedPais) {
      fetchRegiones(selectedPais);
    } else {
      setRegiones([]);
      setSelectedRegion(null);
    }
  }, [selectedPais]);

  useEffect(() => {
    if (selectedRegion) {
      fetchProvincias(selectedRegion);
    } else {
      setProvincias([]);
      setSelectedProvincia(null);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedProvincia) {
      fetchComunas(selectedProvincia);
    } else {
      setComunas([]);
      setSelectedComuna(null);
    }
  }, [selectedProvincia]);

  useEffect(() => {
    setNewSucursal((prev: SucursalInput) => ({ ...prev, direccionComunaId: selectedComuna || '' }));
  }, [selectedComuna]);

  const fetchSucursales = async () => {
    const fetchedSucursales = await getSucursales();
    setSucursales(fetchedSucursales as SucursalWithRelations[]);
  };

  const fetchEmpresas = async () => {
    const result = await getEmpresas();
    if (result.success) {
      setEmpresas(result.data);
    } else {
      console.error("Error fetching empresas:", result.error);
    }
  };

  // No need for fetchPaises, data comes from props



  const fetchRegiones = async (paisId: string) => {
    const fetchedRegiones = await getRegiones(paisId);
    setRegiones(fetchedRegiones);
  };

  const fetchProvincias = async (regionId: string) => {
    const fetchedProvincias = await getProvincias(regionId);
    setProvincias(fetchedProvincias);
  };

  const fetchComunas = async (provinciaId: string) => {
    const fetchedComunas = await getComunas(provinciaId);
    setComunas(fetchedComunas);
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
    setSelectedPais(null);
    setSelectedRegion(null);
    setSelectedProvincia(null);
    setSelectedComuna(null);
    fetchSucursales();
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
        setSelectedPais(comuna.provincia.region.pais.id);
        setSelectedRegion(comuna.provincia.region.id);
        setSelectedProvincia(comuna.provincia.id);
        setSelectedComuna(comuna.id);
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
      setSelectedPais(null);
      setSelectedRegion(null);
      setSelectedProvincia(null);
      setSelectedComuna(null);
      fetchSucursales();
    }
  };

  const handleDeleteSucursal = async (id: string) => {
    await deleteSucursal(id);
    fetchSucursales();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Sucursales</h1>

      <div className="mb-8 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">{editingSucursal ? 'Editar Sucursal' : 'Añadir Nueva Sucursal'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nombre de la Sucursal"
            value={newSucursal.nombre}
            onChange={(e) => setNewSucursal({ ...newSucursal, nombre: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={newSucursal.telefono}
            onChange={(e) => setNewSucursal({ ...newSucursal, telefono: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={newSucursal.email}
            onChange={(e) => setNewSucursal({ ...newSucursal, email: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Calle de la Dirección"
            value={newSucursal.direccionCalle}
            onChange={(e) => setNewSucursal({ ...newSucursal, direccionCalle: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Número de la Dirección"
            value={newSucursal.direccionNumero}
            onChange={(e) => setNewSucursal({ ...newSucursal, direccionNumero: e.target.value })}
            className="p-2 border rounded"
          />

          <select
            value={newSucursal.empresaId || ''}
            onChange={(e) => setNewSucursal({ ...newSucursal, empresaId: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">Seleccionar Empresa (Opcional)</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
            ))}
          </select>

          <select
            value={selectedPais || ''}
            onChange={(e) => setSelectedPais(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Seleccionar País</option>
            {paises.map((pais) => (
              <option key={pais.id} value={pais.id}>{pais.nombre}</option>
            ))}
          </select>

          <select
            value={selectedRegion || ''}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="p-2 border rounded"
            disabled={!selectedPais}
          >
            <option value="">Seleccionar Región</option>
            {regiones.map((region) => (
              <option key={region.id} value={region.id}>{region.nombre}</option>
            ))}
          </select>

          <select
            value={selectedProvincia || ''}
            onChange={(e) => setSelectedProvincia(e.target.value)}
            className="p-2 border rounded"
            disabled={!selectedRegion}
          >
            <option value="">Seleccionar Provincia</option>
            {provincias.map((provincia) => (
              <option key={provincia.id} value={provincia.id}>{provincia.nombre}</option>
            ))}
          </select>

          <select
            value={selectedComuna || ''}
            onChange={(e) => setSelectedComuna(e.target.value)}
            className="p-2 border rounded"
            disabled={!selectedProvincia}
          >
            <option value="">Seleccionar Comuna</option>
            {comunas.map((comuna) => (
              <option key={comuna.id} value={comuna.id}>{comuna.nombre}</option>
            ))}
          </select>
        </div>
        {editingSucursal ? (
          <button
            onClick={handleUpdateSucursal}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Actualizar Sucursal
          </button>
        ) : (
          <button
            onClick={handleAddSucursal}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Añadir Sucursal
          </button>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Listado de Sucursales</h2>
        <ul className="space-y-2">
          {sucursales.map((sucursal) => (
            <li key={sucursal.id} className="p-4 border rounded flex justify-between items-center shadow-sm">
              <div>
                <p className="font-medium">{sucursal.nombre}</p>
                <p>{sucursal.empresa?.nombre || 'N/A'}</p>
                <p>{sucursal.telefono} | {sucursal.email}</p>
                <p className="text-sm text-gray-500">
                  {sucursal.direccion?.calle || 'N/A'} {sucursal.direccion?.numero || 'N/A'},
                  {sucursal.direccion?.comuna?.nombre || 'N/A'},
                  {sucursal.direccion?.comuna?.provincia?.nombre || 'N/A'},
                  {sucursal.direccion?.comuna?.provincia?.region?.nombre || 'N/A'},
                  {sucursal.direccion?.comuna?.provincia?.region?.pais?.nombre || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">ID: {sucursal.id}</p>
              </div>
              <div>
                <button
                  onClick={() => handleEditClick(sucursal)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteSucursal(sucursal.id)}
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

export default SucursalesClientPage;