import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

const postgresClient = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false,
  ssl: "require",
});

export const db = drizzle(postgresClient, { schema });
