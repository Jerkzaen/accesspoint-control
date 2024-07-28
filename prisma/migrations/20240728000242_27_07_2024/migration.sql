/*
  Warnings:

  - You are about to drop the `hubUsb` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "hubUsb";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "stock" (
    "idProducto" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombrePrducto" TEXT NOT NULL,
    "marcaProducto" TEXT NOT NULL,
    "modeloProducto" TEXT NOT NULL,
    "serieProducto" TEXT NOT NULL,
    "estadoProducto" TEXT NOT NULL,
    "ultimoEquipo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
