export type SlideVariant =
  | "hook"
  | "qualifier"
  | "setting"
  | "experience"
  | "unique"
  | "cta";

export type SlideFormat = "reel" | "carousel";

export interface Slide {
  order: number;
  photoUrl: string;
  variant: SlideVariant;
  eyebrow?: string;
  headline: string;
  body?: string;
  formats: SlideFormat[];
  fx?: number;
  fy?: number;
  zoom?: number;
}
