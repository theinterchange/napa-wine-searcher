"use client";

import { trackClick, type TrackClickParams } from "@/lib/track-click";

interface TrackedLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  clickType: TrackClickParams["clickType"];
  wineryId?: number | null;
  sourcePage?: string;
  sourceComponent?: string;
}

export function TrackedLink({
  href,
  clickType,
  wineryId,
  sourcePage,
  sourceComponent,
  children,
  onClick,
  ...props
}: TrackedLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackClick({
      wineryId,
      clickType,
      destinationUrl: href,
      sourcePage,
      sourceComponent,
    });
    onClick?.(e);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}
