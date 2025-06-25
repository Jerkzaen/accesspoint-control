/*
  Warnings:

  - You are about to drop the column `categoria` on the `AccionTicket` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccionTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaAccion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT DEFAULT 'SEGUIMIENTO',
    "tiempoInvertidoMinutos" INTEGER,
    "estadoTicketAnterior" TEXT,
    "estadoTicketNuevo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccionTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccionTicket_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AccionTicket" ("createdAt", "descripcion", "fechaAccion", "id", "ticketId", "updatedAt", "usuarioId") SELECT "createdAt", "descripcion", "fechaAccion", "id", "ticketId", "updatedAt", "usuarioId" FROM "AccionTicket";
DROP TABLE "AccionTicket";
ALTER TABLE "new_AccionTicket" RENAME TO "AccionTicket";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
