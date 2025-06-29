import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GeografiaService } from '@/services/geografiaService';
import { GET, POST } from '../route';
import { GET as getById, PUT } from '../[id]/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/services/geografiaService');

describe('API de Países', () => {
    const mockAdminSession = { user: { id: 'admin-123', role: 'ADMIN' } };
    
    beforeEach(() => {
        vi.resetAllMocks();
        (getServerSession as Mock).mockResolvedValue(mockAdminSession);
    });

    it('GET /paises: debe obtener la lista de países', async () => {
        (GeografiaService.getPaises as Mock).mockResolvedValue([{ id: '1', nombre: 'Chile' }]);
        const response = await GET(new Request('http://localhost/paises') as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body[0].nombre).toBe('Chile');
    });

    it('POST /paises: debe crear un país', async () => {
        const req = { json: async () => ({ nombre: 'Argentina' }) };
        (GeografiaService.createPais as Mock).mockResolvedValue({ id: '2', nombre: 'Argentina' });
        const response = await POST(req as NextRequest);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body.nombre).toBe('Argentina');
    });

    it('GET /paises/[id]: debe obtener un país específico', async () => {
        (GeografiaService.getPaisById as Mock).mockResolvedValue({ id: '1', nombre: 'Chile' });
        const response = await getById(new Request('http://localhost/paises/1') as NextRequest, { params: { id: '1' } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombre).toBe('Chile');
    });

    it('PUT /paises/[id]: debe actualizar un país', async () => {
        const req = { json: async () => ({ nombre: 'Republica de Chile' }) };
        (GeografiaService.updatePais as Mock).mockResolvedValue({ id: '1', nombre: 'Republica de Chile' });
        const response = await PUT(req as NextRequest, { params: { id: '1' } });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.nombre).toBe('Republica de Chile');
    });
});
