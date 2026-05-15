import { Suspense } from "react";

import { AssessmentStartClient } from "./AssessmentStartClient";

export default function AssessmentEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <AssessmentStartClient />
    </Suspense>
  );
}
