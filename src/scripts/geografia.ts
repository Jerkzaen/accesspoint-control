// Guardar como scripts/geografia.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Corrección para Módulos ES ---
// Obtenemos el directorio actual de una manera compatible con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- Fin de la corrección ---

const prisma = new PrismaClient();
const backupFilePath = path.join(__dirname, 'geografia-backup.json');

/**
 * Función para crear un respaldo de los datos geográficos en un archivo JSON.
 */
async function backup() {
  console.log('Iniciando respaldo de datos geográficos...');
  try {
    const paises = await prisma.pais.findMany();
    const regiones = await prisma.region.findMany();
    const provincias = await prisma.provincia.findMany();
    const comunas = await prisma.comuna.findMany();

    const backupData = {
      paises,
      regiones,
      provincias,
      comunas,
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    console.log(`✅ Respaldo completado con éxito. Archivo guardado en: ${backupFilePath}`);
    console.log(`   - ${paises.length} países`);
    console.log(`   - ${regiones.length} regiones`);
    console.log(`   - ${provincias.length} provincias`);
    console.log(`   - ${comunas.length} comunas`);

  } catch (error) {
    console.error('❌ Error durante el proceso de respaldo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

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
    await prisma.comuna.deleteMany({});
    await prisma.provincia.deleteMany({});
    await prisma.region.deleteMany({});
    await prisma.pais.deleteMany({});
    console.log('   Tablas limpiadas.');

    // Insertar nuevos datos en orden de dependencia
    console.log('🌱 Insertando datos desde el respaldo...');
    await prisma.pais.createMany({ data: backupData.paises });
    await prisma.region.createMany({ data: backupData.regiones });
    await prisma.provincia.createMany({ data: backupData.provincias });
    await prisma.comuna.createMany({ data: backupData.comunas });
    
    console.log('✅ Restauración completada con éxito.');

  } catch (error) {
    console.error('❌ Error durante el proceso de restauración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Lógica principal para ejecutar el script desde la línea de comandos.
 */
async function main() {
  const command = process.argv[2]; // El tercer argumento es el comando (backup o restore)

  if (command === 'backup') {
    await backup();
  } else if (command === 'restore') {
    // --- Corrección para Módulos ES ---
    // Usamos import() dinámico para readline
    const readline = (await import('readline')).createInterface({
        input: process.stdin,
        output: process.stdout
    });
    // --- Fin de la corrección ---

    const answer = await new Promise(resolve => {
      readline.question('❓ ¿Estás seguro de que quieres borrar y restaurar los datos geográficos? (s/n): ', (ans: string) => {
        readline.close();
        resolve(ans);
      });
    });

    if (answer === 's' || answer === 'S') {
        await restore();
    } else {
        console.log('Operación cancelada.');
    }
  } else {
    console.log('Por favor, especifica un comando:');
    console.log('  - backup: Para crear un respaldo de los datos.');
    console.log('  - restore: Para restaurar los datos desde un respaldo.');
    console.log('\nEjemplo:');
    console.log('  npx ts-node scripts/geografia.ts backup');
  }
}

main();
