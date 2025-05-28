import TaskCard from "./TaskCard";
import { prisma } from "@/utils/prisma";

export default async function DashboardPage() {
  // Cargar tickets ordenados descendentemente por nroCaso
  const tickets = await prisma.ticket.findMany({
    orderBy: { nroCaso: 'desc' }
  });

  // Serializar para pasarlos al cliente
  const serialTickets = tickets.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    fechaSolucion: t.fechaSolucion?.toISOString() || null,
    acciones: t.acciones || [] // array de logs
  }));

  return (
    <div className="h-full">
      <TaskCard tickets={serialTickets} />
    </div>
  );
}

// app/dashboard/TaskCard.tsx
"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import {
  Table, TableBody, TableCell, TableRow,
  TableHeader, TableHead, TableFooter, TableCaption
} from "./ui/table";

interface ActionEntry {
  fecha: string;
  descripcion: string;
}

interface Ticket {
  id: string;
  nroCaso: string;
  empresa: string;
  ubicacion: string;
  tecnico: string;
  descripcion: string;
  fechaSolucion: string | null;
  acciones: ActionEntry[];
}

export default function TaskCard({ tickets }: { tickets: Ticket[] }) {
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [newAction, setNewAction] = useState<string>("");

  async function handleAddAction() {
    if (!selected || !newAction.trim()) return;
    // Llamar a endpoint para persistir (fetch/PATCH) o a Server Action
    const response = await fetch(`/api/tickets/${selected.id}/accion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: newAction })
    });
    const updated: Ticket = await response.json();
    setSelected(updated);
    setNewAction("");
  }

  return (
    <div className="flex flex-wrap h-full p-4 gap-4">
      {/* Columna izquierda */}
      <Card
        className="flex-grow shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg p-4"
        style={{ width: "calc(70% - 1rem)" }}
      >
        <Table className="min-w-full">
          <TableCaption>Tickets recientes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs text-center">Nro Caso</TableHead>
              <TableHead className="text-xs text-center">Empresa</TableHead>
              <TableHead className="text-xs text-center">Ubicación</TableHead>
              <TableHead className="text-xs text-center">Técnico</TableHead>
              <TableHead className="text-xs text-center">Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map(t => (
              <TableRow
                key={t.id}
                className="cursor-pointer hover:bg-gray-800"
                onClick={() => setSelected(t)}
              >
                <TableCell className="text-center">{t.nroCaso}</TableCell>
                <TableCell className="text-center">{t.empresa}</TableCell>
                <TableCell className="text-center">{t.ubicacion}</TableCell>
                <TableCell className="text-center">{t.tecnico}</TableCell>
                <TableCell
                  className="text-center"
                  style={{
                    maxWidth: "50px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.descripcion}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Columna derecha */}
      <Card
        className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg p-4 flex flex-col"
        style={{ width: "30%" }}
      >
        {!selected ? (
          <div className="text-center text-gray-500">Selecciona un ticket</div>
        ) : (
          <>
            <div className="mb-4">
              <span className="text-sm font-semibold">
                Última actualización: {selected.fechaSolucion ?? "–"}
              </span>
            </div>

            <div className="mb-2">
              <span className="text-sm font-semibold">Bitácora de acciones</span>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {selected.acciones.map((act, idx) => (
                <div key={idx} className="text-xs border-b pb-1">
                  <span className="font-medium">{act.fecha}:</span> {act.descripcion}
                </div>
              ))}
            </div>

            <textarea
              className="p-2 border border-gray-300 rounded-lg resize-none mb-2"
              placeholder="Nueva acción..."
              value={newAction}
              onChange={e => setNewAction(e.target.value)}
            />
            <button
              className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={handleAddAction}
            >
              Agregar acción
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
