// src/scripts/restore-geo.ts

// Importamos la instancia centralizada de PrismaClient
import { prisma } from "@/lib/prisma"; // <--- CORRECCIÓN CLAVE: Usar la instancia centralizada
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline'; // Importamos readline para la confirmación

// Obtenemos el directorio actual de una manera compatible con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupFilePath = path.join(__dirname, 'geografia-backup.json');

/**
 * Función para restaurar los datos geográficos desde el archivo JSON de respaldo.
 * ¡CUIDADO! Esta función primero borrará los datos existentes en las tablas.
 */
async function restore() {
  console.log('Iniciando restauración de datos geográficos...');
  try {
    if (!fs.existsSync(backupFilePath)) {
      console.error(`❌ No se encontró el archivo de respaldo en: ${backupFilePath}`);
      console.log('   Por favor, ejecuta el comando de respaldo primero.');
      return;
    }

    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));

    // Borrar datos existentes en el orden inverso a las dependencias
    console.log('🗑️ Limpiando tablas geográficas existentes...');
    // Usamos una transacción para asegurar que la limpieza y la inserción sean atómicas.
    await prisma.$transaction(async (tx) => {
        await tx.comuna.deleteMany({});
        await tx.provincia.deleteMany({});
        await tx.region.deleteMany({});
        await tx.pais.deleteMany({});
    });
    console.log('   Tablas limpiadas.');

    // Insertar nuevos datos en orden de dependencia
    console.log('🌱 Insertando datos desde el respaldo...');
    await prisma.$transaction(async (tx) => {
        await tx.pais.createMany({ data: backupData.paises });
        await tx.region.createMany({ data: backupData.regiones });
        await tx.provincia.createMany({ data: backupData.provincias });
        await tx.comuna.createMany({ data: backupData.comunas });
    });
    
    console.log('✅ Restauración completada con éxito.');

  } catch (error) {
    console.error('❌ Error durante el proceso de restauración:', error);
  } finally {
    // Es importante desconectar Prisma si el script es un proceso de corta duración
    // que se ejecuta y termina, para liberar la conexión.
    await prisma.$disconnect(); 
  }
}

/**
 * Lógica principal para ejecutar el script desde la línea de comandos.
 */
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise<string>(resolve => {
    rl.question('❓ ¿Estás seguro de que quieres borrar y restaurar los datos geográficos? (s/n): ', (ans: string) => {
      rl.close();
      resolve(ans);
    });
  });

  if (answer.toLowerCase() === 's') {
      await restore();
  } else {
      console.log('Operación cancelada.');
  }
}

main();
