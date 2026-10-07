"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, Check, ChevronRight, ShieldCheck } from "lucide-react";
import type { AssessmentResult } from "@/lib/scoring";

type DemoProfile = {
  id: string;
  label: string;
  name: string;
  context: string;
  summary: string;
  href: string;
  result: Pick<AssessmentResult, "scores" | "tier" | "recommendedNextStep" | "insights">;
};

const NEXT_STEPS = { audit: "Start with a readiness audit", pilot: "Run a focused pilot", retainer: "Build an ongoing AI program", foundation_work: "Strengthen the foundation first" };

export function ReadinessPreview({ profiles }: { profiles: DemoProfile[] }) {
  const [selectedId, setSelectedId] = useState(profiles[0].id);
  const selected = profiles.find(profile => profile.id === selectedId) ?? profiles[0];
  const { scores, tier, insights, recommendedNextStep } = selected.result;
  const domains = [
    ["Data & security", scores.dataSecurityCompliance],
    ["Operations", scores.operationalProcessMaturity],
    ["Technology", scores.technologyInfrastructure],
    ["People & change", scores.teamChangeManagement],
    ["Strategy & investment", scores.financialStrategicAlignment],
  ] as const;
  const priority = insights.find(insight => insight.severity === "critical") ?? insights[0];

  return (
    <div className="readiness-workspace">
      <div className="workspace-toolbar"><span><span className="workspace-dots" aria-hidden="true"><i /><i /><i /></span>READINESS / EXPLORER</span><span className="workspace-live"><span />Interactive demo</span></div>
      <div className="workspace-grid">
        <aside className="workspace-sidebar">
          <p className="workspace-label">CHOOSE A BUSINESS</p>
          <div className="workspace-profile-options" role="group" aria-label="Sample business">
            {profiles.map(profile => <button type="button" key={profile.id} aria-pressed={selectedId === profile.id} onClick={() => setSelectedId(profile.id)} className={`workspace-profile ${selectedId === profile.id ? "is-selected" : ""}`}><Building2 size={18} aria-hidden="true" /><span>{profile.label}</span>{selectedId === profile.id ? <Check size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}</button>)}
          </div>
          <div className="workspace-brief"><span className="workspace-label">THE BUSINESS CONTEXT</span><p>{selected.summary}</p></div>
          <div className="workspace-sidebar-note"><ShieldCheck size={17} aria-hidden="true" /><span>This demo stays in your browser. No personal details required.</span></div>
        </aside>
        <div className="workspace-results" aria-live="polite" aria-atomic="true">
          <div className="workspace-report-heading"><div><p className="workspace-label">ASSESSMENT OVERVIEW</p><h3>{selected.name}</h3><p>{selected.context}</p></div><span className="workspace-sample">SAMPLE</span></div>
          <div className="workspace-score-grid">
            <div className="workspace-score"><div className="workspace-score-ring" style={{ background: `conic-gradient(#d5f272 ${scores.overall * 3.6}deg, #2c3a48 0deg)` }}><div><strong>{Math.round(scores.overall)}</strong><span>OUT OF 100</span></div></div><span className="workspace-tier">{tier}</span><p>Overall AI readiness</p></div>
            <div className="workspace-domains">{domains.map(([label, score], index) => <div className="workspace-domain" key={label}><div><span><small>0{index + 1}</small>{label}</span><strong>{Math.round(score)}<small> / 100</small></strong></div><div className="workspace-bar" aria-hidden="true"><div style={{ width: `${score}%` }} /></div></div>)}</div>
          </div>
          <div className="workspace-insight"><span className="workspace-insight-icon"><ArrowUpRight size={20} aria-hidden="true" /></span><div><p className="workspace-label">PRIORITY INSIGHT · {priority.severity}</p><h4>{priority.title}</h4><p>{priority.recommendedAction}</p></div></div>
          <div className="workspace-report-footer"><div><span className="workspace-label">RECOMMENDED NEXT MOVE</span><p>{NEXT_STEPS[recommendedNextStep]}</p></div><Link href={selected.href}>Open full report <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
        </div>
      </div>
    </div>
  );
}
