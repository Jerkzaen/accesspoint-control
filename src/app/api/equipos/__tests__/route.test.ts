// RUTA: src/app/api/equipos/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { Prisma, EquipoInventario, EstadoEquipoInventario, TipoEquipoInventario } from "@prisma/client";
import { ZodError } from "zod";

// Tipo para equipos con relaciones
type EquipoInventarioWithRelations = Prisma.EquipoInventarioGetPayload<{
  include: {
    ubicacionActual: true;
    empresa: true;
    parentEquipo: true;
    componentes: true;
    prestamos: true;
  };
}>;

// --- MOCKS EXTERNOS ---
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

// MOCKEAR EL MÓDULO @/services/equipoInventarioService.
// Las funciones mock se declaran y retornan directamente dentro de la factoría de vi.mock.
// Esto evita problemas de "hoisting" ya que todo se inicializa en el mismo ámbito.
vi.mock('@/services/equipoInventarioService', () => ({
    EquipoInventarioService: {
        getEquipos: vi.fn(),
        getEquipoById: vi.fn(),
        createEquipo: vi.fn(),
        updateEquipo: vi.fn(),
        deactivateEquipo: vi.fn(),
    },
}));

// IMPORTAR EL SERVICIO MOCKEADO DESPUÉS DE QUE HA SIDO MOCKEADO POR VITEST.
// Aquí, `EquipoInventarioService` ya es una referencia al objeto mockeado definido arriba.
import { EquipoInventarioService } from '@/services/equipoInventarioService';


// --- IMPORTACIÓN DEL CÓDIGO A PROBAR ---
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

