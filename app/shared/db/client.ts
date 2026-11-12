import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../../db/schema";

/**
 * El pool se crea al importar el módulo, pero no abre conexión hasta la primera
 * consulta. Así `typecheck` y `build` funcionan sin `DATABASE_URL`; en ejecución,
 * la falta de la variable se nota en la primera consulta.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
