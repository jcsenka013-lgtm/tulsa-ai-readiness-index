/**
 * Microsoft 365 / security vocabulary — plain-English glosses for owners who
 * have heard the terms from IT. Keys are the phrases we match in question copy
 * (longest matches should be listed before shorter overlapping ones in parsers
 * that sort by length).
 */
export const M365_GLOSSARY: Record<
  string,
  { term: string; plainEnglish: string }
> = {
  "Microsoft Purview": {
    term: "Microsoft Purview",
    plainEnglish:
      "Microsoft’s umbrella brand for data governance: classifying sensitive data, controlling access, and logging who touched what — the layer that helps keep AI from surfacing the wrong files.",
  },
  Purview: {
    term: "Purview",
    plainEnglish:
      "Short for Microsoft Purview — tools to find, label, and protect data across Microsoft 365 and other systems before AI or people over-share it.",
  },
  "Defender XDR": {
    term: "Defender XDR",
    plainEnglish:
      "Microsoft’s extended detection and response stack: email, devices, identities, and cloud apps tied into one investigation view so attacks (and risky AI use) surface in one place.",
  },
  "Microsoft 365 Defender": {
    term: "Microsoft 365 Defender",
    plainEnglish:
      "The integrated Microsoft security suite tying together email, endpoint, identity, and cloud-app signals so analysts see related alerts together.",
  },
  "Defender for Office 365": {
    term: "Defender for Office 365",
    plainEnglish:
      "Email and collaboration protection: anti-phishing, safe links/attachments, and controls for malicious messages before users click.",
  },
  "Defender for Endpoint": {
    term: "Defender for Endpoint",
    plainEnglish:
      "Security on laptops and servers — detecting malware, unusual behavior, and risky scripts where work actually happens.",
  },
  "Defender for Cloud Apps": {
    term: "Defender for Cloud Apps",
    plainEnglish:
      "A cloud access security broker: visibility into which SaaS and AI tools people use, and policies to allow or block them.",
  },
  Copilot: {
    term: "Copilot",
    plainEnglish:
      "Microsoft’s AI assistant embedded in 365 apps (Word, Excel, Outlook, Teams, etc.) that can draft, summarize, and answer using your tenant data with the permissions a user already has.",
  },
  "Copilot for Microsoft 365": {
    term: "Copilot for Microsoft 365",
    plainEnglish:
      "The paid Microsoft 365 add-on that brings generative AI into the apps you already pay for, using your org’s files and mail under the same sign-in and policies.",
  },
  "Entra ID": {
    term: "Entra ID",
    plainEnglish:
      "Microsoft’s cloud identity system (formerly Azure AD). It decides who the user is, which apps they can open, and which conditional rules apply on sign-in.",
  },
  "Conditional Access": {
    term: "Conditional Access",
    plainEnglish:
      "If-this-then-that rules for sign-in — for example, require MFA outside the office or block legacy login methods — applied through Entra ID.",
  },
  MFA: {
    term: "MFA (multi-factor authentication)",
    plainEnglish:
      "Something you know (password) plus something you have (phone app, text, or key). Dramatically shrinks account takeover risk.",
  },
  DLP: {
    term: "DLP (data loss prevention)",
    plainEnglish:
      "Policies that detect sensitive data (health, financial, client identifiers) and block or log attempts to share it where it should not go.",
  },
  "Sensitivity Labels": {
    term: "Sensitivity Labels",
    plainEnglish:
      "Tags like “Confidential” applied to files and sites that can enforce encryption, watermarking, and who can open or summarize content — including with Copilot.",
  },
  "Sensitivity Label": {
    term: "Sensitivity Label",
    plainEnglish:
      "A classification tag on a file or site that can trigger encryption, access rules, and tracking — part of Microsoft Purview Information Protection.",
  },
  "SharePoint Online": {
    term: "SharePoint Online",
    plainEnglish:
      "Microsoft 365’s document libraries and team sites: where many policies (sharing, guest access, labels) apply to files people edit every day.",
  },
  "Microsoft Teams": {
    term: "Microsoft Teams",
    plainEnglish:
      "Chat, meetings, and channels in Microsoft 365. Guest access and retention settings there affect who can see conversations AI might reference.",
  },
  OneDrive: {
    term: "OneDrive",
    plainEnglish:
      "Personal work files in Microsoft 365, synced from laptops. DLP, labels, and sharing settings apply the same as for SharePoint.",
  },
  "eDiscovery": {
    term: "eDiscovery",
    plainEnglish:
      "Search and hold tools for email and files for legal, compliance, and investigations — to produce records when you must show who had what, when.",
  },
  "Zero Trust": {
    term: "Zero Trust",
    plainEnglish:
      "A security model that verifies every sign-in and device, assumes breach, and limits access to the least required — not “once inside, trusted forever.”",
  },
  BAA: {
    term: "BAA (Business Associate Agreement)",
    plainEnglish:
      "A HIPAA contract under which a vendor may handle protected health information. You need it before health data is processed in cloud services, including some AI features.",
  },
  HIPAA: {
    term: "HIPAA",
    plainEnglish:
      "U.S. law governing privacy and security of health information. It affects what you can put in email, Teams, and AI tools that might see patient data.",
  },
  "SOC 2": {
    term: "SOC 2",
    plainEnglish:
      "A common security audit customers ask for. If you promise certain controls, your Microsoft 365 and AI usage should match those promises.",
  },
  "PCI-DSS": {
    term: "PCI-DSS",
    plainEnglish:
      "Payment card industry security standards. Card data in mailboxes or file shares is in scope for strict controls and usually must not be fed to broad AI features.",
  },
  PHI: {
    term: "PHI (protected health information)",
    plainEnglish:
      "Individually identifiable health information governed by HIPAA — extra care is required before it appears in search, AI, or external sharing.",
  },
  "Entitlement Management": {
    term: "Entitlement Management",
    plainEnglish:
      "Entra feature for governed access packages and guest lifecycles — so partners and clients get the right level of access for a defined time.",
  },
  "Access Reviews": {
    term: "Access Reviews",
    plainEnglish:
      "Periodic recertification: managers or owners confirm that guests and members still need access to teams and resources.",
  },
  "legacy authentication": {
    term: "legacy authentication",
    plainEnglish:
      "Older login protocols that skip modern MFA — attackers love them. Conditional Access is often used to block them entirely.",
  },
  "shadow IT": {
    term: "shadow IT",
    plainEnglish:
      "Apps and services employees adopt without official approval — including consumer AI tools — often invisible to central IT until you monitor cloud app use.",
  },
  CASB: {
    term: "CASB (cloud access security broker)",
    plainEnglish:
      "A layer that sits between users and cloud apps to discover usage, enforce policy, and reduce risky uploads or logins. Microsoft’s answer is Defender for Cloud Apps.",
  },
  "FIDO2": {
    term: "FIDO2 / phishing-resistant MFA",
    plainEnglish:
      "Hardware security keys and modern authenticator methods that can’t be tricked the same way SMS codes can for targeted attacks.",
  },
  SIEM: {
    term: "SIEM",
    plainEnglish:
      "Security information and event management — a log warehouse where you correlate sign-ins, device alerts, and app activity for investigation.",
  },
  "Data Map": {
    term: "Data Map (Purview)",
    plainEnglish:
      "A Purview view that catalogs where data lives (cloud, on-prem, SaaS) to support classification and risk reporting.",
  },
  "App Protection Policies": {
    term: "App Protection Policies",
    plainEnglish:
      "Controls on mobile apps so work data can be wiped or blocked from copy/paste to personal apps on unmanaged devices.",
  },
  "Intune": {
    term: "Microsoft Intune",
    plainEnglish:
      "Mobile device and app management: enroll devices, push policies, and require healthy posture before data or Copilot is reachable.",
  },
  "Azure OpenAI": {
    term: "Azure OpenAI",
    plainEnglish:
      "OpenAI models hosted in your Azure subscription with data residency and network controls — an alternative to public ChatGPT for regulated work.",
  },
  "Service Trust Portal": {
    term: "Microsoft Service Trust Portal",
    plainEnglish:
      "Where Microsoft publishes compliance documents and audit reports (HIPAA, SOC, etc.) you can share with your own counsel or customers.",
  },
};

const ESCAPE_REGEX = /[\\^$.*+?()[\]{}|]/g;

function escapeRegExp(s: string): string {
  return s.replace(ESCAPE_REGEX, "\\$&");
}

const SORTED_GLOSSARY_KEYS = Object.keys(M365_GLOSSARY).sort(
  (a, b) => b.length - a.length,
);

const GLOSSARY_SPLIT_REGEX = new RegExp(
  `(${SORTED_GLOSSARY_KEYS.map(escapeRegExp).join("|")})`,
  "gi",
);

export function splitTextWithGlossary(
  text: string,
): { type: "text" | "term"; value: string; key: string }[] {
  if (!text) return [];
  const parts = text.split(GLOSSARY_SPLIT_REGEX);
  const out: { type: "text" | "term"; value: string; key: string }[] = [];
  for (const part of parts) {
    if (part === "") continue;
    const key = SORTED_GLOSSARY_KEYS.find(
      (k) => k.toLowerCase() === part.toLowerCase(),
    );
    if (key) {
      out.push({ type: "term", value: part, key });
    } else {
      out.push({ type: "text", value: part, key: "" });
    }
  }
  return out;
}
