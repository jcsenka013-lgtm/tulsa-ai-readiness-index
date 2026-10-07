import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Command, Menu } from "lucide-react";
import { AiLandingAnalytics } from "@/components/marketing/AiLandingAnalytics";
import { ReadinessPreview } from "@/components/marketing/ReadinessPreview";
import { ProjectShowcase } from "@/components/marketing/ProjectShowcase";
import { calculateAssessmentResult } from "@/lib/scoring";
import type { AssessmentResponse } from "@/types/assessment";
import { SAMPLE_DENTAL_RESPONSES } from "@/lib/sample-report/dental-practice-fixture";
import { SAMPLE_COPILOT_INSURANCE_RESPONSES } from "@/lib/sample-report/copilot-insurance-fixture";

export const metadata: Metadata = {
  title: "Applied intelligence. Built to work.",
  description: "Explore the AI Readiness Index: an interactive product and engineering case study built for Tulsa Applied AI. Try real scoring, insights, and sample reports without signing up.",
};

function demoResult(responses: AssessmentResponse) {
  const { scores, tier, recommendedNextStep, insights } = calculateAssessmentResult(responses);
  const priority = insights.find(insight => insight.severity === "critical") ?? insights[0];
  return { scores, tier, recommendedNextStep, insights: [priority] };
}

const profiles = [
  { id: "dental", label: "Dental practice", name: "Sample Dental Practice", context: "Healthcare · Tulsa, OK · 21–50 people", summary: "Strong identity controls. Undocumented workflows. A team still finding its footing with AI.", href: "/sample-report", result: demoResult(SAMPLE_DENTAL_RESPONSES) },
  { id: "insurance", label: "Insurance agency", name: "Sample Regional Insurance Agency", context: "Insurance · Oklahoma City, OK · 21–50 people", summary: "Copilot seats are already purchased. Broad file access and missing labels make the foundation the priority.", href: "/copilot/sample-report", result: demoResult(SAMPLE_COPILOT_INSURANCE_RESPONSES) },
];

const navigation = [ { href: "#demo", label: "Try the product" }, { href: "#engineering", label: "The build" }, { href: "/about", label: "About" } ];

export default function LandingPage() {
  return (
    <div className="portfolio">
      <AiLandingAnalytics />
      <a href="#main-content" className="portfolio-skip">Skip to content</a>
      <header className="folio-header">
        <div className="folio-container folio-header-inner">
          <Link href="/" className="folio-brand" aria-label="Tulsa Applied AI home"><span className="folio-brand-mark"><Command size={21} aria-hidden="true" /></span><span>TULSA<span className="folio-brand-sub">APPLIED AI</span></span></Link>
          <nav aria-label="Primary" className="folio-nav">{navigation.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
          <a className="folio-source" href="https://github.com/jcsenka013-lgtm/tulsa-ai-readiness-index" target="_blank" rel="noopener noreferrer">Source code <ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          <details className="folio-mobile-menu"><summary aria-label="Open navigation"><Menu size={22} /></summary><nav aria-label="Mobile primary">{navigation.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></details>
        </div>
      </header>
      <main id="main-content">
        <section className="folio-hero folio-container">
          <div className="folio-eyebrow"><span className="folio-status-dot" /> INDEPENDENT PROJECT / FULL-STACK PRODUCT</div>
          <div className="folio-hero-grid">
            <h1>Applied<br />intelligence.<br /><span className="folio-serif">Built to work.</span></h1>
            <div className="folio-hero-aside"><span className="folio-index">PROJECT 001 — AI READINESS INDEX</span><p>Turning a complicated business question into a clear next move.</p><p className="folio-hero-description">A working assessment platform that connects Microsoft 365 expertise, thoughtful product design, and full-stack engineering.</p><div className="folio-hero-actions"><a href="#demo" className="folio-button">Explore the product <ArrowDown size={17} aria-hidden="true" /></a><a href="#engineering" className="folio-text-link">See how it’s built <ArrowUpRight size={16} aria-hidden="true" /></a></div></div>
          </div>
          <div className="folio-hero-bottom"><span>DESIGN → LOGIC → DELIVERY</span><span>TULSA, OK <span aria-hidden="true">↗</span></span></div>
        </section>
        <section id="demo" className="folio-demo-section">
          <div className="folio-container">
            <div className="folio-section-heading"><div><span className="folio-eyebrow">01 / EXPERIENCE THE PRODUCT</span><h2>Less pitch.<br /><span className="folio-serif">More proof.</span></h2></div><p>Pick a business. Explore its readiness.<br />See what the system recommends.<br /><span>No signup. Fictional businesses. Real scoring.</span></p></div>
            <ReadinessPreview profiles={profiles} />
            <div className="folio-demo-caption"><span><span className="folio-status-dot" /> WORKING DEMO · SAME ENGINE AS THE ASSESSMENT</span><Link href="/assessment">Assess your own business <ArrowRight size={16} aria-hidden="true" /></Link></div>
          </div>
        </section>
        <section className="folio-context folio-container">
          <span className="folio-eyebrow">THE PROBLEM</span><div><h2>“Should we adopt AI?”<br />is the wrong first question.</h2><p>Before a business buys another tool, it needs to understand its data, processes, people, and appetite for change. The AI Readiness Index turns those dependencies into a structured assessment and a practical roadmap.</p><p className="folio-context-note">My work connects the assessment experience, scoring logic, reporting, and follow-up into one product.</p></div>
        </section>
        <ProjectShowcase />
        <section className="folio-closing folio-container"><span className="folio-eyebrow">EXPLORE FURTHER</span><h2>The details<br /><span className="folio-serif">make the difference.</span></h2><div className="folio-closing-links"><Link href="/sample-report">Read the full report <ArrowUpRight aria-hidden="true" /></Link><Link href="/copilot">Explore the Copilot product <ArrowUpRight aria-hidden="true" /></Link><Link href="/contact">Get in touch <ArrowUpRight aria-hidden="true" /></Link></div></section>
      </main>
      <footer className="folio-footer folio-container"><div><strong>TULSA APPLIED AI</strong><p>Practical thinking. Working software.</p></div><nav aria-label="Footer"><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></nav><span>© {new Date().getFullYear()} Tulsa Applied AI LLC</span></footer>
    </div>
  );
}
