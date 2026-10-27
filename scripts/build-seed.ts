// Writes supabase/seed.sql from the app's own data. Run with npm run db:seed:build.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSeedSql } from "../data/supabase/seedSql";

const target = resolve(import.meta.dirname, "../supabase/seed.sql");
writeFileSync(target, buildSeedSql());
console.log(`Wrote ${target}`);
