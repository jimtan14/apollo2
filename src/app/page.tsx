"use client";

import { useState, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

interface FormData {
  websiteUrl: string;
  industry: string;
  monthlyOrganicTraffic: number;
  avgCpc: number;
  costPerLead: number;
  conversionRate: number;
  aiShiftPct: number;
  aiMentionRate: number;
}

interface Results {
  estimatedAiQueries: number;
  lostClicks: number;
  monthlyLossCpc: number;
  annualLossCpc: number;
  monthlyLossCpl: number;
  annualLossCpl: number;
  lostLeads: number;
  threeYearLossCpc: number;
  threeYearLossCpl: number;
  potentialClicksIfVisible: number;
}

const INDUSTRIES = [
  { name: "Computer Software / SaaS", defaultCpc: 12.5, defaultCpl: 200, defaultTraffic: 45000, defaultConversion: 3.2, aiShift: 35 },
  { name: "Health & Wellness", defaultCpc: 8.0, defaultCpl: 160, defaultTraffic: 50000, defaultConversion: 3.5, aiShift: 28 },
  { name: "Financial Services / FinTech", defaultCpc: 15.0, defaultCpl: 250, defaultTraffic: 40000, defaultConversion: 2.8, aiShift: 30 },
  { name: "Consumer / Marketplace", defaultCpc: 5.5, defaultCpl: 85, defaultTraffic: 60000, defaultConversion: 3.8, aiShift: 30 },
  { name: "Marketing & Advertising", defaultCpc: 11.8, defaultCpl: 180, defaultTraffic: 35000, defaultConversion: 3.0, aiShift: 33 },
  { name: "Education & Training", defaultCpc: 6.0, defaultCpl: 90, defaultTraffic: 55000, defaultConversion: 4.0, aiShift: 32 },
  { name: "Entertainment / Media", defaultCpc: 3.5, defaultCpl: 70, defaultTraffic: 40000, defaultConversion: 3.8, aiShift: 26 },
  { name: "Cybersecurity / Infrastructure", defaultCpc: 18.5, defaultCpl: 280, defaultTraffic: 22000, defaultConversion: 2.5, aiShift: 25 },
  { name: "Legal / Professional Services", defaultCpc: 10.0, defaultCpl: 190, defaultTraffic: 30000, defaultConversion: 3.0, aiShift: 28 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const fmtD = (n: number) => {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return "$" + Math.round(n).toLocaleString("en-US");
};
const fmtDF = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const cleanUrl = (u: string) => u.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

/* ------------------------------------------------------------------ */
/*  Calculation                                                        */
/* ------------------------------------------------------------------ */

function calculate(d: FormData): Results {
  const estimatedAiQueries = d.monthlyOrganicTraffic * (d.aiShiftPct / 100);
  const lossRate = 1 - (d.aiMentionRate / 100) * 0.35;
  const lostClicks = Math.round(estimatedAiQueries * lossRate);
  const monthlyLossCpc = lostClicks * d.avgCpc;
  const annualLossCpc = monthlyLossCpc * 12;
  const lostLeads = lostClicks * (d.conversionRate / 100);
  const monthlyLossCpl = lostLeads * d.costPerLead;
  const annualLossCpl = monthlyLossCpl * 12;
  const threeYearLossCpc = annualLossCpc + annualLossCpc * 1.15 + annualLossCpc * 1.3225;
  const threeYearLossCpl = annualLossCpl + annualLossCpl * 1.15 + annualLossCpl * 1.3225;
  const potentialClicksIfVisible = Math.round(estimatedAiQueries * 0.35);
  return { estimatedAiQueries, lostClicks, monthlyLossCpc, annualLossCpc, monthlyLossCpl, annualLossCpl, lostLeads, threeYearLossCpc, threeYearLossCpl, potentialClicksIfVisible };
}

/* ------------------------------------------------------------------ */
/*  Colors                                                             */
/* ------------------------------------------------------------------ */

const C = {
  white: "#ffffff",
  offWhite: "#F8FFFA",
  nearBlack: "#000d05",
  green50: "#f8fffb",
  green100: "#dfeae3",
  green200: "#CCFFE0",
  green500: "#008c44",
  green600: "#002910",
  interaction: "#00ff64",
  accentLabel: "#EEFF8C",
  textPrimary: "#09090b",
  textSecondary: "#676c79",
  textTertiary: "#a5aab6",
  strokePrimary: "#ecedef",
  strokeGreen: "#d4e8da",
  heroBg: "#002910",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>({
    websiteUrl: "",
    industry: INDUSTRIES[0].name,
    monthlyOrganicTraffic: INDUSTRIES[0].defaultTraffic,
    avgCpc: INDUSTRIES[0].defaultCpc,
    costPerLead: INDUSTRIES[0].defaultCpl,
    conversionRate: INDUSTRIES[0].defaultConversion,
    aiShiftPct: INDUSTRIES[0].aiShift,
    aiMentionRate: 0,
  });
  const [results, setResults] = useState<Results | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.websiteUrl.trim()) return;
    setStep(2);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleIndustryChange = (name: string) => {
    const ind = INDUSTRIES.find((i) => i.name === name);
    if (ind) setForm((prev) => ({ ...prev, industry: ind.name, avgCpc: ind.defaultCpc, costPerLead: ind.defaultCpl, monthlyOrganicTraffic: ind.defaultTraffic, conversionRate: ind.defaultConversion, aiShiftPct: ind.aiShift }));
    else set("industry", name);
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    setShowResults(false);
    setTimeout(() => {
      setResults(calculate(form));
      setIsCalculating(false);
      setShowResults(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }, 800);
  };

  const displayUrl = cleanUrl(form.websiteUrl) || "your site";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 0,
    border: `1px solid ${C.strokeGreen}`,
    backgroundColor: C.white,
    padding: "12px 16px",
    fontSize: 16,
    fontFamily: "var(--font-sans)",
    color: C.textPrimary,
    outline: "none",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: C.textSecondary,
    marginBottom: 6,
  };

  /* ---- Result card ---- */
  const RCard = ({ label, value, sub, hl }: { label: string; value: string; sub?: string; hl?: boolean }) => (
    <div
      className={hl ? "animate-glow" : ""}
      style={{
        borderRadius: 0,
        border: `1px solid ${C.strokeGreen}`,
        backgroundColor: hl ? C.green50 : C.white,
        padding: 24,
      }}
    >
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: hl ? 32 : 28, fontWeight: 400, color: hl ? C.green500 : C.textPrimary, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: 13, color: C.textTertiary, marginTop: 8 }}>{sub}</p>}
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 80, backgroundColor: C.white }}>
      {/* ============ NAV ============ */}
      <nav style={{ borderBottom: `1px solid ${C.strokePrimary}`, backgroundColor: C.white }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="https://airops.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            <svg width="98" height="32" viewBox="0 0 784 252" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M111.828 65.6415V88.4663C101.564 72.0112 85.627 61.9258 65.9084 61.9258C23.7703 61.9258 0 92.9782 0 134.647C0 176.581 24.0404 208.695 66.4487 208.695C86.1672 208.695 101.834 198.609 111.828 182.154V204.979H144.782V65.6415H111.828ZM72.9315 181.093C48.8911 181.093 35.1152 159.064 35.1152 134.647C35.1152 110.76 48.621 89.7933 73.4717 89.7933C94.0006 89.7933 111.558 104.391 111.558 134.116C111.558 163.31 94.8109 181.093 72.9315 181.093Z" fill="#001408"/>
              <path d="M173.137 65.6494V204.987H208.252V65.6494H173.137Z" fill="#001408"/>
              <path d="M272.998 100.141V65.6386H237.883V204.976H272.998V125.355C272.998 104.919 287.314 96.691 300.82 96.691C308.653 96.691 316.757 98.8143 321.079 100.407V63.25C298.119 63.25 279.211 76.7856 272.998 100.141Z" fill="#001408"/>
              <path d="M329.629 108.115C329.629 151.377 359.882 182.163 403.371 182.163C447.13 182.163 477.115 151.377 477.115 108.115C477.115 65.6507 447.13 35.3945 403.371 35.3945C359.882 35.3945 329.629 65.6507 329.629 108.115ZM441.997 108.115C441.997 135.187 427.141 154.561 403.371 154.561C379.33 154.561 364.744 135.187 364.744 108.115C364.744 82.1058 379.33 63.2621 403.371 63.2621C427.141 63.2621 441.997 82.1058 441.997 108.115Z" fill="#001408"/>
              <path d="M575.086 61.9258C554.557 61.9258 537.81 73.869 528.896 92.9782V65.6415H493.781V251.425H528.896V180.031C538.891 197.282 557.529 208.695 577.247 208.695C615.604 208.695 642.345 179.235 642.345 137.035C642.345 92.7128 614.523 61.9258 575.086 61.9258ZM568.874 182.685C545.374 182.685 528.896 163.31 528.896 135.708C528.896 107.31 545.374 87.4047 568.874 87.4047C591.293 87.4047 607.23 107.841 607.23 136.77C607.23 163.841 591.293 182.685 568.874 182.685Z" fill="#001408"/>
              <path d="M653.555 156.675C653.555 181.889 676.244 208.695 721.624 208.695C767.274 208.695 783.751 182.42 783.751 161.983C783.751 130.666 746.205 125.092 721.084 120.315C704.066 117.395 693.262 115.007 693.262 105.452C693.262 94.5706 705.417 87.6701 718.383 87.6701C735.94 87.6701 742.693 99.6133 743.233 112.353H778.349C778.349 91.6511 763.492 61.9258 717.572 61.9258C677.865 61.9258 658.147 83.9544 658.147 107.575C658.147 141.282 696.233 144.732 721.354 149.509C735.94 152.163 748.636 155.348 748.636 165.699C748.636 176.05 736.21 182.95 722.975 182.95C710.549 182.95 688.67 176.05 688.67 156.675H653.555Z" fill="#001408"/>
              <path d="M191.339 48.6576C176.921 48.6576 166.578 38.4949 166.578 24.6368C166.578 10.7786 176.921 0 191.339 0C205.13 0 216.1 10.7786 216.1 24.6368C216.1 38.4949 205.13 48.6576 191.339 48.6576Z" fill="#001408"/>
            </svg>
          </a>
          <a
            href="https://airops.com/book-a-call"
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: C.nearBlack, color: C.white, fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 600, padding: "10px 24px", borderRadius: 0, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            Book a demo
            <span style={{ fontSize: 16 }}>&rarr;</span>
          </a>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section style={{ position: "relative", overflow: "hidden", backgroundColor: C.heroBg }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", backgroundColor: C.accentLabel, marginBottom: 32 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.nearBlack }}>AI SEARCH CALCULATOR</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: 400, color: C.white, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 24 }}>
            How much is AI search costing you?
          </h1>

          <p style={{ fontSize: 18, fontFamily: "var(--font-sans)", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 48, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            Answer engines have raised the bar. See how much traffic and revenue your brand is losing by not showing up in AI-generated results.
          </p>

          {/* URL Input */}
          <form onSubmit={handleUrlSubmit} style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <input
              type="text"
              value={form.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              placeholder="Enter your website (e.g. airops.com)"
              style={{
                width: "100%",
                borderRadius: 0,
                border: `1px solid rgba(255,255,255,0.15)`,
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: "18px 28px",
                fontSize: 16,
                fontFamily: "var(--font-sans)",
                color: C.white,
                outline: "none",
                textAlign: "center",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: C.interaction,
                color: C.nearBlack,
                fontSize: 15,
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                padding: "14px 36px",
                borderRadius: 0,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Get my estimate
              <span>&rarr;</span>
            </button>
          </form>
        </div>
      </section>

      {/* ============ STEP 2: DETAILS ============ */}
      {step === 2 && (
        <section ref={formRef} className="animate-fade-in-up" style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 0" }}>
          <div style={{ borderRadius: 0, border: `1px solid ${C.strokeGreen}`, backgroundColor: C.white, padding: "48px 40px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, color: C.textPrimary, letterSpacing: "-0.02em", marginBottom: 4 }}>
              About <span style={{ color: C.green500 }}>{displayUrl}</span>
            </h2>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 36 }}>
              Industry benchmarks are pre-filled. Adjust to match your business.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 32px" }}>
              {/* Industry */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", ...labelStyle }}>Industry</label>
                <select value={form.industry} onChange={(e) => handleIndustryChange(e.target.value)} style={selectStyle}>
                  {INDUSTRIES.map((ind) => <option key={ind.name} value={ind.name}>{ind.name}</option>)}
                </select>
              </div>

              {/* Traffic */}
              <div>
                <label style={{ display: "block", ...labelStyle }}>Monthly organic traffic</label>
                <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 6 }}>Monthly organic search visitors</p>
                <input type="number" min={0} value={form.monthlyOrganicTraffic} onChange={(e) => set("monthlyOrganicTraffic", Math.max(0, parseInt(e.target.value) || 0))} style={inputStyle} />
              </div>

              {/* CPC */}
              <div>
                <label style={{ display: "block", ...labelStyle }}>Average CPC ($)</label>
                <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 6 }}>Cost-per-click in your space</p>
                <input type="number" min={0} step={0.1} value={form.avgCpc} onChange={(e) => set("avgCpc", Math.max(0, parseFloat(e.target.value) || 0))} style={inputStyle} />
              </div>

              {/* CPL */}
              <div>
                <label style={{ display: "block", ...labelStyle }}>Cost per lead ($)</label>
                <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 6 }}>Cost to acquire one qualified lead</p>
                <input type="number" min={0} step={1} value={form.costPerLead} onChange={(e) => set("costPerLead", Math.max(0, parseFloat(e.target.value) || 0))} style={inputStyle} />
              </div>

              {/* Conversion */}
              <div>
                <label style={{ display: "block", ...labelStyle }}>Conversion rate (%)</label>
                <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 6 }}>% of visitors that become leads</p>
                <input type="number" min={0} max={100} step={0.1} value={form.conversionRate} onChange={(e) => set("conversionRate", Math.max(0, parseFloat(e.target.value) || 0))} style={inputStyle} />
              </div>

              {/* AI shift slider */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", ...labelStyle }}>
                  Traffic shifting to AI search: <span style={{ color: C.green500 }}>{form.aiShiftPct}%</span>
                </label>
                <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 10 }}>Share of organic queries now happening on AI platforms</p>
                <input type="range" min={10} max={60} step={1} value={form.aiShiftPct} onChange={(e) => set("aiShiftPct", parseInt(e.target.value))} />
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", color: C.textTertiary, marginTop: 4 }}>
                  <span>10% CONSERVATIVE</span><span>60% AGGRESSIVE</span>
                </div>
              </div>

              {/* AI mention rate */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", ...labelStyle }}>
                  AI mention rate: <span style={{ color: C.green500 }}>{form.aiMentionRate}%</span>
                </label>
                <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 10 }}>How often AI cites your brand when buyers ask about your category</p>
                <input type="range" min={0} max={100} step={5} value={form.aiMentionRate} onChange={(e) => set("aiMentionRate", parseInt(e.target.value))} />
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", color: C.textTertiary, marginTop: 4 }}>
                  <span>0% INVISIBLE</span><span>100% ALWAYS CITED</span>
                </div>
              </div>
            </div>

            {/* Calculate */}
            <div style={{ marginTop: 40, textAlign: "center" }}>
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                style={{
                  backgroundColor: C.nearBlack,
                  color: C.white,
                  fontSize: 15,
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  padding: "14px 40px",
                  borderRadius: 0,
                  border: "none",
                  cursor: isCalculating ? "wait" : "pointer",
                  opacity: isCalculating ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {isCalculating ? "Analyzing..." : "Calculate revenue loss \u2192"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ RESULTS ============ */}
      {showResults && results && (
        <section ref={resultsRef} style={{ maxWidth: 960, margin: "0 auto", padding: "60px 24px 0" }}>
          <div className="animate-fade-in-up">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", backgroundColor: C.accentLabel, marginBottom: 16 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.nearBlack }}>YOUR RESULTS</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: C.textPrimary, letterSpacing: "-0.02em", marginBottom: 8 }}>
                AI search impact for <span style={{ color: C.green500 }}>{displayUrl}</span>
              </h2>
              <p style={{ fontSize: 14, color: C.textSecondary }}>
                {form.industry} &middot; {fmt(form.monthlyOrganicTraffic)} monthly organic visitors &middot; {form.aiMentionRate}% mention rate
              </p>
            </div>

            {/* Top metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              <div className="opacity-0 animate-count-up stagger-1"><RCard label="Queries shifting to AI" value={fmt(results.estimatedAiQueries)} sub={`${form.aiShiftPct}% of ${fmt(form.monthlyOrganicTraffic)} organic visits`} /></div>
              <div className="opacity-0 animate-count-up stagger-2"><RCard label="Monthly lost clicks" value={fmt(results.lostClicks)} sub="Clicks going to competitors cited by AI" /></div>
              <div className="opacity-0 animate-count-up stagger-3"><RCard label="Monthly lost leads" value={fmt(results.lostLeads)} sub={`At ${form.conversionRate}% conversion rate`} /></div>
            </div>

            {/* CPC */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Valued by cost-per-click (${form.avgCpc}/click)</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              <div className="opacity-0 animate-count-up stagger-4"><RCard label="Monthly loss (CPC)" value={fmtDF(results.monthlyLossCpc)} sub={`${fmt(results.lostClicks)} clicks \u00d7 $${form.avgCpc}`} /></div>
              <div className="opacity-0 animate-count-up stagger-5"><RCard label="Annual loss (CPC)" value={fmtD(results.annualLossCpc)} hl sub="Ad spend to replace these clicks" /></div>
              <div className="opacity-0 animate-count-up stagger-6"><RCard label="3-year loss (CPC)" value={fmtD(results.threeYearLossCpc)} sub="15% YoY AI search growth" /></div>
            </div>

            {/* CPL */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Valued by cost-per-lead (${fmt(form.costPerLead)}/lead)</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              <div className="opacity-0 animate-count-up stagger-4"><RCard label="Monthly loss (CPL)" value={fmtDF(results.monthlyLossCpl)} sub={`${fmt(results.lostLeads)} leads \u00d7 $${fmt(form.costPerLead)}`} /></div>
              <div className="opacity-0 animate-count-up stagger-5"><RCard label="Annual loss (CPL)" value={fmtD(results.annualLossCpl)} hl sub="Pipeline value lost from missing citations" /></div>
              <div className="opacity-0 animate-count-up stagger-6"><RCard label="3-year loss (CPL)" value={fmtD(results.threeYearLossCpl)} sub="15% YoY AI search growth" /></div>
            </div>

            {/* Opportunity */}
            <div className="opacity-0 animate-count-up stagger-7" style={{ borderRadius: 0, border: `1px solid ${C.strokeGreen}`, backgroundColor: C.green50, padding: "32px 36px", marginBottom: 40 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, color: C.textPrimary, letterSpacing: "-0.02em", marginBottom: 8 }}>The upside: get cited in AI results</h3>
              <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.7 }}>
                Brands that earn the <span style={{ color: C.green500, fontWeight: 600 }}>#1 cited position</span> capture up to{" "}
                <span style={{ color: C.textPrimary, fontWeight: 700 }}>{fmt(results.potentialClicksIfVisible)} clicks/month</span> from AI search.
                That&apos;s <span style={{ color: C.textPrimary, fontWeight: 700 }}>{fmt(results.potentialClicksIfVisible * (form.conversionRate / 100))} leads</span> worth{" "}
                <span style={{ color: C.green500, fontWeight: 700 }}>{fmtDF(results.potentialClicksIfVisible * (form.conversionRate / 100) * form.costPerLead)}/month</span> in pipeline for {displayUrl}.
              </p>
            </div>

            {/* CTA */}
            <div className="opacity-0 animate-count-up stagger-7" style={{ borderRadius: 0, border: `1px solid ${C.strokeGreen}`, backgroundColor: C.green600, padding: "56px 40px", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 400, color: C.white, letterSpacing: "-0.02em", marginBottom: 12 }}>
                Your content should be working harder
              </h3>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 32, maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                AirOps helps brands get cited across ChatGPT, Perplexity, Gemini, and Google AI Overviews. See where you stand and start winning the clicks that matter.
              </p>
              <a
                href="https://airops.com/book-a-call"
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: C.interaction, color: C.nearBlack, fontSize: 15, fontFamily: "var(--font-sans)", fontWeight: 600, padding: "14px 36px", borderRadius: 0, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                Book a demo with AirOps <span>&rarr;</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ============ HOW IT WORKS (step 1) ============ */}
      {step === 1 && (
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "100px 24px 0" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: C.textPrimary, letterSpacing: "-0.02em", textAlign: "center", marginBottom: 48 }}>
            Three steps. One number that matters.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { n: "1", t: "Enter your website", d: "Drop in your URL. We set CPC, CPL, and AI shift benchmarks based on your industry." },
              { n: "2", t: "Adjust your numbers", d: "Fine-tune organic traffic, cost metrics, and how often AI mentions your brand today." },
              { n: "3", t: "See the revenue impact", d: "Get a clear breakdown: lost clicks, lost leads, and the dollar value of your AI search gap." },
            ].map((item) => (
              <div key={item.n} style={{ borderRadius: 0, border: `1px solid ${C.strokeGreen}`, backgroundColor: C.white, padding: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 0, border: `1px solid ${C.strokeGreen}`, backgroundColor: C.green50, display: "flex", alignItems: "center", justifyContent: "center", color: C.green500, fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 15, marginBottom: 20 }}>
                  {item.n}
                </div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>{item.t}</h3>
                <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>{item.d}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 0" }}>
        <div style={{ borderTop: `1px solid ${C.strokePrimary}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, fontSize: 12, color: C.textTertiary }}>
          <p>
            Built by{" "}
            <a href="https://airops.com" target="_blank" rel="noopener noreferrer" style={{ color: C.green500, textDecoration: "none", fontWeight: 500 }}>AirOps</a>.
            Craft content that wins search.
          </p>
          <p>Benchmarks based on aggregated industry data and AI search citation analysis. Results are estimates.</p>
        </div>
      </footer>
    </main>
  );
}
