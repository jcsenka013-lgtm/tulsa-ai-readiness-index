"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import type { ProductType } from "@/types/assessment";

export interface ResultsViewProps {
  assessmentId: string;
  productType: ProductType;
}

/**
 * Results-page chrome — scores/insights render elsewhere; this bundle wires
 * the PDF download affordance to GET /api/assessment/[id]/pdf.
 */
export function ResultsView({ assessmentId, productType }: ResultsViewProps) {
  const [loading, setLoading] = useState(false);

  async function downloadPdf(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`/api/assessment/${assessmentId}/pdf`, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
      });

      if (res.status === 302 || res.status === 307) {
        const loc = res.headers.get("Location");
        if (loc) {
          trackEvent("pdf_downloaded", { assessmentId, product_type: productType });
          toast.success("Your PDF download has started.");
          window.location.assign(loc);
          return;
        }
      }

      let message = "Could not start download.";
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) message = body.error;
      } catch {
        /* ignore */
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={() => void downloadPdf()}
      disabled={loading}
      variant="outline"
      size="lg"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : null}
      Download your full PDF report
    </Button>
  );
}
