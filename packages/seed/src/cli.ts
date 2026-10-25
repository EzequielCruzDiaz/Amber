import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateScenario } from "./scenario";
import { scenarioToSql } from "./to-sql";

const seed = Number(process.env.SEED ?? 2026);
const target = fileURLToPath(new URL("../../../supabase/seed.sql", import.meta.url));

const scenario = generateScenario({ seed });
writeFileSync(target, scenarioToSql(scenario), "utf8");

console.warn(
  `seed.sql escrito: ${scenario.cases.length} casos, ${scenario.records.length} registros, ${scenario.incidents.length} incidentes (semilla ${seed}).`,
);
