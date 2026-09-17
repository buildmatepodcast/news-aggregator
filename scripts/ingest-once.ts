import "dotenv/config";
import { runIngestionCycle } from "@/workers/ingest";

runIngestionCycle()
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
