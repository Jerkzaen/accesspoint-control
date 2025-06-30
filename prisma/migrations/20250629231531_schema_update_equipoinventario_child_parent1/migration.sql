-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sucursales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "telefono" TEXT,
    "email" TEXT,
    "direccionId" TEXT NOT NULL,
    "empresaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sucursales_direccionId_fkey" FOREIGN KEY ("direccionId") REFERENCES "direcciones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sucursales_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_sucursales" ("createdAt", "direccionId", "email", "empresaId", "id", "nombre", "telefono", "updatedAt") SELECT "createdAt", "direccionId", "email", "empresaId", "id", "nombre", "telefono", "updatedAt" FROM "sucursales";
DROP TABLE "sucursales";
ALTER TABLE "new_sucursales" RENAME TO "sucursales";
CREATE UNIQUE INDEX "sucursales_direccionId_key" ON "sucursales"("direccionId");
CREATE TABLE "new_ubicaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreReferencial" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "sucursalId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ubicaciones_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ubicaciones" ("createdAt", "id", "nombreReferencial", "notas", "sucursalId", "updatedAt") SELECT "createdAt", "id", "nombreReferencial", "notas", "sucursalId", "updatedAt" FROM "ubicaciones";
DROP TABLE "ubicaciones";
ALTER TABLE "new_ubicaciones" RENAME TO "ubicaciones";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
