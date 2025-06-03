-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroCaso" INTEGER NOT NULL,
    "empresa" TEXT NOT NULL,
    "tipoIncidente" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "tecnicoAsignado" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcionDetallada" TEXT,
    "prioridad" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Abierto',
    "acciones" TEXT NOT NULL DEFAULT '[]',
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolucion" DATETIME,
    "fechaActualizacion" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_numeroCaso_key" ON "Ticket"("numeroCaso");
