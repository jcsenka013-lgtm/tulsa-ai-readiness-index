import { ArrowUpRight, Braces, FileOutput, Workflow } from "lucide-react";

const DECISIONS = [
  { icon: Braces, title: "Explainable by design.", body: "Weighted domain scores and explicit insight rules make the recommendations traceable. The product shows its reasoning instead of asking users to trust a black box.", detail: "Typed scoring · Compliance overrides · ROI ranges", number: "01" },
  { icon: FileOutput, title: "One result. Every surface.", body: "A shared assessment result drives the browser report and server-generated PDF. The roadmap stays consistent wherever a business reviews or shares it.", detail: "React reports · Server-side PDF · Private storage", number: "02" },
  { icon: Workflow, title: "Built beyond the happy path.", body: "Autosave supports interrupted assessments. Scheduled follow-ups use send logging for idempotency. Funnel analytics and error monitoring make the system observable.", detail: "Resume flows · Scheduled jobs · Operational visibility", number: "03" },
];

export function ProjectShowcase() {
  return (
    <section id="engineering" className="folio-engineering">
      <div className="folio-container">
        <div className="folio-section-heading"><div><span className="folio-eyebrow">02 / THE ENGINEERING</span><h2>Thought through.<br /><span className="folio-serif">End to end.</span></h2></div><a className="folio-text-link" href="https://github.com/jcsenka013-lgtm/tulsa-ai-readiness-index" target="_blank" rel="noopener noreferrer">Inspect the source <ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></div>
        <div className="folio-build-layout">
          <div className="folio-system-map"><p className="folio-eyebrow">A SMALL PRODUCT. A COMPLETE SYSTEM.</p><div className="system-map-step"><span>INPUT</span><strong>Business context & answers</strong><small>Resumable assessment · Two product paths</small></div><div className="system-map-connector" aria-hidden="true">↓</div><div className="system-map-step system-map-core"><span>DECISION ENGINE</span><strong>Score → interpret → prioritize</strong><small>Five domains · Risk overrides · ROI modeling</small></div><div className="system-map-connector" aria-hidden="true">↓</div><div className="system-map-output"><div><span>DELIVERY</span><strong>Report & roadmap</strong><small>Browser + PDF</small></div><div><span>OPERATIONS</span><strong>Lead & follow-up</strong><small>Email + analytics</small></div></div><p className="system-map-caption">One assessment, connected all the way through.</p></div>
          <div className="folio-decisions">{DECISIONS.map(({ icon: Icon, title, body, detail, number }) => <article className="folio-decision" key={number}><span className="folio-decision-number">{number}</span><div><div className="folio-decision-title"><h3>{title}</h3><Icon size={20} aria-hidden="true" /></div><p>{body}</p><span className="folio-decision-detail">{detail}</span></div></article>)}</div>
        </div>
        <div className="folio-stack"><span className="folio-eyebrow">THE TOOLKIT</span><p>Next.js / React / TypeScript / Supabase / Cloudflare / Vitest</p><span className="folio-stack-note">Interface. Data. Infrastructure. Verification.</span></div>
      </div>
    </section>
  );
}
