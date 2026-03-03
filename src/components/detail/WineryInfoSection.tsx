import { MapPin, Phone, Globe, Clock, Dog, TreePine, CalendarCheck, Baby } from "lucide-react";
import { PhotoGallery } from "./PhotoGallery";

interface Hours {
  mon?: string; tue?: string; wed?: string; thu?: string;
  fri?: string; sat?: string; sun?: string;
}

interface Photo {
  id: number;
  url: string;
  altText: string | null;
}

interface WineryInfoProps {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  hoursJson: string | null;
  reservationRequired: boolean | null;
  dogFriendly: boolean | null;
  dogFriendlyNote: string | null;
  dogFriendlySource: string | null;
  picnicFriendly: boolean | null;
  kidFriendly: boolean | null;
  kidFriendlyNote: string | null;
  kidFriendlySource: string | null;
  kidFriendlyConfidence: string | null;
  description: string | null;
}

export function WineryInfoSection({ winery, photos = [] }: { winery: WineryInfoProps; photos?: Photo[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {winery.description && (
          <div className="mb-4">
            <h2 className="font-heading text-2xl font-semibold mb-4">About</h2>
            <p className="text-[var(--muted-foreground)] leading-relaxed">
              {winery.description}
            </p>
          </div>
        )}
        <PhotoGallery photos={photos} />
      </div>

      <div className="space-y-6">
        {/* Contact */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Visit Info</h3>
          <div className="space-y-3 text-sm">
            {winery.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-[var(--muted-foreground)]" />
                <span>
                  {[winery.address, winery.city, [winery.state, winery.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {winery.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
                <a href={`tel:${winery.phone}`} className="hover:text-burgundy-700 dark:hover:text-burgundy-400">
                  {winery.phone}
                </a>
              </div>
            )}
            {winery.websiteUrl && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-[var(--muted-foreground)]" />
                <a
                  href={winery.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-burgundy-700 dark:hover:text-burgundy-400 truncate"
                >
                  Website
                </a>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 text-sm">
            {winery.reservationRequired && (
              <div className="flex items-center gap-2 text-burgundy-700 dark:text-burgundy-400">
                <CalendarCheck className="h-4 w-4" />
                Reservation Required
              </div>
            )}
            {winery.dogFriendly && (
              <div>
                <div className="flex items-center gap-2">
                  <Dog className="h-4 w-4 text-[var(--muted-foreground)]" />
                  Dog Friendly
                </div>
                {(winery.dogFriendlyNote || winery.dogFriendlySource) && (
                  <p className="ml-7 mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {winery.dogFriendlyNote || "Verify on website"}
                    {winery.dogFriendlySource && (
                      <>
                        {" · "}
                        <a
                          href={winery.dogFriendlySource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-burgundy-700 dark:hover:text-burgundy-400"
                        >
                          source ↗
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>
            )}
            {winery.picnicFriendly && (
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-[var(--muted-foreground)]" />
                Picnic Friendly
              </div>
            )}
            {winery.kidFriendly && (
              <div>
                <div className="flex items-center gap-2">
                  <Baby className="h-4 w-4 text-[var(--muted-foreground)]" />
                  Kid Friendly{winery.kidFriendlyConfidence === "medium" && (
                    <span className="text-xs text-amber-600 dark:text-amber-400"> · Check with winery</span>
                  )}
                </div>
                {(winery.kidFriendlyNote || winery.kidFriendlySource) && (
                  <p className="ml-7 mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {winery.kidFriendlyNote || "Verify on website"}
                    {winery.kidFriendlySource && (
                      <>
                        {" · "}
                        <a
                          href={winery.kidFriendlySource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-burgundy-700 dark:hover:text-burgundy-400"
                        >
                          source ↗
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HoursSection({ hoursJson }: { hoursJson: string | null }) {
  let hours: Hours | null = null;
  try {
    if (hoursJson) hours = JSON.parse(hoursJson);
  } catch {}

  if (!hours) return null;

  const dayNames: Record<string, string> = {
    mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
    fri: "Friday", sat: "Saturday", sun: "Sunday",
  };

  return (
    <div className="mt-8">
      <h2 className="font-heading text-2xl font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Hours
      </h2>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 max-w-md">
        <div className="space-y-1.5 text-sm">
          {Object.entries(dayNames).map(([key, label]) => (
            <div key={key} className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">{label}</span>
              <span>{hours![key as keyof Hours] || "Closed"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
