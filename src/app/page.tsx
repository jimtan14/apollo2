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
  { name: "CRM / Sales Software", defaultCpc: 12.5, defaultCpl: 180, defaultTraffic: 45000, defaultConversion: 3.2, aiShift: 32 },
  { name: "Project Management", defaultCpc: 8.2, defaultCpl: 120, defaultTraffic: 32000, defaultConversion: 4.1, aiShift: 28 },
  { name: "Email Marketing", defaultCpc: 6.8, defaultCpl: 95, defaultTraffic: 28000, defaultConversion: 3.8, aiShift: 35 },
  { name: "E-commerce Platform", defaultCpc: 9.4, defaultCpl: 150, defaultTraffic: 55000, defaultConversion: 2.8, aiShift: 30 },
  { name: "Cybersecurity", defaultCpc: 18.5, defaultCpl: 280, defaultTraffic: 22000, defaultConversion: 2.5, aiShift: 25 },
  { name: "HR Software", defaultCpc: 10.2, defaultCpl: 165, defaultTraffic: 30000, defaultConversion: 3.5, aiShift: 27 },
  { name: "Marketing Automation", defaultCpc: 11.8, defaultCpl: 200, defaultTraffic: 35000, defaultConversion: 3.0, aiShift: 33 },
  { name: "Cloud Storage", defaultCpc: 7.5, defaultCpl: 110, defaultTraffic: 50000, defaultConversion: 3.6, aiShift: 30 },
  { name: "Analytics / BI", defaultCpc: 14.0, defaultCpl: 220, defaultTraffic: 25000, defaultConversion: 2.9, aiShift: 29 },
  { name: "Other / Custom", defaultCpc: 10.0, defaultCpl: 150, defaultTraffic: 30000, defaultConversion: 3.0, aiShift: 30 },
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
/*  Colors (inline-safe)                                               */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#0c0c20",
  surf: "#161630",
  surf2: "#1e1e3a",
  green: "#00ff64",
  greenHover: "#00cc50",
  greenDark: "#01200d",
  greenMuted: "rgba(0,255,100,0.08)",
  greenBorder: "rgba(0,255,100,0.25)",
  border: "rgba(255,255,255,0.08)",
  text: "#ffffff",
  muted: "#9b9bb5",
  dim: "#64647e",
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
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    backgroundColor: C.surf,
    padding: "12px 16px",
    fontSize: 14,
    color: C.text,
    outline: "none",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  /* ---- Result card ---- */
  const RCard = ({ label, value, sub, hl }: { label: string; value: string; sub?: string; hl?: boolean }) => (
    <div
      className={hl ? "animate-glow" : ""}
      style={{
        borderRadius: 16,
        border: `1px solid ${hl ? C.greenBorder : C.border}`,
        backgroundColor: hl ? C.greenMuted : C.surf,
        padding: 24,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: hl ? 32 : 28, fontWeight: 800, color: hl ? C.green : C.text, lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>{sub}</p>}
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 80 }}>
      {/* ============ NAV ============ */}
      <nav style={{ borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="https://airops.com" target="_blank" rel="noopener noreferrer" style={{ color: C.text, fontWeight: 700, fontSize: 18, textDecoration: "none", fontFamily: "var(--font-sans)" }}>
            airOps
          </a>
          <a
            href="https://airops.com/book-a-call"
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: C.green, color: C.greenDark, fontSize: 14, fontWeight: 700, padding: "10px 24px", borderRadius: 50, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            Book a Demo
            <span style={{ fontSize: 16 }}>&rarr;</span>
          </a>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(180deg, rgba(77,101,255,0.08) 0%, transparent 60%)` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: 700, color: C.text, lineHeight: 1.2, marginBottom: 24 }}>
            How Much Is AI Search{" "}
            <span style={{ color: C.green }}>Costing You</span>?
          </h1>

          <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, marginBottom: 48, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
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
                borderRadius: 50,
                border: `1px solid ${C.border}`,
                backgroundColor: C.surf,
                padding: "18px 28px",
                fontSize: 16,
                color: C.text,
                outline: "none",
                textAlign: "center",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: C.green,
                color: C.greenDark,
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 36px",
                borderRadius: 50,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Get My Estimate
              <span>&rarr;</span>
            </button>
          </form>
        </div>
      </section>

      {/* ============ STEP 2: DETAILS ============ */}
      {step === 2 && (
        <section ref={formRef} className="animate-fade-in-up" style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 0" }}>
          <div style={{ borderRadius: 20, border: `1px solid ${C.border}`, backgroundColor: C.surf, padding: "48px 40px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>
              About <span style={{ color: C.green }}>{displayUrl}</span>
            </h2>
            <p style={{ fontSize: 14, color: C.dim, marginBottom: 36 }}>
              Industry benchmarks are pre-filled. Adjust to match your business.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 32px" }}>
              {/* Industry */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>Industry</label>
                <select value={form.industry} onChange={(e) => handleIndustryChange(e.target.value)} style={selectStyle}>
                  {INDUSTRIES.map((ind) => <option key={ind.name} value={ind.name}>{ind.name}</option>)}
                </select>
              </div>

              {/* Traffic */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Monthly Organic Traffic</label>
                <p style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>Monthly organic search visitors</p>
                <input type="number" min={0} value={form.monthlyOrganicTraffic} onChange={(e) => set("monthlyOrganicTraffic", Math.max(0, parseInt(e.target.value) || 0))} style={inputStyle} />
              </div>

              {/* CPC */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Average CPC ($)</label>
                <p style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>Cost-per-click in your space</p>
                <input type="number" min={0} step={0.1} value={form.avgCpc} onChange={(e) => set("avgCpc", Math.max(0, parseFloat(e.target.value) || 0))} style={inputStyle} />
              </div>

              {/* CPL */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Cost per Lead ($)</label>
                <p style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>Cost to acquire one qualified lead</p>
                <input type="number" min={0} step={1} value={form.costPerLead} onChange={(e) => set("costPerLead", Math.max(0, parseFloat(e.target.value) || 0))} style={inputStyle} />
              </div>

              {/* Conversion */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Conversion Rate (%)</label>
                <p style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>% of visitors that become leads</p>
                <input type="number" min={0} max={100} step={0.1} value={form.conversionRate} onChange={(e) => set("conversionRate", Math.max(0, parseFloat(e.target.value) || 0))} style={inputStyle} />
              </div>

              {/* AI shift slider */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                  Traffic Shifting to AI Search: <span style={{ color: C.green }}>{form.aiShiftPct}%</span>
                </label>
                <p style={{ fontSize: 11, color: C.dim, marginBottom: 10 }}>Share of organic queries now happening on AI platforms</p>
                <input type="range" min={10} max={60} step={1} value={form.aiShiftPct} onChange={(e) => set("aiShiftPct", parseInt(e.target.value))} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.dim, marginTop: 4 }}>
                  <span>10% conservative</span><span>60% aggressive</span>
                </div>
              </div>

              {/* AI mention rate */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                  AI Mention Rate: <span style={{ color: C.green }}>{form.aiMentionRate}%</span>
                </label>
                <p style={{ fontSize: 11, color: C.dim, marginBottom: 10 }}>How often AI cites your brand when buyers ask about your category</p>
                <input type="range" min={0} max={100} step={5} value={form.aiMentionRate} onChange={(e) => set("aiMentionRate", parseInt(e.target.value))} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.dim, marginTop: 4 }}>
                  <span>0% invisible</span><span>100% always cited</span>
                </div>
              </div>
            </div>

            {/* Calculate */}
            <div style={{ marginTop: 40, textAlign: "center" }}>
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                style={{
                  backgroundColor: C.green,
                  color: C.greenDark,
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "14px 40px",
                  borderRadius: 50,
                  border: "none",
                  cursor: isCalculating ? "wait" : "pointer",
                  opacity: isCalculating ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {isCalculating ? "Analyzing..." : "Calculate Revenue Loss →"}
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
              <p style={{ fontSize: 13, fontWeight: 600, color: C.green, letterSpacing: "0.08em", marginBottom: 12 }}>YOUR RESULTS</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, color: C.text, marginBottom: 8 }}>
                AI search impact for <span style={{ color: C.green }}>{displayUrl}</span>
              </h2>
              <p style={{ fontSize: 14, color: C.dim }}>
                {form.industry} · {fmt(form.monthlyOrganicTraffic)} monthly organic visitors · {form.aiMentionRate}% mention rate
              </p>
            </div>

            {/* Top metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              <div className="opacity-0 animate-count-up stagger-1"><RCard label="Queries Shifting to AI" value={fmt(results.estimatedAiQueries)} sub={`${form.aiShiftPct}% of ${fmt(form.monthlyOrganicTraffic)} organic visits`} /></div>
              <div className="opacity-0 animate-count-up stagger-2"><RCard label="Monthly Lost Clicks" value={fmt(results.lostClicks)} sub="Clicks going to competitors cited by AI" /></div>
              <div className="opacity-0 animate-count-up stagger-3"><RCard label="Monthly Lost Leads" value={fmt(results.lostLeads)} sub={`At ${form.conversionRate}% conversion rate`} /></div>
            </div>

            {/* CPC */}
            <p style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Valued by Cost-Per-Click (${form.avgCpc}/click)</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              <div className="opacity-0 animate-count-up stagger-4"><RCard label="Monthly Loss (CPC)" value={fmtDF(results.monthlyLossCpc)} sub={`${fmt(results.lostClicks)} clicks × $${form.avgCpc}`} /></div>
              <div className="opacity-0 animate-count-up stagger-5"><RCard label="Annual Loss (CPC)" value={fmtD(results.annualLossCpc)} hl sub="Ad spend to replace these clicks" /></div>
              <div className="opacity-0 animate-count-up stagger-6"><RCard label="3-Year Loss (CPC)" value={fmtD(results.threeYearLossCpc)} sub="15% YoY AI search growth" /></div>
            </div>

            {/* CPL */}
            <p style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Valued by Cost-Per-Lead (${fmt(form.costPerLead)}/lead)</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              <div className="opacity-0 animate-count-up stagger-4"><RCard label="Monthly Loss (CPL)" value={fmtDF(results.monthlyLossCpl)} sub={`${fmt(results.lostLeads)} leads × $${fmt(form.costPerLead)}`} /></div>
              <div className="opacity-0 animate-count-up stagger-5"><RCard label="Annual Loss (CPL)" value={fmtD(results.annualLossCpl)} hl sub="Pipeline value lost from missing citations" /></div>
              <div className="opacity-0 animate-count-up stagger-6"><RCard label="3-Year Loss (CPL)" value={fmtD(results.threeYearLossCpl)} sub="15% YoY AI search growth" /></div>
            </div>

            {/* Opportunity */}
            <div className="opacity-0 animate-count-up stagger-7" style={{ borderRadius: 16, border: `1px solid ${C.greenBorder}`, backgroundColor: C.greenMuted, padding: "32px 36px", marginBottom: 40 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>The upside: get cited in AI results</h3>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7 }}>
                Brands that earn the <span style={{ color: C.green, fontWeight: 600 }}>#1 cited position</span> capture up to{" "}
                <span style={{ color: C.text, fontWeight: 700 }}>{fmt(results.potentialClicksIfVisible)} clicks/month</span> from AI search.
                That&apos;s <span style={{ color: C.text, fontWeight: 700 }}>{fmt(results.potentialClicksIfVisible * (form.conversionRate / 100))} leads</span> worth{" "}
                <span style={{ color: C.green, fontWeight: 700 }}>{fmtDF(results.potentialClicksIfVisible * (form.conversionRate / 100) * form.costPerLead)}/month</span> in pipeline for {displayUrl}.
              </p>
            </div>

            {/* CTA */}
            <div className="opacity-0 animate-count-up stagger-7" style={{ borderRadius: 20, border: `1px solid ${C.border}`, backgroundColor: C.surf, padding: "56px 40px", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 700, color: C.text, marginBottom: 12 }}>
                Your content should be working harder
              </h3>
              <p style={{ fontSize: 15, color: C.muted, marginBottom: 32, maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                AirOps helps brands get cited across ChatGPT, Perplexity, Gemini, and Google AI Overviews. See where you stand and start winning the clicks that matter.
              </p>
              <a
                href="https://airops.com/book-a-call"
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: C.green, color: C.greenDark, fontSize: 15, fontWeight: 700, padding: "14px 36px", borderRadius: 50, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                Book a Demo with AirOps <span>&rarr;</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ============ HOW IT WORKS (step 1) ============ */}
      {step === 1 && (
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "100px 24px 0" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, color: C.text, textAlign: "center", marginBottom: 48 }}>
            Three steps. One number that matters.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { n: "1", t: "Enter your website", d: "Drop in your URL. We set CPC, CPL, and AI shift benchmarks based on your industry." },
              { n: "2", t: "Adjust your numbers", d: "Fine-tune organic traffic, cost metrics, and how often AI mentions your brand today." },
              { n: "3", t: "See the revenue impact", d: "Get a clear breakdown: lost clicks, lost leads, and the dollar value of your AI search gap." },
            ].map((item) => (
              <div key={item.n} style={{ borderRadius: 16, border: `1px solid ${C.border}`, backgroundColor: C.surf, padding: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${C.greenBorder}`, backgroundColor: C.greenMuted, display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
                  {item.n}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>{item.t}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{item.d}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 0" }}>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, fontSize: 12, color: C.dim }}>
          <p>
            Built by{" "}
            <a href="https://airops.com" target="_blank" rel="noopener noreferrer" style={{ color: C.green, textDecoration: "none", fontWeight: 500 }}>AirOps</a>.
            Craft content that wins search.
          </p>
          <p>Benchmarks based on aggregated industry data and AI search citation analysis. Results are estimates.</p>
        </div>
      </footer>
    </main>
  );
}