describe('API Endpoints para /api/equipos (Suite Completa)', () => {

  const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
  const mockEquipo: EquipoInventario = {
    id: 'equipo-test-id',
    nombreDescriptivo: 'Laptop Prueba',
    identificadorUnico: 'SN-ABC-123',
    parentEquipoId: null,
    tipoEquipo: TipoEquipoInventario.NOTEBOOK, // Usar el enum correcto
    marca: 'Dell',
    modelo: 'XPS 15',
    descripcionAdicional: 'Core i7, 16GB RAM, 512GB SSD',
    estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
    fechaAdquisicion: new Date('2024-01-15T00:00:00.000Z'),
    proveedor: 'TechCorp',
    ubicacionActualId: 'ubicacion-test-id', // Asumiendo que existe una ubicación mock
    panelVtsSerie: null,
    pedalVtsSerie: null,
    biarticTipoDispositivo: null,
    empresaId: 'empresa-test-id', // Asumiendo que existe una empresa mock
    notasGenerales: null,
    createdAt: new Date('2024-01-15T10:00:00.000Z'),
    updatedAt: new Date('2024-01-15T10:00:00.000Z'),
  };

  // Mock para getEquipoById que incluye las relaciones
  const mockEquipoWithRelations: EquipoInventarioWithRelations = {
    ...mockEquipo,
    ubicacionActual: {
      id: 'ubicacion-test-id',
      nombreReferencial: 'Ubicación Test',
      estado: 'ACTIVA' as const,
      sucursalId: 'sucursal-test-id',
      notas: null,
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-15T10:00:00.000Z'),
    },
    empresa: {
      id: 'empresa-test-id',
      nombre: 'Empresa Test',
      rut: '12345678-9',
      logoUrl: null,
      telefono: null,
      email: null,
      estado: 'ACTIVA' as const,
      direccionPrincipalId: null,
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-15T10:00:00.000Z'),
    },
    parentEquipo: null,
    componentes: [],
    prestamos: [],
  };

  beforeEach(() => {
    // Resetear todos los mocks globales de Vitest
    vi.clearAllMocks();
    (getServerSession as Mock).mockReset(); 

    // Resetear los mocks individuales para cada prueba.
    // Accedemos a ellos directamente a través del objeto `EquipoInventarioService` importado (que ahora es el mock).
    vi.mocked(EquipoInventarioService.getEquipos).mockReset();
    vi.mocked(EquipoInventarioService.getEquipoById).mockReset();
    vi.mocked(EquipoInventarioService.createEquipo).mockReset();
    vi.mocked(EquipoInventarioService.updateEquipo).mockReset();
    vi.mocked(EquipoInventarioService.deactivateEquipo).mockReset();
  });

  // --- Pruebas para /api/equipos ---
  describe('GET /api/equipos', () => {
    it('debe devolver 401 si el usuario no está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/equipos');
      const response = await GET(request as NextRequest);
      expect(response.status).toBe(401);
    });

    it('debe devolver una lista de equipos si el usuario está autenticado', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      vi.mocked(EquipoInventarioService.getEquipos).mockResolvedValue([mockEquipo]);
      const request = new Request('http://localhost/api/equipos');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual([
        {
          ...mockEquipo,
          createdAt: mockEquipo.createdAt.toISOString(),
          updatedAt: mockEquipo.updatedAt.toISOString(),
          fechaAdquisicion: mockEquipo.fechaAdquisicion?.toISOString(), // Serializar fecha de adquisición
        }
      ]);
      expect(EquipoInventarioService.getEquipos).toHaveBeenCalledWith(); // Llamada sin filtro de estado
    });

    it('debe devolver una lista de equipos filtrados por estado si se proporciona un query param', async () => {
      (getServerSession as Mock).mockResolvedValue(mockAdminSession);
      vi.mocked(EquipoInventarioService.getEquipos).mockResolvedValue([mockEquipo]);
      const request = new Request('http://localhost/api/equipos?estado=DISPONIBLE');
      const response = await GET(request as NextRequest);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual([
        {
          ...mockEquipo,
          createdAt: mockEquipo.createdAt.toISOString(),
          updatedAt: mockEquipo.updatedAt.toISOString(),
          fechaAdquisicion: mockEquipo.fechaAdquisicion?.toISOString(),
        }
      ]);
      expect(EquipoInventarioService.getEquipos).toHaveBeenCalledWith(EstadoEquipoInventario.DISPONIBLE);
    });

    it('debe devolver 500 si el servicio de equipos falla al obtener equipos', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.getEquipos).mockRejectedValue(new Error('Error de DB al obtener equipos'));
        const request = new Request('http://localhost/api/equipos');
        const response = await GET(request as NextRequest);
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al obtener equipos');
    });
  });

  describe('POST /api/equipos', () => {
    const newEquipoData = { 
        nombreDescriptivo: 'Nuevo Notebook', 
        identificadorUnico: 'NB-XYZ-456', 
        tipoEquipo: TipoEquipoInventario.NOTEBOOK,
        estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
    };

    it('debe crear un equipo si los datos son válidos y está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        const mockCreatedEquipo: EquipoInventario = { 
            ...mockEquipo, 
            id: 'new-equipo-id', 
            nombreDescriptivo: newEquipoData.nombreDescriptivo,
            identificadorUnico: newEquipoData.identificadorUnico,
            tipoEquipo: newEquipoData.tipoEquipo,
            estadoEquipo: newEquipoData.estadoEquipo,
            createdAt: new Date('2024-01-15T10:30:00.000Z'),
            updatedAt: new Date('2024-01-15T10:30:00.000Z'),
        };
        vi.mocked(EquipoInventarioService.createEquipo).mockResolvedValue(mockCreatedEquipo);
        const request = new Request('http://localhost/api/equipos', {
            method: 'POST', body: JSON.stringify(newEquipoData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.nombreDescriptivo).toBe('Nuevo Notebook');
        expect(EquipoInventarioService.createEquipo).toHaveBeenCalledWith(expect.objectContaining({
            nombreDescriptivo: newEquipoData.nombreDescriptivo,
            identificadorUnico: newEquipoData.identificadorUnico,
        }));
    });

    it('debe devolver 400 si los datos son inválidos (ZodError)', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        // Simular que el servicio lanza ZodError
        const zodError = new ZodError([
          {
            code: 'too_small',
            minimum: 3,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'El nombre descriptivo es requerido y debe tener al menos 3 caracteres.',
            path: ['nombreDescriptivo'],
          }
        ]);
        vi.mocked(EquipoInventarioService.createEquipo).mockRejectedValue(zodError);
        const invalidData = { nombreDescriptivo: 'ab', identificadorUnico: 'xyz' }; // Nombre muy corto
        const request = new Request('http://localhost/api/equipos', {
            method: 'POST', body: JSON.stringify(invalidData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toContain('Error de validación');
        expect(EquipoInventarioService.createEquipo).toHaveBeenCalled();
    });

    it('debe devolver 500 si el servicio de equipos falla al crear por otra razón', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.createEquipo).mockRejectedValue(new Error('Error de DB al crear equipo'));
        const request = new Request('http://localhost/api/equipos', {
            method: 'POST', body: JSON.stringify(newEquipoData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al crear equipo');
    });
  });

  // --- Pruebas para /api/equipos/[id] ---
  describe('GET /api/equipos/[id]', () => {
    it('debe devolver un equipo por ID si está autenticado', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.getEquipoById).mockResolvedValue(mockEquipoWithRelations);
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`);
        const response = await getById(request, { params: { id: mockEquipo.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body).toEqual(expect.objectContaining({
          id: mockEquipo.id,
          nombreDescriptivo: mockEquipo.nombreDescriptivo,
          identificadorUnico: mockEquipo.identificadorUnico,
          createdAt: mockEquipo.createdAt.toISOString(),
          updatedAt: mockEquipo.updatedAt.toISOString(),
          fechaAdquisicion: mockEquipo.fechaAdquisicion?.toISOString(),
          ubicacionActual: expect.objectContaining({
            id: 'ubicacion-test-id',
            nombreReferencial: 'Ubicación Test',
            estado: 'ACTIVA',
          }),
          empresa: expect.objectContaining({
            id: 'empresa-test-id',
            nombre: 'Empresa Test',
            rut: '12345678-9',
            estado: 'ACTIVA',
          }),
          parentEquipo: null,
          componentes: [],
          prestamos: [],
        }));
        expect(EquipoInventarioService.getEquipoById).toHaveBeenCalledWith(mockEquipo.id);
    });

    it('debe devolver 404 si el equipo no se encuentra', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.getEquipoById).mockResolvedValue(null);
        const request = new Request(`http://localhost/api/equipos/id-no-existe`);
        const response = await getById(request, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.message).toBe('Equipo no encontrado');
    });

    it('debe devolver 500 si el servicio de equipos falla al obtener por ID', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.getEquipoById).mockRejectedValue(new Error('Error de DB al obtener equipo por ID'));
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`);
        const response = await getById(request, { params: { id: mockEquipo.id } });
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al obtener equipo por ID');
    });
  });

  describe('PUT /api/equipos/[id]', () => {
    const updateData = { nombreDescriptivo: 'Laptop Actualizada', estadoEquipo: EstadoEquipoInventario.EN_USO_INTERNO };

    it('debe actualizar un equipo y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.updateEquipo).mockResolvedValue({ ...mockEquipo, ...updateData });
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
            method: 'PUT', body: JSON.stringify(updateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request, { params: { id: mockEquipo.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombreDescriptivo).toBe('Laptop Actualizada');
        expect(body.estadoEquipo).toBe(EstadoEquipoInventario.EN_USO_INTERNO);
        expect(EquipoInventarioService.updateEquipo).toHaveBeenCalledWith(mockEquipo.id, updateData);
    });

    it('debe devolver 400 si los datos de actualización son inválidos (ZodError)', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        // Simular que el servicio lanza ZodError
        const zodError = new ZodError([
          {
            code: 'too_small',
            minimum: 3,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'El identificador único es requerido y debe tener al menos 3 caracteres.',
            path: ['identificadorUnico'],
          }
        ]);
        vi.mocked(EquipoInventarioService.updateEquipo).mockRejectedValue(zodError);
        const invalidUpdateData = { identificadorUnico: 'a' }; // Identificador muy corto
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
            method: 'PUT', body: JSON.stringify(invalidUpdateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request, { params: { id: mockEquipo.id } });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toContain('Error de validación');
        expect(EquipoInventarioService.updateEquipo).toHaveBeenCalled();
    });

    it('debe devolver 404 si el equipo no se encuentra al actualizar', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.updateEquipo).mockRejectedValue(new Error('Equipo no encontrado para actualizar.'));
        const request = new Request(`http://localhost/api/equipos/id-no-existe`, {
            method: 'PUT', body: JSON.stringify(updateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.message).toBe('Equipo no encontrado para actualizar.');
    });

    it('debe devolver 500 si el servicio de equipos falla al actualizar por otra razón', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.updateEquipo).mockRejectedValue(new Error('Error de DB al actualizar equipo'));
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
            method: 'PUT', body: JSON.stringify(updateData), headers: { 'Content-Type': 'application/json' }
        });
        const response = await putById(request, { params: { id: mockEquipo.id } });
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al actualizar equipo');
    });
  });

  describe('DELETE /api/equipos/[id] (Desactivación)', () => {
    it('debe desactivar un equipo y devolver 200', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.deactivateEquipo).mockResolvedValue({ ...mockEquipo, estadoEquipo: EstadoEquipoInventario.DE_BAJA });
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockEquipo.id } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.message).toBe('Equipo desactivado exitosamente');
        expect(body.equipo.estadoEquipo).toBe(EstadoEquipoInventario.DE_BAJA); // Verificar el estado devuelto
        expect(EquipoInventarioService.deactivateEquipo).toHaveBeenCalledWith(mockEquipo.id);
    });

    it('debe devolver 404 si el equipo no se encuentra al desactivar', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.deactivateEquipo).mockRejectedValue(new Error('Equipo no encontrado para desactivar.'));
        const request = new Request(`http://localhost/api/equipos/id-no-existe`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: 'id-no-existe' } });
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body.message).toBe('Equipo no encontrado para desactivar.');
    });

    it('debe devolver 400 si el equipo está prestado y no se puede desactivar', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.deactivateEquipo).mockRejectedValue(new Error('No se puede dar de baja un equipo que está prestado.'));
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockEquipo.id } });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toBe('No se puede dar de baja un equipo que está prestado.');
    });

    it('debe devolver 400 si el equipo tiene elementos asociados (foreign key constraint)', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.deactivateEquipo).mockRejectedValue(new Error('No se puede desactivar el equipo debido a elementos asociados (préstamos, tickets).'));
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockEquipo.id } });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toBe('No se puede desactivar el equipo debido a elementos asociados (préstamos, tickets).');
    });

    it('debe devolver 500 si el servicio de equipos falla al desactivar por otra razón', async () => {
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
        vi.mocked(EquipoInventarioService.deactivateEquipo).mockRejectedValue(new Error('Error de DB al desactivar'));
        const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, { method: 'DELETE' });
        const response = await deleteById(request, { params: { id: mockEquipo.id } });
        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Error de DB al desactivar');
    });
  });
});
