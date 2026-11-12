import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { seedDatabase } = await import("../src/lib/seed");
  const force = process.argv.includes("--force");

  console.log(
    force
      ? "Resetting and seeding the Netflix clone database..."
      : "Seeding the Netflix clone database...",
  );
  console.log(
    `Target: ${process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017 (default)"}`,
  );

  const result = await seedDatabase({ force });
  console.log(`Done. ${result.titles} titles are now in MongoDB.`);
  console.log("Demo account: demo@netflix.dev / demo1234");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
