import { drizzle } from "drizzle-orm/d1";
import { Bindings } from "../models/db";
import * as schema from "../db/schema";

let db: any;

export function initDb(env: Bindings) {
  db = drizzle(
    env.DB,
    {
      schema: {
        ...schema
      }
    }
  );
}

export { db };
