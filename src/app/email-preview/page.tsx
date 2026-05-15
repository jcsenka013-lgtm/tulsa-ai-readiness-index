import { notFound } from "next/navigation";

import { EmailPreviewClient } from "./EmailPreviewClient";

export const dynamic = "force-dynamic";

export default function EmailPreviewPage() {
  if (process.env.NEXT_PUBLIC_EMAIL_PREVIEW !== "true") {
    notFound();
  }
  return <EmailPreviewClient />;
}
