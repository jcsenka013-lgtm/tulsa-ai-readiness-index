import { Suspense } from "react";

import { AssessmentStartClient } from "@/app/assessment/AssessmentStartClient";

export default function CopilotAssessmentEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <AssessmentStartClient productType="copilot_readiness" />
    </Suspense>
  );
}
