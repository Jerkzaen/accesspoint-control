-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_comunas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "comunas_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "provincias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_comunas" ("createdAt", "id", "nombre", "provinciaId", "updatedAt") SELECT "createdAt", "id", "nombre", "provinciaId", "updatedAt" FROM "comunas";
DROP TABLE "comunas";
ALTER TABLE "new_comunas" RENAME TO "comunas";
CREATE UNIQUE INDEX "comunas_nombre_provinciaId_key" ON "comunas"("nombre", "provinciaId");
CREATE TABLE "new_direcciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "depto" TEXT,
    "comunaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "direcciones_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "comunas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "direcciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_direcciones" ("calle", "comunaId", "createdAt", "depto", "empresaId", "id", "numero", "updatedAt") SELECT "calle", "comunaId", "createdAt", "depto", "empresaId", "id", "numero", "updatedAt" FROM "direcciones";
DROP TABLE "direcciones";
ALTER TABLE "new_direcciones" RENAME TO "direcciones";
CREATE UNIQUE INDEX "direcciones_empresaId_key" ON "direcciones"("empresaId");
CREATE TABLE "new_provincias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "provincias_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_provincias" ("createdAt", "id", "nombre", "regionId", "updatedAt") SELECT "createdAt", "id", "nombre", "regionId", "updatedAt" FROM "provincias";
DROP TABLE "provincias";
ALTER TABLE "new_provincias" RENAME TO "provincias";
CREATE UNIQUE INDEX "provincias_nombre_regionId_key" ON "provincias"("nombre", "regionId");
CREATE TABLE "new_regiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "paisId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "regiones_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "paises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_regiones" ("createdAt", "id", "nombre", "paisId", "updatedAt") SELECT "createdAt", "id", "nombre", "paisId", "updatedAt" FROM "regiones";
DROP TABLE "regiones";
ALTER TABLE "new_regiones" RENAME TO "regiones";
CREATE UNIQUE INDEX "regiones_nombre_paisId_key" ON "regiones"("nombre", "paisId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
