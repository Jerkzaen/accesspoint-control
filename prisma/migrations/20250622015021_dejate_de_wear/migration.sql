-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_direcciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calle" TEXT,
    "numero" TEXT,
    "depto" TEXT,
    "comunaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "direcciones_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "comunas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "direcciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_direcciones" ("calle", "comunaId", "createdAt", "depto", "empresaId", "id", "numero", "updatedAt") SELECT "calle", "comunaId", "createdAt", "depto", "empresaId", "id", "numero", "updatedAt" FROM "direcciones";
DROP TABLE "direcciones";
ALTER TABLE "new_direcciones" RENAME TO "direcciones";
CREATE UNIQUE INDEX "direcciones_empresaId_key" ON "direcciones"("empresaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
