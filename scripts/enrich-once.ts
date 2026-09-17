import "dotenv/config";
import { runEnrichmentCycle } from "@/workers/enrich";

runEnrichmentCycle()
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
