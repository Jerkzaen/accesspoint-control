"use client";
import React, { useState, useEffect } from 'react';
import { Pais, Region, Provincia, Comuna } from '@prisma/client';
import {
  getPaises, addPais, updatePais, deletePais, PaisInput,
  getRegiones, addRegion, updateRegion, deleteRegion, RegionInput,
  getProvincias, addProvincia, updateProvincia, deleteProvincia, ProvinciaInput,
  getComunas, addComuna, updateComuna, deleteComuna, ComunaInput,
} from '@/app/actions/geografiaActions';

interface GeografiaClientPageProps {
  initialPaises: Pais[];
}

const GeografiaClientPage: React.FC<GeografiaClientPageProps> = ({ initialPaises }) => {
  // Estados para Países
  const [paises, setPaises] = useState<Pais[]>(initialPaises);
  const [newPaisName, setNewPaisName] = useState<string>('');
  const [editingPais, setEditingPais] = useState<Pais | null>(null);

  // Estados para Regiones
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [newRegionName, setNewRegionName] = useState<string>('');
  const [selectedPaisForRegion, setSelectedPaisForRegion] = useState<string>('');
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);

  // Estados para Provincias
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [newProvinciaName, setNewProvinciaName] = useState<string>('');
  const [selectedRegionForProvincia, setSelectedRegionForProvincia] = useState<string>('');
  const [editingProvincia, setEditingProvincia] = useState<Provincia | null>(null);

  // Estados para Comunas
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [newComunaName, setNewComunaName] = useState<string>('');
  const [selectedProvinciaForComuna, setSelectedProvinciaForComuna] = useState<string>('');
  const [editingComuna, setEditingComuna] = useState<Comuna | null>(null);

  const loadPaises = async () => {
    const fetchedPaises = await getPaises();
    setPaises(fetchedPaises);
  };

  useEffect(() => {
    // No es necesario llamar a loadPaises aquí, ya que initialPaises se pasa como prop
    // y se usa para inicializar el estado.
    // Si se necesita recargar los países, se puede llamar a loadPaises() explícitamente.
  }, []);

  useEffect(() => {
    if (selectedPaisForRegion) {
      fetchRegiones(selectedPaisForRegion);
    } else {
      setRegiones([]);
    }
  }, [selectedPaisForRegion]);

  useEffect(() => {
    if (selectedRegionForProvincia) {
      fetchProvincias(selectedRegionForProvincia);
    } else {
      setProvincias([]);
    }
  }, [selectedRegionForProvincia]);

  useEffect(() => {
    if (selectedProvinciaForComuna) {
      fetchComunas(selectedProvinciaForComuna);
    } else {
      setComunas([]);
    }
  }, [selectedProvinciaForComuna]);

  // --- Funciones para Países ---

  const handleAddPais = async () => {
    if (newPaisName.trim() === '') return;
    await addPais({ nombre: newPaisName });
    setNewPaisName('');
    loadPaises();

  };

  const handleEditPaisClick = (pais: Pais) => {
    setEditingPais(pais);
    setNewPaisName(pais.nombre);
  };

  const handleUpdatePais = async () => {
    if (editingPais && newPaisName.trim() !== '') {
      await updatePais(editingPais.id, { nombre: newPaisName });
      setEditingPais(null);
      setNewPaisName('');
      loadPaises();

    }
  };

  const handleDeletePais = async (id: string) => {
    await deletePais(id);
    loadPaises();

  };

  // --- Funciones para Regiones ---
  const fetchRegiones = async (paisId: string) => {
    const fetchedRegiones = await getRegiones(paisId);
    setRegiones(fetchedRegiones);
  };

  const handleAddRegion = async () => {
    if (newRegionName.trim() === '' || !selectedPaisForRegion) return;
    await addRegion({ nombre: newRegionName, paisId: selectedPaisForRegion });
    setNewRegionName('');
    fetchRegiones(selectedPaisForRegion);
  };

  const handleEditRegionClick = (region: Region) => {
    setEditingRegion(region);
    setNewRegionName(region.nombre);
    setSelectedPaisForRegion(region.paisId);
  };

  const handleUpdateRegion = async () => {
    if (editingRegion && newRegionName.trim() !== '' && selectedPaisForRegion) {
      await updateRegion(editingRegion.id, { nombre: newRegionName, paisId: selectedPaisForRegion });
      setEditingRegion(null);
      setNewRegionName('');
      fetchRegiones(selectedPaisForRegion);
    }
  };

  const handleDeleteRegion = async (id: string) => {
    await deleteRegion(id);
    if (selectedPaisForRegion) {
      fetchRegiones(selectedPaisForRegion);
    }
  };

  // --- Funciones para Provincias ---
  const fetchProvincias = async (regionId: string) => {
    const fetchedProvincias = await getProvincias(regionId);
    setProvincias(fetchedProvincias);
  };

  const handleAddProvincia = async () => {
    if (newProvinciaName.trim() === '' || !selectedRegionForProvincia) return;
    await addProvincia({ nombre: newProvinciaName, regionId: selectedRegionForProvincia });
    setNewProvinciaName('');
    fetchProvincias(selectedRegionForProvincia);
  };

  const handleEditProvinciaClick = (provincia: Provincia) => {
    setEditingProvincia(provincia);
    setNewProvinciaName(provincia.nombre);
    setSelectedRegionForProvincia(provincia.regionId);
  };

  const handleUpdateProvincia = async () => {
    if (editingProvincia && newProvinciaName.trim() !== '' && selectedRegionForProvincia) {
      await updateProvincia(editingProvincia.id, { nombre: newProvinciaName, regionId: selectedRegionForProvincia });
      setEditingProvincia(null);
      setNewProvinciaName('');
      fetchProvincias(selectedRegionForProvincia);
    }
  };

  const handleDeleteProvincia = async (id: string) => {
    await deleteProvincia(id);
    if (selectedRegionForProvincia) {
      fetchProvincias(selectedRegionForProvincia);
    }
  };

  // --- Funciones para Comunas ---
  const fetchComunas = async (provinciaId: string) => {
    const fetchedComunas = await getComunas(provinciaId);
    setComunas(fetchedComunas);
  };

  const handleAddComuna = async () => {
    if (newComunaName.trim() === '' || !selectedProvinciaForComuna) return;
    await addComuna({ nombre: newComunaName, provinciaId: selectedProvinciaForComuna });
    setNewComunaName('');
    fetchComunas(selectedProvinciaForComuna);
  };

  const handleEditComunaClick = (comuna: Comuna) => {
    setEditingComuna(comuna);
    setNewComunaName(comuna.nombre);
    setSelectedProvinciaForComuna(comuna.provinciaId);
  };

  const handleUpdateComuna = async () => {
    if (editingComuna && newComunaName.trim() !== '' && selectedProvinciaForComuna) {
      await updateComuna(editingComuna.id, { nombre: newComunaName, provinciaId: selectedProvinciaForComuna });
      setEditingComuna(null);
      setNewComunaName('');
      fetchComunas(selectedProvinciaForComuna);
    }
  };

  const handleDeleteComuna = async (id: string) => {
    await deleteComuna(id);
    if (selectedProvinciaForComuna) {
      fetchComunas(selectedProvinciaForComuna);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Datos Geográficos</h1>

      {/* Sección de Países */}
      <div className="mb-8 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Países</h2>
        <div className="flex mb-4">
          <input
            type="text"
            placeholder="Nombre del País"
            value={newPaisName}
            onChange={(e) => setNewPaisName(e.target.value)}
            className="p-2 border rounded flex-grow"
          />
          {editingPais ? (
            <button
              onClick={handleUpdatePais}
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Actualizar País
            </button>
          ) : (
            <button
              onClick={handleAddPais}
              className="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Añadir País
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {paises.map((pais) => (
            <li key={pais.id} className="p-2 border rounded flex justify-between items-center">
              <span>{pais.nombre}</span>
              <div>
                <button
                  onClick={() => handleEditPaisClick(pais)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeletePais(pais.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Sección de Regiones */}
      <div className="mb-8 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Regiones</h2>
        <div className="mb-4">
          <label htmlFor="select-pais-region" className="block text-sm font-medium text-gray-700">Seleccionar País:</label>
          <select
            id="select-pais-region"
            value={selectedPaisForRegion}
            onChange={(e) => setSelectedPaisForRegion(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Seleccionar País --</option>
            {paises.map((pais) => (
              <option key={pais.id} value={pais.id}>{pais.nombre}</option>
            ))}
          </select>
        </div>
        {selectedPaisForRegion && (
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Nombre de la Región"
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
              className="p-2 border rounded flex-grow"
            />
            {editingRegion ? (
              <button
                onClick={handleUpdateRegion}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Actualizar Región
              </button>
            ) : (
              <button
                onClick={handleAddRegion}
                className="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Añadir Región
              </button>
            )}
          </div>
        )}
        <ul className="space-y-2">
          {regiones.map((region) => (
            <li key={region.id} className="p-2 border rounded flex justify-between items-center">
              <span>{region.nombre}</span>
              <div>
                <button
                  onClick={() => handleEditRegionClick(region)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteRegion(region.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Sección de Provincias */}
      <div className="mb-8 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Provincias</h2>
        <div className="mb-4">
          <label htmlFor="select-region-provincia" className="block text-sm font-medium text-gray-700">Seleccionar Región:</label>
          <select
            id="select-region-provincia"
            value={selectedRegionForProvincia}
            onChange={(e) => setSelectedRegionForProvincia(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Seleccionar Región --</option>
            {regiones.map((region) => (
              <option key={region.id} value={region.id}>{region.nombre}</option>
            ))}
          </select>
        </div>
        {selectedRegionForProvincia && (
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Nombre de la Provincia"
              value={newProvinciaName}
              onChange={(e) => setNewProvinciaName(e.target.value)}
              className="p-2 border rounded flex-grow"
            />
            {editingProvincia ? (
              <button
                onClick={handleUpdateProvincia}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Actualizar Provincia
              </button>
            ) : (
              <button
                onClick={handleAddProvincia}
                className="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Añadir Provincia
              </button>
            )}
          </div>
        )}
        <ul className="space-y-2">
          {provincias.map((provincia) => (
            <li key={provincia.id} className="p-2 border rounded flex justify-between items-center">
              <span>{provincia.nombre}</span>
              <div>
                <button
                  onClick={() => handleEditProvinciaClick(provincia)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteProvincia(provincia.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Sección de Comunas */}
      <div className="mb-8 p-4 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Comunas</h2>
        <div className="mb-4">
          <label htmlFor="select-provincia-comuna" className="block text-sm font-medium text-gray-700">Seleccionar Provincia:</label>
          <select
            id="select-provincia-comuna"
            value={selectedProvinciaForComuna}
            onChange={(e) => setSelectedProvinciaForComuna(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Seleccionar Provincia --</option>
            {provincias.map((provincia) => (
              <option key={provincia.id} value={provincia.id}>{provincia.nombre}</option>
            ))}
          </select>
        </div>
        {selectedProvinciaForComuna && (
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Nombre de la Comuna"
              value={newComunaName}
              onChange={(e) => setNewComunaName(e.target.value)}
              className="p-2 border rounded flex-grow"
            />
            {editingComuna ? (
              <button
                onClick={handleUpdateComuna}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Actualizar Comuna
              </button>
            ) : (
              <button
                onClick={handleAddComuna}
                className="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Añadir Comuna
              </button>
            )}
          </div>
        )}
        <ul className="space-y-2">
          {comunas.map((comuna) => (
            <li key={comuna.id} className="p-2 border rounded flex justify-between items-center">
              <span>{comuna.nombre}</span>
              <div>
                <button
                  onClick={() => handleEditComunaClick(comuna)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteComuna(comuna.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
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

export default GeografiaClientPage;