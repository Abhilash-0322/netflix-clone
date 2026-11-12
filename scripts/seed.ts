import { seedDatabase } from "../src/lib/seed";

async function main() {
  const force = process.argv.includes("--force");
  console.log(
    force
      ? "Resetting and seeding the Netflix clone database..."
      : "Seeding the Netflix clone database...",
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
