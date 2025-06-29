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

describe('API Endpoints para /api/geografia/provincias', () => {
    const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
    const mockProvincia = { id: 'provincia-1', nombre: 'Santiago', regionId: 'region-1' };

    beforeEach(() => {
        vi.resetAllMocks();
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
    });

    // Pruebas para GET /provincias
    it('GET (todos): debe devolver una lista de provincias', async () => {
        (GeografiaService.getProvincias as Mock).mockResolvedValue([mockProvincia]);
        const request = new Request('http://localhost/api/geografia/provincias');
        const response = await getAll(request as NextRequest);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body[0].nombre).toBe('Santiago');
    });

    // Pruebas para POST /provincias
    it('POST: debe crear una nueva provincia', async () => {
        const newData = { nombre: 'Chacabuco', regionId: 'region-1' };
        (GeografiaService.createProvincia as Mock).mockResolvedValue({ id: 'provincia-2', ...newData });
        const request = new Request('http://localhost/api/geografia/provincias', {
            method: 'POST',
            body: JSON.stringify(newData)
        });
        const response = await POST(request as NextRequest);
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body.nombre).toBe('Chacabuco');
    });

    // Pruebas para GET /provincias/[id]
    it('GET (por id): debe devolver una provincia específica', async () => {
        (GeografiaService.getProvinciaById as Mock).mockResolvedValue(mockProvincia);
        const request = new Request(`http://localhost/api/geografia/provincias/${mockProvincia.id}`);
        // CORRECCIÓN: Se pasan ambos argumentos
        const response = await getById(request as NextRequest, { params: { id: mockProvincia.id } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.id).toBe(mockProvincia.id);
    });

    // Pruebas para PUT /provincias/[id]
    it('PUT: debe actualizar una provincia específica', async () => {
        const updateData = { nombre: 'Provincia de Maipo' };
        (GeografiaService.updateProvincia as Mock).mockResolvedValue({ ...mockProvincia, ...updateData });
        const request = new Request(`http://localhost/api/geografia/provincias/${mockProvincia.id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        const response = await PUT(request as NextRequest, { params: { id: mockProvincia.id } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.nombre).toBe('Provincia de Maipo');
    });
});
