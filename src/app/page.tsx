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

const INDUSTRIES: {
  name: string;
  defaultCpc: number;
  defaultCpl: number;
  defaultTraffic: number;
  defaultConversion: number;
  aiShift: number;
}[] = [
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

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function fmtDollar(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtDollarFull(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

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

  const threeYearLossCpc = annualLossCpc + annualLossCpc * 1.15 + annualLossCpc * 1.15 * 1.15;
  const threeYearLossCpl = annualLossCpl + annualLossCpl * 1.15 + annualLossCpl * 1.15 * 1.15;

  const potentialClicksIfVisible = Math.round(estimatedAiQueries * 0.35);

  return {
    estimatedAiQueries,
    lostClicks,
    monthlyLossCpc,
    annualLossCpc,
    monthlyLossCpl,
    annualLossCpl,
    lostLeads,
    threeYearLossCpc,
    threeYearLossCpl,
    potentialClicksIfVisible,
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Label({
  children,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ao-text">
        {children}
      </label>
      {hint && <p className="text-xs text-ao-text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

function ResultCard({
  label,
  value,
  highlight,
  sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 transition-all ${
        highlight
          ? "border-ao-green/30 bg-ao-green/5 animate-glow"
          : "border-ao-border bg-ao-surface/60"
      }`}
    >
      <p className="text-xs font-semibold text-ao-text-muted mb-1.5 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`font-extrabold leading-tight ${
          highlight ? "text-3xl md:text-4xl text-ao-green" : "text-2xl md:text-3xl text-ao-text"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-ao-text-muted mt-2">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
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

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.websiteUrl.trim()) return;
    setStep(2);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleIndustryChange = (name: string) => {
    const ind = INDUSTRIES.find((i) => i.name === name);
    if (ind) {
      setForm((prev) => ({
        ...prev,
        industry: ind.name,
        avgCpc: ind.defaultCpc,
        costPerLead: ind.defaultCpl,
        monthlyOrganicTraffic: ind.defaultTraffic,
        conversionRate: ind.defaultConversion,
        aiShiftPct: ind.aiShift,
      }));
    } else {
      set("industry", name);
    }
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    setShowResults(false);

    setTimeout(() => {
      const r = calculate(form);
      setResults(r);
      setIsCalculating(false);
      setShowResults(true);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }, 800);
  };

  const displayUrl = cleanUrl(form.websiteUrl) || "your site";

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <main className="min-h-screen pb-24">
      {/* ====================== NAV ====================== */}
      <nav className="border-b border-ao-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="https://airops.com" target="_blank" rel="noopener noreferrer" className="text-ao-text font-bold text-lg tracking-tight hover:text-ao-green transition-colors">
            AirOps
          </a>
          <a
            href="https://airops.com/book-a-call"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ao-dark bg-ao-green hover:bg-ao-green-hover text-sm font-bold px-5 py-2 rounded-full transition-all"
          >
            Book a Demo
          </a>
        </div>
      </nav>

      {/* ====================== HERO ====================== */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-ao-green/5 blur-[150px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <p className="text-ao-green text-sm font-semibold tracking-wide mb-6">
            AI SEARCH ROI CALCULATOR
          </p>

          <h1 className="font-display text-4xl sm:text-5xl md:text-[3.5rem] font-bold text-ao-text leading-[1.15] mb-6">
            How much revenue is your brand losing to AI search?
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-ao-text-secondary leading-relaxed mb-10">
            Buyers ask ChatGPT, Perplexity, and Google AI Overviews for recommendations every day. Every query where your brand isn&apos;t cited is a click that goes to a competitor. Enter your website to see the cost.
          </p>

          {/* URL Input */}
          <form onSubmit={handleUrlSubmit} className="max-w-xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ao-text-muted">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={form.websiteUrl}
                  onChange={(e) => set("websiteUrl", e.target.value)}
                  placeholder="Enter your website (e.g. airops.com)"
                  className="w-full rounded-full border border-ao-border bg-ao-surface pl-12 pr-4 py-4 text-base text-ao-text placeholder-ao-text-muted focus:outline-none focus:ring-2 focus:ring-ao-green/40 focus:border-ao-green/40 transition"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-7 py-4 rounded-full bg-ao-green hover:bg-ao-green-hover text-ao-dark font-bold text-sm tracking-wide transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                Analyze
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ====================== STEP 2: DETAILS ====================== */}
      {step === 2 && (
        <section ref={formRef} className="max-w-3xl mx-auto px-6 mt-4 animate-fade-in-up">
          <div className="rounded-2xl border border-ao-border bg-ao-surface/50 p-6 sm:p-10">
            <div className="mb-1">
              <h2 className="font-display text-2xl font-bold text-ao-text">
                About{" "}
                <span className="text-ao-green">{displayUrl}</span>
              </h2>
            </div>
            <p className="text-sm text-ao-text-muted mb-8">
              Industry benchmarks are pre-filled. Adjust to match your business.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Industry */}
              <div className="md:col-span-2">
                <Label htmlFor="industry" hint="Sets default CPC, CPL, and AI shift benchmarks">
                  Industry
                </Label>
                <select
                  id="industry"
                  value={form.industry}
                  onChange={(e) => handleIndustryChange(e.target.value)}
                  className="w-full rounded-lg border border-ao-border bg-ao-dark px-4 py-2.5 text-sm text-ao-text focus:outline-none focus:ring-2 focus:ring-ao-green/40 transition"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.name} value={ind.name}>{ind.name}</option>
                  ))}
                </select>
              </div>

              {/* Monthly organic traffic */}
              <div>
                <Label htmlFor="traffic" hint="Monthly organic search visitors">
                  Monthly Organic Traffic
                </Label>
                <input
                  id="traffic"
                  type="number"
                  min={0}
                  value={form.monthlyOrganicTraffic}
                  onChange={(e) => set("monthlyOrganicTraffic", Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-ao-border bg-ao-dark px-4 py-2.5 text-sm text-ao-text focus:outline-none focus:ring-2 focus:ring-ao-green/40 transition"
                />
              </div>

              {/* Average CPC */}
              <div>
                <Label htmlFor="cpc" hint="Average cost-per-click in your space">
                  Average CPC ($)
                </Label>
                <input
                  id="cpc"
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.avgCpc}
                  onChange={(e) => set("avgCpc", Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-lg border border-ao-border bg-ao-dark px-4 py-2.5 text-sm text-ao-text focus:outline-none focus:ring-2 focus:ring-ao-green/40 transition"
                />
              </div>

              {/* Cost per Lead */}
              <div>
                <Label htmlFor="cpl" hint="Average cost to acquire one qualified lead">
                  Cost per Lead ($)
                </Label>
                <input
                  id="cpl"
                  type="number"
                  min={0}
                  step={1}
                  value={form.costPerLead}
                  onChange={(e) => set("costPerLead", Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-lg border border-ao-border bg-ao-dark px-4 py-2.5 text-sm text-ao-text focus:outline-none focus:ring-2 focus:ring-ao-green/40 transition"
                />
              </div>

              {/* Conversion rate */}
              <div>
                <Label htmlFor="cvr" hint="% of visitors that become leads">
                  Conversion Rate (%)
                </Label>
                <input
                  id="cvr"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.conversionRate}
                  onChange={(e) => set("conversionRate", Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-lg border border-ao-border bg-ao-dark px-4 py-2.5 text-sm text-ao-text focus:outline-none focus:ring-2 focus:ring-ao-green/40 transition"
                />
              </div>

              {/* AI shift slider */}
              <div className="md:col-span-2">
                <Label hint="What share of your organic queries now happen on AI platforms?">
                  Traffic Shifting to AI Search: <span className="text-ao-green font-bold">{form.aiShiftPct}%</span>
                </Label>
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={1}
                  value={form.aiShiftPct}
                  onChange={(e) => set("aiShiftPct", parseInt(e.target.value))}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-ao-text-muted mt-1">
                  <span>10% conservative</span>
                  <span>60% aggressive</span>
                </div>
              </div>

              {/* AI mention rate */}
              <div className="md:col-span-2">
                <Label hint="When buyers ask AI about your category, how often does your brand get cited?">
                  AI Mention Rate: <span className="text-ao-green font-bold">{form.aiMentionRate}%</span>
                </Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.aiMentionRate}
                  onChange={(e) => set("aiMentionRate", parseInt(e.target.value))}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-ao-text-muted mt-1">
                  <span>0% invisible</span>
                  <span>100% always cited</span>
                </div>
              </div>
            </div>

            {/* Calculate button */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-ao-green hover:bg-ao-green-hover text-ao-dark font-bold text-base tracking-wide transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
              >
                {isCalculating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Calculate Revenue Loss
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ====================== RESULTS ====================== */}
      {showResults && results && (
        <section ref={resultsRef} className="max-w-5xl mx-auto px-6 mt-14">
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <p className="text-ao-green text-sm font-semibold tracking-wide mb-3">YOUR RESULTS</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ao-text mb-2">
                AI search impact for{" "}
                <span className="text-ao-green">{displayUrl}</span>
              </h2>
              <p className="text-sm text-ao-text-muted">
                {form.industry} &middot; {fmt(form.monthlyOrganicTraffic)} monthly organic visitors &middot; {form.aiMentionRate}% mention rate
              </p>
            </div>

            {/* Top metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="opacity-0 animate-count-up stagger-1">
                <ResultCard
                  label="Queries Shifting to AI"
                  value={fmt(results.estimatedAiQueries)}
                  sub={`${form.aiShiftPct}% of ${fmt(form.monthlyOrganicTraffic)} organic visits`}
                />
              </div>
              <div className="opacity-0 animate-count-up stagger-2">
                <ResultCard
                  label="Monthly Lost Clicks"
                  value={fmt(results.lostClicks)}
                  sub="Clicks going to competitors cited by AI"
                />
              </div>
              <div className="opacity-0 animate-count-up stagger-3">
                <ResultCard
                  label="Monthly Lost Leads"
                  value={fmt(results.lostLeads)}
                  sub={`At ${form.conversionRate}% conversion rate`}
                />
              </div>
            </div>

            {/* CPC loss */}
            <div className="mb-2">
              <p className="text-xs font-semibold text-ao-text-muted uppercase tracking-wider mb-3 ml-1">
                Valued by Cost-Per-Click (${form.avgCpc}/click)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="opacity-0 animate-count-up stagger-4">
                  <ResultCard
                    label="Monthly Loss (CPC)"
                    value={fmtDollarFull(results.monthlyLossCpc)}
                    sub={`${fmt(results.lostClicks)} clicks x $${form.avgCpc}`}
                  />
                </div>
                <div className="opacity-0 animate-count-up stagger-5">
                  <ResultCard
                    label="Annual Loss (CPC)"
                    value={fmtDollar(results.annualLossCpc)}
                    highlight
                    sub="What you'd pay in ads to replace these clicks"
                  />
                </div>
                <div className="opacity-0 animate-count-up stagger-6">
                  <ResultCard
                    label="3-Year Loss (CPC)"
                    value={fmtDollar(results.threeYearLossCpc)}
                    sub="With 15% YoY growth in AI search"
                  />
                </div>
              </div>
            </div>

            {/* CPL loss */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-ao-text-muted uppercase tracking-wider mb-3 ml-1">
                Valued by Cost-Per-Lead (${fmt(form.costPerLead)}/lead)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="opacity-0 animate-count-up stagger-4">
                  <ResultCard
                    label="Monthly Loss (CPL)"
                    value={fmtDollarFull(results.monthlyLossCpl)}
                    sub={`${fmt(results.lostLeads)} leads x $${fmt(form.costPerLead)}`}
                  />
                </div>
                <div className="opacity-0 animate-count-up stagger-5">
                  <ResultCard
                    label="Annual Loss (CPL)"
                    value={fmtDollar(results.annualLossCpl)}
                    highlight
                    sub="Pipeline value lost from missing AI citations"
                  />
                </div>
                <div className="opacity-0 animate-count-up stagger-6">
                  <ResultCard
                    label="3-Year Loss (CPL)"
                    value={fmtDollar(results.threeYearLossCpl)}
                    sub="With 15% YoY growth in AI search"
                  />
                </div>
              </div>
            </div>

            {/* Opportunity */}
            <div className="opacity-0 animate-count-up stagger-7">
              <div className="rounded-2xl border border-ao-green/20 bg-ao-green/5 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-ao-green/15 flex items-center justify-center">
                    <svg className="w-6 h-6 text-ao-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ao-text mb-1">
                      The upside: get cited in AI results
                    </h3>
                    <p className="text-ao-text-secondary text-sm leading-relaxed">
                      Brands that earn the{" "}
                      <span className="text-ao-green font-semibold">#1 cited position</span>{" "}
                      capture up to{" "}
                      <span className="text-ao-text font-bold">{fmt(results.potentialClicksIfVisible)} clicks/month</span>{" "}
                      from AI search. That&apos;s{" "}
                      <span className="text-ao-text font-bold">
                        {fmt(results.potentialClicksIfVisible * (form.conversionRate / 100))} leads
                      </span>{" "}
                      worth{" "}
                      <span className="text-ao-green font-bold">
                        {fmtDollarFull(results.potentialClicksIfVisible * (form.conversionRate / 100) * form.costPerLead)}/month
                      </span>{" "}
                      in pipeline for {displayUrl}.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 text-center opacity-0 animate-count-up stagger-7">
              <div className="rounded-2xl border border-ao-border bg-ao-surface/50 p-10">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-ao-text mb-3">
                  Your content should be working harder
                </h3>
                <p className="text-sm text-ao-text-secondary mb-8 max-w-lg mx-auto leading-relaxed">
                  AirOps helps brands get cited, mentioned, and recommended across ChatGPT, Perplexity, Gemini, and Google AI Overviews. See where you stand and start winning the clicks that matter.
                </p>
                <a
                  href="https://airops.com/book-a-call"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-ao-green hover:bg-ao-green-hover text-ao-dark font-bold text-sm tracking-wide transition-all hover:scale-[1.03] active:scale-[0.98]"
                >
                  Book a Demo with AirOps
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================== HOW IT WORKS (step 1 only) ====================== */}
      {step === 1 && (
        <section className="max-w-4xl mx-auto px-6 mt-24">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ao-text mb-3">
              Three steps. One number that matters.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "1",
                title: "Enter your website",
                desc: "Drop in your URL. We set CPC, CPL, and AI shift benchmarks based on your industry.",
              },
              {
                num: "2",
                title: "Adjust your numbers",
                desc: "Fine-tune organic traffic, cost metrics, and how often AI mentions your brand today.",
              },
              {
                num: "3",
                title: "See the revenue impact",
                desc: "Get a clear breakdown: lost clicks, lost leads, and the dollar value of your AI search gap.",
              },
            ].map((item) => (
              <div
                key={item.num}
                className="rounded-2xl border border-ao-border bg-ao-surface/40 p-6"
              >
                <div className="w-10 h-10 rounded-full bg-ao-green/10 border border-ao-green/20 flex items-center justify-center text-ao-green font-bold text-base mb-5">
                  {item.num}
                </div>
                <h3 className="text-base font-bold text-ao-text mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-ao-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====================== FOOTER ====================== */}
      <footer className="max-w-6xl mx-auto px-6 mt-24 pt-8 border-t border-ao-border">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-ao-text-muted">
          <p>
            Built by{" "}
            <a
              href="https://airops.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ao-green hover:underline font-medium"
            >
              AirOps
            </a>
            . Craft content that wins search.
          </p>
          <p>
            Benchmarks based on aggregated industry CPC/CPL data and AI search citation analysis. Results are estimates.
          </p>
        </div>
      </footer>
    </main>
  );
}
