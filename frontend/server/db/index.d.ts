import { Pool } from "pg";
import * as schema from "./schema.js";
import "dotenv/config";
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
//# sourceMappingURL=index.d.ts.map
