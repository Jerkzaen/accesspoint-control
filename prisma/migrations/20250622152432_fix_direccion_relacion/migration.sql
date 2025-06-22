/*
  Warnings:

  - You are about to drop the column `empresaId` on the `direcciones` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_direcciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "depto" TEXT,
    "comunaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "direcciones_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "comunas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_direcciones" ("calle", "comunaId", "createdAt", "depto", "id", "numero", "updatedAt") SELECT "calle", "comunaId", "createdAt", "depto", "id", "numero", "updatedAt" FROM "direcciones";
DROP TABLE "direcciones";
ALTER TABLE "new_direcciones" RENAME TO "direcciones";
CREATE TABLE "new_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "logoUrl" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccionPrincipalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "empresas_direccionPrincipalId_fkey" FOREIGN KEY ("direccionPrincipalId") REFERENCES "direcciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_empresas" ("createdAt", "email", "id", "logoUrl", "nombre", "rut", "telefono", "updatedAt") SELECT "createdAt", "email", "id", "logoUrl", "nombre", "rut", "telefono", "updatedAt" FROM "empresas";
DROP TABLE "empresas";
ALTER TABLE "new_empresas" RENAME TO "empresas";
CREATE UNIQUE INDEX "empresas_rut_key" ON "empresas"("rut");
CREATE TABLE "new_sucursales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
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
