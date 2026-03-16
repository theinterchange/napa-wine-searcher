import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { WineCountryGuide } from "@/components/guide-pdf/WineCountryGuide";

export async function GET() {
  const buffer = await renderToBuffer(
    React.createElement(WineCountryGuide)
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="Napa-Sonoma-Wine-Country-Planning-Guide.pdf"',
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
