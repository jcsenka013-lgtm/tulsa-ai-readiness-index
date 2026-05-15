"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { isLikelyPersonalEmailDomain } from "@/lib/assessment/personal-email";

export interface ContactFormValue {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  priority6m: string;
  consent: boolean;
  personalEmailAck: boolean;
}

export function ContactGate({
  value,
  onChange,
  idPrefix = "contact",
}: {
  value: ContactFormValue;
  onChange: (v: Partial<ContactFormValue>) => void;
  idPrefix?: string;
}) {
  const personal = isLikelyPersonalEmailDomain(value.email.trim());
  const showAck = personal && value.email.trim().length > 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where should we send your results?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your personalized readiness scores, ROI range, and next-step
          recommendation are on the other side. We will not sell your data.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>Full name</Label>
          <Input
            id={`${idPrefix}-name`}
            name="full_name"
            autoComplete="name"
            value={value.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-email`}>Business email</Label>
          <Input
            id={`${idPrefix}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={value.email}
            onChange={(e) =>
              onChange({ email: e.target.value, personalEmailAck: false })
            }
            required
            aria-describedby={
              showAck ? `${idPrefix}-email-hint` : undefined
            }
          />
          {showAck ? (
            <p
              id={`${idPrefix}-email-hint`}
              className="text-sm text-amber-700 dark:text-amber-400"
              role="status"
            >
              We recommend a business email so your results stay with your
              company. You can still continue—just confirm below.
            </p>
          ) : null}
        </div>
        {showAck ? (
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={value.personalEmailAck}
              onCheckedChange={(c) =>
                onChange({ personalEmailAck: Boolean(c) })
              }
            />
            <span>
              I understand, please send my results to this personal email
              address.
            </span>
          </label>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-phone`}>
            Phone <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={`${idPrefix}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-company`}>Company name</Label>
          <Input
            id={`${idPrefix}-company`}
            name="company"
            autoComplete="organization"
            value={value.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-priority`}>
            Biggest priority for the next 6 months{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id={`${idPrefix}-priority`}
            name="priority_6m"
            rows={3}
            placeholder="e.g., reduce patient no-shows, speed up quote turnaround, cut manual data entry"
            className="min-h-24"
            value={value.priority6m}
            onChange={(e) => onChange({ priority6m: e.target.value })}
          />
        </div>
        <label className="flex items-start gap-2 text-sm leading-relaxed">
          <Checkbox
            className="mt-0.5"
            required
            checked={value.consent}
            onCheckedChange={(c) => onChange({ consent: Boolean(c) })}
            name="consent"
            value="yes"
          />
          <span>
            I agree to receive my results and a short follow-up sequence from
            Tulsa Applied AI. I can unsubscribe anytime.
          </span>
        </label>
      </CardContent>
    </Card>
  );
}
