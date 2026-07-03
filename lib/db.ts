import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/drizzle/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize the database.");
}

declare global {
  // eslint-disable-next-line no-var
  var db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  // eslint-disable-next-line no-var
  var pool: Pool | undefined;
}

const pool = globalThis.pool || new Pool({ connectionString });
if (process.env.NODE_ENV !== "production") {
  globalThis.pool = pool;
}

export const db = globalThis.db || drizzle(pool, { schema });
if (process.env.NODE_ENV !== "production") {
  globalThis.db = db;
}
