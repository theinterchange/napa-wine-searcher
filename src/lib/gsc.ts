/**
 * Google Search Console API client. Uses a service account from
 * GSC_SERVICE_ACCOUNT_JSON env var.
 *
 * The service account must be added as a user of the Search Console
 * property with at least "Restricted" permission.
 */
import { google } from "googleapis";
import type { searchconsole_v1 } from "googleapis";

const PROPERTY = "sc-domain:napasonomaguide.com";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

function getCredentials(): {
  client_email: string;
  private_key: string;
  project_id?: string;
} {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON env var is not set");
  }
  let parsed: { client_email?: string; private_key?: string; project_id?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "GSC_SERVICE_ACCOUNT_JSON missing client_email or private_key"
    );
  }
  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    project_id: parsed.project_id,
  };
}

function getClient(): searchconsole_v1.Searchconsole {
  const creds = getCredentials();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });
  return google.searchconsole({ version: "v1", auth });
}

export interface GscRow {
  date: string;
  page: string;
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

/**
 * Fetch (date, page, query) rows for a window of N days ending on endDate.
 * Pages through the API — GSC returns at most 25,000 rows per call and
 * supports startRow pagination.
 */
export async function fetchQueryPageRows(options: {
  startDate: string;
  endDate: string;
  rowLimit?: number;
}): Promise<GscRow[]> {
  const client = getClient();
  const rowLimit = options.rowLimit ?? 25_000;
  const all: GscRow[] = [];
  let startRow = 0;

  while (true) {
    const resp = await client.searchanalytics.query({
      siteUrl: PROPERTY,
      requestBody: {
        startDate: options.startDate,
        endDate: options.endDate,
        dimensions: ["date", "page", "query"],
        rowLimit,
        startRow,
        type: "web",
        dataState: "final",
      },
    });

    const rows = resp.data.rows ?? [];
    for (const r of rows) {
      const [date, page, query] = r.keys ?? [];
      if (!date || !page) continue;
      all.push({
        date,
        page,
        query: query ?? "",
        impressions: r.impressions ?? 0,
        clicks: r.clicks ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }

    if (rows.length < rowLimit) break;
    startRow += rowLimit;
    // Hard safety cap — 10 pages = 250K rows; far beyond our site's volume
    if (startRow >= rowLimit * 10) break;
  }

  return all;
}
