/*
  Warnings:

  - The primary key for the `hubUsb` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `_id` on the `hubUsb` table. All the data in the column will be lost.
  - Added the required column `idHubUsb` to the `hubUsb` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_hubUsb" (
    "idHubUsb" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modeloHubUsb" TEXT NOT NULL,
    "hubEnUso" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_hubUsb" ("createdAt", "hubEnUso", "modeloHubUsb", "updatedAt") SELECT "createdAt", "hubEnUso", "modeloHubUsb", "updatedAt" FROM "hubUsb";
DROP TABLE "hubUsb";
ALTER TABLE "new_hubUsb" RENAME TO "hubUsb";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
