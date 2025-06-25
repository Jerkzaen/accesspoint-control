import { vi } from 'vitest';

export const TicketService = {
  getTickets: vi.fn(),
  getTicketById: vi.fn(),
  createTicket: vi.fn(),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
  createAccionTicket: vi.fn(),
  updateAccionTicket: vi.fn(),
  deleteAccionTicket: vi.fn(),
  getAccionesByTicketId: vi.fn(),
  getAccionTicketById: vi.fn(),
  _generateNextNumeroCaso: vi.fn(),
};