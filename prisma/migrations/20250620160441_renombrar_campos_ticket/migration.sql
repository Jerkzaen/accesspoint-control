/*
  Warnings:

  - You are about to drop the column `solicitanteClienteId` on the `Ticket` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroCaso" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcionDetallada" TEXT,
    "tipoIncidente" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "solicitanteNombre" TEXT NOT NULL,
    "solicitanteTelefono" TEXT,
    "solicitanteCorreo" TEXT,
    "contactoId" TEXT,
    "empresaId" TEXT,
    "ubicacionId" TEXT,
    "tecnicoAsignadoId" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolucionEstimada" DATETIME,
    "fechaSolucionReal" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "equipoAfectado" TEXT,
    CONSTRAINT "Ticket_contactoId_fkey" FOREIGN KEY ("contactoId") REFERENCES "contactos_empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "ubicaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_tecnicoAsignadoId_fkey" FOREIGN KEY ("tecnicoAsignadoId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("descripcionDetallada", "empresaId", "equipoAfectado", "estado", "fechaCreacion", "fechaSolucionEstimada", "fechaSolucionReal", "id", "numeroCaso", "prioridad", "solicitanteCorreo", "solicitanteNombre", "solicitanteTelefono", "tecnicoAsignadoId", "tipoIncidente", "titulo", "ubicacionId", "updatedAt") SELECT "descripcionDetallada", "empresaId", "equipoAfectado", "estado", "fechaCreacion", "fechaSolucionEstimada", "fechaSolucionReal", "id", "numeroCaso", "prioridad", "solicitanteCorreo", "solicitanteNombre", "solicitanteTelefono", "tecnicoAsignadoId", "tipoIncidente", "titulo", "ubicacionId", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_numeroCaso_key" ON "Ticket"("numeroCaso");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
