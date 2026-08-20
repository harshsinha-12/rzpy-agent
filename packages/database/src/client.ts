import { Pool } from "pg";

export function createDatabasePool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

export async function checkDatabaseConnection(pool: Pool): Promise<void> {
  await pool.query("SELECT 1");
}

export async function closeDatabasePool(pool: Pool): Promise<void> {
  await pool.end();
}
