"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type CopilotTrackLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  eventName: string;
  eventProps?: Record<string, string | number | boolean | null>;
  className?: string;
};

export function CopilotTrackLink({
  eventName,
  eventProps,
  className,
  href,
  ...rest
}: CopilotTrackLinkProps) {
  return (
    <Link
      {...rest}
      href={href}
      className={cn(className)}
      onClick={() => {
        trackEvent(eventName, eventProps);
      }}
    />
  );
}
