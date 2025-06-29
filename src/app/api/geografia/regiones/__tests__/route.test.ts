import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GeografiaService } from '@/services/geografiaService';

// --- IMPORTACIONES CORREGIDAS ---
// GET (todos) y POST vienen de la ruta padre
import { GET as getAll, POST } from '../route'; 
// GET (por id) y PUT vienen de la ruta hija [id]
import { GET as getById, PUT } from '../[id]/route'; 

// --- MOCKS ---
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/services/geografiaService');

describe('API Endpoints para /api/geografia/regiones', () => {
    const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
    const mockRegion = { id: 'region-1', nombre: 'Metropolitana', paisId: 'pais-1' };

    beforeEach(() => {
        vi.resetAllMocks();
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
    });

    // Pruebas para GET /regiones
    it('GET (todos): debe devolver una lista de regiones', async () => {
        (GeografiaService.getRegiones as Mock).mockResolvedValue([mockRegion]);
        const request = new Request('http://localhost/api/geografia/regiones');
        const response = await getAll(request as NextRequest);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body[0].nombre).toBe('Metropolitana');
    });

    // Pruebas para POST /regiones
    it('POST: debe crear una nueva región', async () => {
        const newData = { nombre: 'Valparaíso', paisId: 'pais-1' };
        (GeografiaService.createRegion as Mock).mockResolvedValue({ id: 'region-2', ...newData });
        const request = new Request('http://localhost/api/geografia/regiones', {
            method: 'POST',
            body: JSON.stringify(newData)
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body.nombre).toBe('Valparaíso');
    });

    // Pruebas para GET /regiones/[id]
    it('GET (por id): debe devolver una región específica', async () => {
        (GeografiaService.getRegionById as Mock).mockResolvedValue(mockRegion);
        const request = new Request(`http://localhost/api/geografia/regiones/${mockRegion.id}`);
        // CORRECCIÓN: Se pasan ambos argumentos
        const response = await getById(request as NextRequest, { params: { id: mockRegion.id } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.id).toBe(mockRegion.id);
    });

    // Pruebas para PUT /regiones/[id]
    it('PUT: debe actualizar una región específica', async () => {
        const updateData = { nombre: 'Región de Valparaíso' };
        (GeografiaService.updateRegion as Mock).mockResolvedValue({ ...mockRegion, ...updateData });
        const request = new Request(`http://localhost/api/geografia/regiones/${mockRegion.id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        const response = await PUT(request as NextRequest, { params: { id: mockRegion.id } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.nombre).toBe('Región de Valparaíso');
    });
});
