import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { writeFileSync } from "fs";

const dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
let dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
if (!dbAuthToken) {
  const { execSync } = require("child_process");
  dbAuthToken = execSync("turso db tokens create napa-winery-search", { encoding: "utf-8" }).trim();
}
const client = createClient({ url: dbUrl, authToken: dbAuthToken });

(async () => {
  const rs = await client.execute(`
    SELECT slug, name,
      dog_friendly, dog_friendly_source, dog_friendly_note,
      kid_friendly, kid_friendly_confidence, kid_friendly_source, kid_friendly_note,
      picnic_friendly, sustainable_farming, sustainable_note, sustainable_source
    FROM wineries ORDER BY slug
  `);
  const rows = rs.rows.map((r: any) => {
    const obj: any = {};
    for (const col of rs.columns) obj[col] = r[col];
    return obj;
  });
  writeFileSync("/tmp/prod-amenities.json", JSON.stringify(rows, null, 2));
  console.log(`Exported ${rows.length} wineries`);
  process.exit(0);
})();
