/*
  Warnings:

  - You are about to drop the column `nombrePrducto` on the `stock` table. All the data in the column will be lost.
  - You are about to drop the column `serieProducto` on the `stock` table. All the data in the column will be lost.
  - You are about to drop the column `ultimoEquipo` on the `stock` table. All the data in the column will be lost.
  - Added the required column `cantidadProducto` to the `stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombreProducto` to the `stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ubicacionProducto` to the `stock` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_stock" (
    "idProducto" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombreProducto" TEXT NOT NULL,
    "marcaProducto" TEXT NOT NULL,
    "modeloProducto" TEXT NOT NULL,
    "ubicacionProducto" TEXT NOT NULL,
    "estadoProducto" TEXT NOT NULL,
    "cantidadProducto" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_stock" ("createdAt", "estadoProducto", "idProducto", "marcaProducto", "modeloProducto", "updatedAt") SELECT "createdAt", "estadoProducto", "idProducto", "marcaProducto", "modeloProducto", "updatedAt" FROM "stock";
DROP TABLE "stock";
ALTER TABLE "new_stock" RENAME TO "stock";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
