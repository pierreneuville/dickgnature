import { execSync } from "node:child_process";

// Prépare une base SQLite de test en appliquant les migrations Prisma.
// DATABASE_URL est fourni par vitest (test.env) : file:./test.db → prisma/test.db.
export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
