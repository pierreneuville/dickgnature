import { execSync } from "node:child_process";

// Apply migrations only to an explicitly named test database. Integration tests clear tables,
// so failing closed here protects a development or production database from accidental use.
export default function setup() {
  // TEST_DATABASE_URL prend le pas sur DATABASE_URL : il permet de cibler la base jetable
  // sans écraser une variable de dev/prod éventuellement présente dans l'environnement.
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL (ou DATABASE_URL) must point to a disposable test database.",
    );
  }

  const databaseName = new URL(databaseUrl).pathname.toLowerCase();
  if (!databaseName.includes("test")) {
    throw new Error(
      `Refusing to run destructive integration tests against “${databaseName}”. ` +
        "Use a database name containing ‘test’.",
    );
  }

  const directUrl =
    process.env.TEST_DIRECT_URL ?? process.env.DIRECT_URL ?? databaseUrl;

  // Prisma Client lit ces variables au runtime, dans chaque worker vitest. On les fige ici
  // pour que la résolution (TEST_DATABASE_URL en priorité) s'applique à toute la suite.
  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = directUrl;

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl },
  });
}
