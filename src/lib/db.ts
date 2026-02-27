import { createClient, type Client } from "@libsql/client";
import { initializeSchema } from "./db-schema";

let client: Client | null = null;
let schemaInitialized = false;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;
  await initializeSchema(getDb());
  schemaInitialized = true;
}
