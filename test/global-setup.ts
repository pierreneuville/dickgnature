import { execSync } from "node:child_process";

// Apply migrations only to an explicitly named test database. Integration tests clear tables,
// so failing closed here protects a development or production database from accidental use.
export default function setup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must point to a disposable test database.");
  }

  const databaseName = new URL(databaseUrl).pathname.toLowerCase();
  if (!databaseName.includes("test")) {
    throw new Error(
      `Refusing to run destructive integration tests against “${databaseName}”. ` +
        "Use a database name containing ‘test’.",
    );
  }

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: process.env.DIRECT_URL ?? databaseUrl,
    },
  });
}
