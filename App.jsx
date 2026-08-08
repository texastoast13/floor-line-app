import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutGrid, FileText, Boxes, Truck, Wrench, Users, FileStack,
  ShieldCheck, ClipboardCheck, Send, Plus, Trash2, Loader2,
  CheckCircle2, TrendingUp, MessageSquare, Radio
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

/* ============================== THEME ============================== */
const T = {
  bg: "#12161B",
  panel: "#1A2027",
  panelAlt: "#20272F",
  border: "#2B333D",
  borderLight: "#3A4450",
  text: "#E7EAEE",
  muted: "#8B95A3",
  faint: "#5B6572",
  amber: "#F0A93A",
  amberDim: "#3A2F18",
  green: "#4FBF7A",
  greenDim: "#1C3327",
  red: "#E2584F",
  redDim: "#3A1F1D",
  blue: "#4C8DD9",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  sans: "'Inter', system-ui, sans-serif",
  display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
};

function useFonts() {
  useEffect(() => {
    const id = "mfg-platform-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ======================== PERSISTENT STORAGE ======================== */
const STORE_KEY = "mfg-platform-state-v1";

function defaultState() {
  return {
    quotes: [],
    inventory: [
      { id: "SKU-1042", name: "6061 Aluminum Bar Stock 1in", stock: 340, avgMonthly: 210, leadDays: 12, history: [260, 240, 300, 190, 220, 210] },
      { id: "SKU-2210", name: "M8 Stainless Hex Bolts (box/500)", stock: 48, avgMonthly: 60, leadDays: 6, history: [55, 62, 58, 70, 64, 60] },
      { id: "SKU-3390", name: "Hydraulic Seal Kit - Press 40T", stock: 9, avgMonthly: 14, leadDays: 21, history: [12, 15, 11, 16, 13, 14] },
      { id: "SKU-4471", name: "CNC Carbide End Mill 1/4in", stock: 130, avgMonthly: 95, leadDays: 9, history: [80, 90, 100, 88, 92, 95] },
    ],
    suppliers: [
      { id: 1, name: "Meridian Metal Supply", item: "6061 Aluminum Bar Stock", price: 4.2, leadDays: 12, quality: 92, reliability: 96 },
      { id: 2, name: "Northgate Fasteners", item: "M8 Stainless Hex Bolts", price: 0.14, leadDays: 6, quality: 88, reliability: 90 },
      { id: 3, name: "Coastal Fastener Co.", item: "M8 Stainless Hex Bolts", price: 0.11, leadDays: 10, quality: 81, reliability: 78 },
      { id: 4, name: "Pinnacle Hydraulics", item: "Hydraulic Seal Kits", price: 61.0, leadDays: 21, quality: 95, reliability: 93 },
      { id: 5, name: "Summit Industrial Parts", item: "Hydraulic Seal Kits", price: 54.5, leadDays: 28, quality: 84, reliability: 71 },
    ],
    equipment: [
      { id: "EQ-01", name: "CNC Mill #3", hours: 4180, interval: 500, lastService: 3900 },
      { id: "EQ-02", name: "Hydraulic Press 40T", hours: 2210, interval: 300, lastService: 2050 },
      { id: "EQ-03", name: "Robotic Welder Cell A", hours: 6890, interval: 750, lastService: 6200 },
      { id: "EQ-04", name: "Air Compressor Bank 2", hours: 9020, interval: 1000, lastService: 8100 },
    ],
    leads: [
      { id: 1, company: "Delta Fabworks", contact: "R. Ianello", stage: "Quote sent", lastContact: "2026-07-28", notes: "Waiting on their engineering sign-off for the bracket order." },
      { id: 2, company: "Harlow Aerospace", contact: "M. Chen", stage: "Negotiating", lastContact: "2026-07-30", notes: "Wants 8% off for a 3-year volume commitment." },
      { id: 3, company: "Ferris Line Equipment", contact: "S. Doyle", stage: "Follow-up due", lastContact: "2026-07-20", notes: "Went quiet after sample parts shipped." },
    ],
    qcLogs: [
      { id: 1, date: "2026-07-29", line: "Line 2 - Stamping", defect: "Burr on edge", qty: 14, severity: "minor" },
      { id: 2, date: "2026-07-30", line: "Line 1 - Machining", defect: "Bore out of tolerance", qty: 3, severity: "major" },
      { id: 3, date: "2026-08-01", line: "Line 2 - Stamping", defect: "Surface scratch", qty: 22, severity: "minor" },
      { id: 4, date: "2026-08-03", line: "Line 3 - Assembly", defect: "Missing fastener", qty: 2, severity: "critical" },
    ],
    docs: [],
    safetyChat: [
      { role: "assistant", content: "I'm the safety assistant, trained on your plant's safety manuals. Ask me about lockout-tagout, PPE requirements, or any procedure on the floor." },
    ],
  };
}

function useAppState() {
  const [state, setState] = useState(defaultState());
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORE_KEY, false);
        if (res && res.value) setState({ ...defaultState(), ...JSON.parse(res.value) });
      } catch (e) {
        /* nothing saved yet */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        window.storage.set(STORE_KEY, JSON.stringify(next), false).catch(() => {});
      }, 400);
      return next;
    });
  }, []);

  return [state, update, loaded];
}

/* ============================ AI HELPER ============================ */
async function askClaude(prompt, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: system || undefined,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (data.content) {
    return data.content.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
  }
  throw new Error(data.error?.message || "AI request failed");
}

/* ============================ SMALL UI KIT ============================ */
function Panel({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function Led({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
        marginRight: 8,
        flexShrink: 0,
      }}
    />
  );
}

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontFamily: T.mono,
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: T.faint,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ id, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        {id && (
          <span style={{ fontFamily: T.mono, color: T.amber, fontSize: 13 }}>{id}</span>
        )}
        <h1 style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.text, margin: 0 }}>
          {title}
        </h1>
      </div>
      {subtitle && (
        <p style={{ color: T.muted, fontSize: 13.5, marginTop: 6, maxWidth: 640, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, style, type = "button" }) {
  const base = {
    fontFamily: T.sans,
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: 5,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid transparent",
    opacity: disabled ? 0.55 : 1,
    transition: "filter 0.15s ease",
  };
  const variants = {
    primary: { background: T.amber, color: "#1A1300" },
    ghost: { background: "transparent", color: T.text, border: `1px solid ${T.borderLight}` },
    danger: { background: "transparent", color: T.red, border: `1px solid ${T.redDim}` },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <label style={{ display: "block" }}>
      {label && (
        <span style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontFamily: T.sans }}>
          {label}
        </span>
      )}
      <input
        {...props}
        style={{
          width: "100%",
          background: T.panelAlt,
          border: `1px solid ${T.border}`,
          borderRadius: 5,
          padding: "8px 10px",
          color: T.text,
          fontFamily: T.sans,
          fontSize: 13.5,
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.amber)}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label style={{ display: "block" }}>
      {label && (
        <span style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontFamily: T.sans }}>
          {label}
        </span>
      )}
      <textarea
        {...props}
        style={{
          width: "100%",
          background: T.panelAlt,
          border: `1px solid ${T.border}`,
          borderRadius: 5,
          padding: "8px 10px",
          color: T.text,
          fontFamily: T.sans,
          fontSize: 13.5,
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.amber)}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
    </label>
  );
}

/* ============================ MODULE NAV ============================ */
const MODULES = [
  { key: "dashboard", label: "Overview", icon: LayoutGrid, id: "00" },
  { key: "quoting", label: "AI Quoting", icon: FileText, id: "01" },
  { key: "inventory", label: "Inventory Forecast", icon: Boxes, id: "02" },
  { key: "suppliers", label: "Supplier Compare", icon: Truck, id: "03" },
  { key: "maintenance", label: "Maintenance", icon: Wrench, id: "04" },
  { key: "sales", label: "Sales Follow-up", icon: Users, id: "05" },
  { key: "docs", label: "Documentation", icon: FileStack, id: "06" },
  { key: "safety", label: "Safety Assistant", icon: ShieldCheck, id: "07" },
  { key: "quality", label: "Quality Control", icon: ClipboardCheck, id: "08" },
];

/* ============================ DASHBOARD ============================ */
function daysUntilReorder(item) {
  const dailyUsage = item.avgMonthly / 30;
  const daysOfStockLeft = item.stock / dailyUsage;
  return Math.round(daysOfStockLeft - item.leadDays);
}

function Dashboard({ state, go }) {
  const lowStock = state.inventory.filter((i) => daysUntilReorder(i) <= 7);
  const dueService = state.equipment.filter(
    (e) => e.hours - e.lastService >= e.interval * 0.85
  );
  const followUps = state.leads.filter((l) => l.stage === "Follow-up due");
  const criticalQC = state.qcLogs.filter((q) => q.severity === "critical" || q.severity === "major");

  const cards = [
    {
      key: "quoting", title: "Quotes drafted", value: state.quotes.length, note: "this session",
      icon: FileText, tone: T.blue,
    },
    {
      key: "inventory", title: "Parts near reorder point", value: lowStock.length, note: `of ${state.inventory.length} tracked SKUs`,
      icon: Boxes, tone: lowStock.length ? T.amber : T.green,
    },
    {
      key: "maintenance", title: "Equipment due for service", value: dueService.length, note: `of ${state.equipment.length} assets`,
      icon: Wrench, tone: dueService.length ? T.red : T.green,
    },
    {
      key: "sales", title: "Follow-ups due", value: followUps.length, note: `of ${state.leads.length} open deals`,
      icon: Users, tone: followUps.length ? T.amber : T.green,
    },
    {
      key: "quality", title: "Major/critical defects", value: criticalQC.length, note: "logged this week",
      icon: ClipboardCheck, tone: criticalQC.length ? T.red : T.green,
    },
  ];

  return (
    <div>
      <SectionTitle
        id="00"
        title="Plant overview"
        subtitle="A live status board pulling from every module below. Numbers update as you work in each one — nothing here is separately maintained."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
        {cards.map((c) => (
          <Panel
            key={c.key}
            onClick={() => go(c.key)}
            style={{ padding: 18, cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Eyebrow>{c.title}</Eyebrow>
              <c.icon size={16} color={c.tone} />
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 32, color: T.text, lineHeight: 1 }}>
              {c.value}
            </div>
            <div style={{ fontSize: 12, color: T.faint, marginTop: 6 }}>{c.note}</div>
          </Panel>
        ))}
      </div>

      <Panel style={{ padding: 20 }}>
        <Eyebrow>Attention queue</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {lowStock.map((i) => (
            <AttnRow key={i.id} tone={T.amber} onClick={() => go("inventory")}
              text={`${i.name} — reorder point in ${daysUntilReorder(i)} days`} />
          ))}
          {dueService.map((e) => (
            <AttnRow key={e.id} tone={T.red} onClick={() => go("maintenance")}
              text={`${e.name} — ${e.hours - e.lastService} hrs since last service (interval ${e.interval})`} />
          ))}
          {followUps.map((l) => (
            <AttnRow key={l.id} tone={T.amber} onClick={() => go("sales")}
              text={`${l.company} — no contact since ${l.lastContact}`} />
          ))}
          {criticalQC.map((q) => (
            <AttnRow key={q.id} tone={T.red} onClick={() => go("quality")}
              text={`${q.line} — ${q.defect} (${q.severity}, qty ${q.qty})`} />
          ))}
          {lowStock.length + dueService.length + followUps.length + criticalQC.length === 0 && (
            <div style={{ color: T.muted, fontSize: 13 }}>Nothing needs attention right now.</div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function AttnRow({ tone, text, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", padding: "9px 12px",
        background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 5,
        cursor: "pointer", fontSize: 13, color: T.text,
      }}
    >
      <Led color={tone} />
      {text}
    </div>
  );
}

/* ============================ AI QUOTING ============================ */
function QuotingModule({ state, update }) {
  const [form, setForm] = useState({
    customer: "", part: "", material: "", qty: 100,
    machineHours: 2, laborRate: 65, materialCostPerUnit: 3.2, marginPct: 28, notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function generateQuote() {
    setLoading(true);
    setError("");
    try {
      const materialTotal = Number(form.materialCostPerUnit) * Number(form.qty);
      const laborTotal = Number(form.machineHours) * Number(form.laborRate);
      const baseCost = materialTotal + laborTotal;
      const sellPrice = baseCost / (1 - Number(form.marginPct) / 100);

      const prompt = `Draft a professional manufacturing quote for a customer, formatted in clean prose (not markdown headers). Use these figures exactly, do not invent different numbers:

Customer: ${form.customer || "Customer"}
Part: ${form.part || "Custom part"}
Material: ${form.material || "Not specified"}
Quantity: ${form.qty} units
Estimated machine time: ${form.machineHours} hours per unit
Labor rate: $${form.laborRate}/hr
Material cost: $${form.materialCostPerUnit}/unit
Total estimated cost: $${baseCost.toFixed(2)}
Target margin: ${form.marginPct}%
Quoted unit price: $${(sellPrice / form.qty).toFixed(2)}
Total quoted price: $${sellPrice.toFixed(2)}
Additional context from sales rep: ${form.notes || "none"}

Write it as a short, confident quote a shop owner would send: 1) one-line summary of the job, 2) pricing breakdown, 3) lead time placeholder for the rep to fill in, 4) a brief professional closing line. Keep it under 180 words.`;

      const text = await askClaude(
        prompt,
        "You are an experienced manufacturing estimator drafting customer-facing quotes for a small precision machine shop. Be precise with numbers, concise, and professional."
      );

      const quote = {
        id: Date.now(),
        customer: form.customer || "Customer",
        part: form.part || "Custom part",
        qty: form.qty,
        total: sellPrice.toFixed(2),
        text,
        date: new Date().toISOString().slice(0, 10),
      };
      update((s) => ({ ...s, quotes: [quote, ...s.quotes] }));
    } catch (e) {
      setError("Couldn't reach the AI drafting service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionTitle
        id="01"
        title="AI quoting assistant"
        subtitle="Enter job parameters, get a costed draft in your voice. The math is computed directly — the model only drafts the customer-facing language around your real numbers."
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Panel style={{ padding: 20 }}>
          <Eyebrow>Job parameters</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Input label="Customer" value={form.customer} onChange={set("customer")} placeholder="Delta Fabworks" />
            <Input label="Part / job name" value={form.part} onChange={set("part")} placeholder="Mounting bracket, rev C" />
            <Input label="Material" value={form.material} onChange={set("material")} placeholder="6061 Aluminum" />
            <Input label="Quantity" type="number" value={form.qty} onChange={set("qty")} />
            <Input label="Machine hrs / unit" type="number" step="0.1" value={form.machineHours} onChange={set("machineHours")} />
            <Input label="Labor rate ($/hr)" type="number" value={form.laborRate} onChange={set("laborRate")} />
            <Input label="Material cost ($/unit)" type="number" step="0.01" value={form.materialCostPerUnit} onChange={set("materialCostPerUnit")} />
            <Input label="Target margin (%)" type="number" value={form.marginPct} onChange={set("marginPct")} />
          </div>
          <div style={{ marginTop: 12 }}>
            <TextArea label="Notes for the AI (tone, rush job, special terms...)" rows={2}
              value={form.notes} onChange={set("notes")} placeholder="Customer wants fast turnaround, mention we can expedite." />
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn onClick={generateQuote} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              {loading ? "Drafting..." : "Generate quote"}
            </Btn>
            {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 8 }}>{error}</div>}
          </div>
        </Panel>

        <Panel style={{ padding: 20, maxHeight: 560, overflowY: "auto" }}>
          <Eyebrow>Quote history</Eyebrow>
          {state.quotes.length === 0 && (
            <div style={{ color: T.muted, fontSize: 13, marginTop: 12 }}>
              No quotes yet. Fill in the job parameters and generate your first one.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {state.quotes.map((q) => (
              <div key={q.id} style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.faint, marginBottom: 6 }}>
                  <span style={{ fontFamily: T.mono }}>{q.date} · {q.customer}</span>
                  <span style={{ fontFamily: T.mono, color: T.amber }}>${q.total}</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: T.text, lineHeight: 1.55 }}>
                  {q.text}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================ INVENTORY FORECAST ============================ */
function linearForecast(history, monthsAhead) {
  // simple linear regression over the trailing history, projected forward
  const n = history.length;
  const xs = history.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = history.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (history[i] - meanY), 0);
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0) || 1;
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  const out = [];
  for (let i = 0; i < monthsAhead; i++) {
    const x = n + i;
    out.push(Math.max(0, Math.round(intercept + slope * x)));
  }
  return out;
}

function InventoryModule({ state }) {
  const [selected, setSelected] = useState(state.inventory[0]?.id);
  const item = state.inventory.find((i) => i.id === selected) || state.inventory[0];
  const forecast = linearForecast(item.history, 3);
  const chartData = [
    ...item.history.map((v, i) => ({ label: `M-${item.history.length - i}`, actual: v })),
    ...forecast.map((v, i) => ({ label: `M+${i + 1}`, forecast: v })),
  ];
  // bridge the line
  if (chartData.length) {
    chartData[item.history.length - 1].forecast = chartData[item.history.length - 1].actual;
  }
  const reorderDays = daysUntilReorder(item);

  return (
    <div>
      <SectionTitle
        id="02"
        title="Inventory forecasting"
        subtitle="Trailing usage projected forward with a linear trend, checked against lead time to flag reorder points. Swap in your ERP's usage history and this recalculates automatically."
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {state.inventory.map((i) => (
          <button
            key={i.id}
            onClick={() => setSelected(i.id)}
            style={{
              fontFamily: T.mono, fontSize: 12, padding: "7px 12px", borderRadius: 5, cursor: "pointer",
              background: i.id === selected ? T.amberDim : "transparent",
              color: i.id === selected ? T.amber : T.muted,
              border: `1px solid ${i.id === selected ? T.amber : T.border}`,
            }}
          >
            {i.id}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <Panel style={{ padding: 20 }}>
          <Eyebrow>{item.name} — 6 mo. history + 3 mo. forecast</Eyebrow>
          <div style={{ height: 260, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={T.faint} fontSize={11} />
                <YAxis stroke={T.faint} fontSize={11} />
                <Tooltip contentStyle={{ background: T.panelAlt, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Line type="monotone" dataKey="actual" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="forecast" stroke={T.amber} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel style={{ padding: 20 }}>
          <Eyebrow>Reorder status</Eyebrow>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <StatRow label="Current stock" value={`${item.stock} units`} />
            <StatRow label="Avg. monthly usage" value={`${item.avgMonthly} units`} />
            <StatRow label="Supplier lead time" value={`${item.leadDays} days`} />
            <StatRow
              label="Days until reorder point"
              value={`${reorderDays} days`}
              tone={reorderDays <= 7 ? T.red : reorderDays <= 21 ? T.amber : T.green}
            />
          </div>
          <div style={{ marginTop: 16, padding: 12, background: T.panelAlt, borderRadius: 5, border: `1px solid ${T.border}`, fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
            {reorderDays <= 7
              ? `Stock will run out before a new order could arrive. Place a purchase order now.`
              : reorderDays <= 21
              ? `Getting close — plan to order within the next ${Math.max(reorderDays - item.leadDays, 0)} days to avoid a gap.`
              : `Comfortable buffer. No action needed this cycle.`}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatRow({ label, value, tone }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12.5, color: T.muted }}>{label}</span>
      <span style={{ fontFamily: T.mono, fontSize: 14, color: tone || T.text }}>{value}</span>
    </div>
  );
}

/* ============================ SUPPLIER COMPARISON ============================ */
function supplierScore(s) {
  // lower price & lead time are better; higher quality & reliability are better
  // normalize price/lead within reasonable bands for a 0-100 composite score
  const priceScore = Math.max(0, 100 - s.price * 2);
  const leadScore = Math.max(0, 100 - s.leadDays * 2.5);
  return Math.round(priceScore * 0.25 + leadScore * 0.2 + s.quality * 0.3 + s.reliability * 0.25);
}

function SuppliersModule({ state }) {
  const groups = {};
  state.suppliers.forEach((s) => {
    groups[s.item] = groups[s.item] || [];
    groups[s.item].push(s);
  });

  return (
    <div>
      <SectionTitle
        id="03"
        title="Supplier comparison"
        subtitle="Composite score weighs price (25%), lead time (20%), quality history (30%), and delivery reliability (25%). Recommended supplier per item is highlighted."
      />
      {Object.entries(groups).map(([itemName, list]) => {
        const sorted = [...list].sort((a, b) => supplierScore(b) - supplierScore(a));
        return (
          <Panel key={itemName} style={{ padding: 20, marginBottom: 16 }}>
            <Eyebrow>{itemName}</Eyebrow>
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: T.faint, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={thStyle}>Supplier</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Lead time</th>
                    <th style={thStyle}>Quality</th>
                    <th style={thStyle}>Reliability</th>
                    <th style={thStyle}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s, idx) => (
                    <tr key={s.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ ...tdStyle, display: "flex", alignItems: "center", gap: 8, border: "none" }}>
                        {idx === 0 && <Led color={T.green} />}
                        {s.name}
                      </td>
                      <td style={tdStyle}>${s.price.toFixed(2)}</td>
                      <td style={tdStyle}>{s.leadDays}d</td>
                      <td style={tdStyle}>{s.quality}/100</td>
                      <td style={tdStyle}>{s.reliability}/100</td>
                      <td style={{ ...tdStyle, fontFamily: T.mono, color: idx === 0 ? T.green : T.text }}>
                        {supplierScore(s)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

const thStyle = { textAlign: "left", padding: "6px 10px", fontWeight: 500 };
const tdStyle = { padding: "10px 10px", color: T.text, fontFamily: T.sans };

/* ============================ MAINTENANCE ============================ */
function MaintenanceModule({ state, update }) {
  function logService(id) {
    update((s) => ({
      ...s,
      equipment: s.equipment.map((e) => (e.id === id ? { ...e, lastService: e.hours } : e)),
    }));
  }

  const rows = state.equipment.map((e) => {
    const sinceService = e.hours - e.lastService;
    const pctToNext = Math.min(100, Math.round((sinceService / e.interval) * 100));
    const status = pctToNext >= 100 ? "overdue" : pctToNext >= 85 ? "due-soon" : "ok";
    const statusTone = { overdue: T.red, "due-soon": T.amber, ok: T.green }[status];
    const statusLabel = { overdue: "Overdue", "due-soon": "Due soon", ok: "On schedule" }[status];
    return { ...e, sinceService, pctToNext, status, statusTone, statusLabel };
  });

  return (
    <div>
      <SectionTitle
        id="04"
        title="Preventive maintenance scheduling"
        subtitle="Runs off equipment usage hours against each asset's service interval. Feed it from a hour-meter or PLC feed and the schedule stays current on its own."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((e) => (
          <Panel key={e.id} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Led color={e.statusTone} />
                  <span style={{ fontFamily: T.display, fontSize: 15.5, fontWeight: 600 }}>{e.name}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.faint, marginLeft: 10 }}>{e.id}</span>
                </div>
                <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>
                  {e.sinceService} hrs since last service · interval {e.interval} hrs · <span style={{ color: e.statusTone }}>{e.statusLabel}</span>
                </div>
              </div>
              <Btn variant="ghost" onClick={() => logService(e.id)}>
                <CheckCircle2 size={14} /> Log service now
              </Btn>
            </div>
            <div style={{ marginTop: 12, height: 6, background: T.panelAlt, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${e.pctToNext}%`, height: "100%", background: e.statusTone }} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ============================ SALES FOLLOW-UP ============================ */
function SalesModule({ state, update }) {
  const [drafting, setDrafting] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");

  async function draftFollowUp(lead) {
    setDrafting(lead.id);
    setError("");
    try {
      const prompt = `Write a short, warm but direct follow-up email to a B2B manufacturing customer.

Company: ${lead.company}
Contact: ${lead.contact}
Deal stage: ${lead.stage}
Last contact: ${lead.lastContact}
Context notes: ${lead.notes}

Write only the email body (no subject line), under 120 words, professional but not stiff, ending with one clear, low-pressure next step.`;
      const text = await askClaude(
        prompt,
        "You are a manufacturing sales rep who writes concise, genuine follow-up emails, never pushy."
      );
      setDrafts((d) => ({ ...d, [lead.id]: text }));
    } catch (e) {
      setError("Couldn't reach the AI drafting service. Try again in a moment.");
    } finally {
      setDrafting(null);
    }
  }

  function markContacted(id) {
    update((s) => ({
      ...s,
      leads: s.leads.map((l) =>
        l.id === id ? { ...l, lastContact: new Date().toISOString().slice(0, 10), stage: "Quote sent" } : l
      ),
    }));
  }

  return (
    <div>
      <SectionTitle
        id="05"
        title="Sales follow-up assistant"
        subtitle="Drafts follow-up emails from your CRM notes. Nothing sends automatically — you review, edit, and send it yourself."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {state.leads.map((lead) => (
          <Panel key={lead.id} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15.5 }}>{lead.company}</div>
                <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>
                  {lead.contact} · {lead.stage} · last contact {lead.lastContact}
                </div>
                <div style={{ fontSize: 12.5, color: T.faint, marginTop: 4, maxWidth: 480 }}>{lead.notes}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Btn variant="ghost" onClick={() => draftFollowUp(lead)} disabled={drafting === lead.id}>
                  {drafting === lead.id ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                  Draft follow-up
                </Btn>
              </div>
            </div>
            {drafts[lead.id] && (
              <div style={{ marginTop: 14, padding: 14, background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 5 }}>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.55, color: T.text }}>
                  {drafts[lead.id]}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Btn onClick={() => markContacted(lead.id)}>
                    <Send size={13} /> Mark as sent
                  </Btn>
                </div>
              </div>
            )}
          </Panel>
        ))}
        {error && <div style={{ color: T.red, fontSize: 12.5 }}>{error}</div>}
      </div>
    </div>
  );
}

/* ============================ DOCUMENTATION AUTOMATION ============================ */
const DOC_TEMPLATES = [
  { key: "sop", label: "Standard Operating Procedure" },
  { key: "spec", label: "Part Specification Sheet" },
  { key: "ncr", label: "Non-Conformance Report" },
  { key: "coa", label: "Certificate of Analysis" },
];

function DocsModule({ state, update }) {
  const [templateKey, setTemplateKey] = useState("sop");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const templateLabel = DOC_TEMPLATES.find((t) => t.key === templateKey).label;
      const prompt = `Draft a ${templateLabel} for a manufacturing shop.

Subject: ${subject || "Untitled"}
Details / inputs from the requester: ${details || "none provided — use reasonable shop-floor defaults and mark placeholders clearly with [BRACKETS]"}

Format it as a real, usable document with clear section headers appropriate to a ${templateLabel}, written in plain professional language. Keep it complete but concise.`;
      const text = await askClaude(
        prompt,
        "You are a manufacturing quality/documentation specialist who drafts clean, compliant shop documents from brief inputs."
      );
      const doc = { id: Date.now(), title: `${templateLabel}: ${subject || "Untitled"}`, content: text, date: new Date().toISOString().slice(0, 10) };
      update((s) => ({ ...s, docs: [doc, ...s.docs] }));
      setSubject("");
      setDetails("");
    } catch (e) {
      setError("Couldn't reach the AI drafting service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionTitle
        id="06"
        title="Documentation automation"
        subtitle="Generates first drafts of shop documents from a short description. Always route the output through your QA sign-off before it's official."
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Panel style={{ padding: 20 }}>
          <Eyebrow>New document</Eyebrow>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 14 }}>
            {DOC_TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTemplateKey(t.key)}
                style={{
                  fontSize: 12.5, padding: "7px 12px", borderRadius: 5, cursor: "pointer",
                  background: templateKey === t.key ? T.amberDim : "transparent",
                  color: templateKey === t.key ? T.amber : T.muted,
                  border: `1px solid ${templateKey === t.key ? T.amber : T.border}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Subject / part / job" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Bracket rev C machining process" />
            <TextArea label="Details" rows={5} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Steps, tolerances, materials, or context to include..." />
          </div>
          <div style={{ marginTop: 14 }}>
            <Btn onClick={generate} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FileStack size={14} />}
              {loading ? "Drafting..." : "Generate document"}
            </Btn>
            {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 8 }}>{error}</div>}
          </div>
        </Panel>

        <Panel style={{ padding: 20, maxHeight: 560, overflowY: "auto" }}>
          <Eyebrow>Document library</Eyebrow>
          {state.docs.length === 0 && (
            <div style={{ color: T.muted, fontSize: 13, marginTop: 12 }}>No documents generated yet.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {state.docs.map((d) => (
              <div key={d.id} style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.faint, marginBottom: 6 }}>{d.date}</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{d.title}</div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>{d.content}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ============================ SAFETY TRAINING ASSISTANT ============================ */
const SAFETY_MANUAL_CONTEXT = `
Reference safety context for this shop (treat as the authoritative source):
- Lockout-Tagout (LOTO): Any servicing of CNC mills, presses, or welder cells requires energy isolation, a personal lock and tag, and a zero-energy verification before hands go near the point of operation. Only trained, authorized employees may apply or remove locks.
- PPE by area: Machining floor requires safety glasses and steel-toe boots at all times; hearing protection required near the stamping line and air compressors; face shields required for grinding operations; welding requires auto-darkening helmet, flame-resistant sleeves, and gloves.
- Forklift operation: Only certified operators, annual recertification required, 3 mph speed limit in walkways, horn required at every blind corner.
- Chemical handling: SDS binder located at each department station; any new chemical must be logged before first use; spill kits located at the north and south walls of the machining floor.
- Incident reporting: Any injury, near-miss, or equipment malfunction must be reported to the shift supervisor within the same shift and logged in the incident system within 24 hours.
`;

function SafetyModule({ state, update }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.safetyChat]);

  async function send() {
    if (!input.trim()) return;
    const question = input.trim();
    setInput("");
    const nextChat = [...state.safetyChat, { role: "user", content: question }];
    update((s) => ({ ...s, safetyChat: nextChat }));
    setLoading(true);
    setError("");
    try {
      const history = nextChat
        .slice(-8)
        .map((m) => `${m.role === "user" ? "Worker" : "Assistant"}: ${m.content}`)
        .join("\n");
      const prompt = `${SAFETY_MANUAL_CONTEXT}\n\nConversation so far:\n${history}\n\nRespond to the worker's latest message. Answer only from the reference context above — if it's not covered there, say clearly that it isn't in the current manual and recommend asking a supervisor. Keep the answer practical and under 100 words.`;
      const text = await askClaude(
        prompt,
        "You are a plant safety training assistant. You only answer from the shop's own safety manual context provided to you. You never guess at safety procedures beyond what's given."
      );
      update((s) => ({ ...s, safetyChat: [...s.safetyChat, { role: "assistant", content: text }] }));
    } catch (e) {
      setError("Couldn't reach the AI service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionTitle
        id="07"
        title="Safety training assistant"
        subtitle="Answers only from your plant's own safety manuals (loaded as reference context below) — it won't improvise procedures it wasn't given."
      />
      <Panel style={{ padding: 0, display: "flex", flexDirection: "column", height: 500 }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {state.safetyChat.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "78%",
                background: m.role === "user" ? T.amberDim : T.panelAlt,
                border: `1px solid ${m.role === "user" ? T.amber : T.border}`,
                borderRadius: 6,
                padding: "9px 13px",
                fontSize: 13.5,
                lineHeight: 1.5,
                color: T.text,
              }}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", color: T.faint, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
              <Loader2 size={13} className="animate-spin" /> Checking the manual...
            </div>
          )}
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, padding: 14, display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about a procedure, PPE requirement, or protocol..."
            style={{
              flex: 1, background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 5,
              padding: "9px 12px", color: T.text, fontFamily: T.sans, fontSize: 13.5, outline: "none",
            }}
          />
          <Btn onClick={send} disabled={loading}>
            <Send size={14} /> Ask
          </Btn>
        </div>
      </Panel>
      {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 8 }}>{error}</div>}
    </div>
  );
}

/* ============================ QUALITY CONTROL REPORTING ============================ */
function QualityModule({ state, update }) {
  const [form, setForm] = useState({ line: "", defect: "", qty: 1, severity: "minor" });
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addLog(e) {
    e.preventDefault();
    if (!form.line || !form.defect) return;
    const log = { id: Date.now(), date: new Date().toISOString().slice(0, 10), ...form, qty: Number(form.qty) };
    update((s) => ({ ...s, qcLogs: [log, ...s.qcLogs] }));
    setForm({ line: "", defect: "", qty: 1, severity: "minor" });
  }

  function removeLog(id) {
    update((s) => ({ ...s, qcLogs: s.qcLogs.filter((l) => l.id !== id) }));
  }

  async function generateSummary() {
    setLoading(true);
    setError("");
    setSummary("");
    try {
      const logLines = state.qcLogs
        .map((l) => `${l.date} | ${l.line} | ${l.defect} | qty ${l.qty} | ${l.severity}`)
        .join("\n");
      const prompt = `Here is this period's quality control defect log:\n${logLines}\n\nWrite a short management summary (under 130 words): call out the most frequent defect type, which line has the most issues, and one concrete recommendation. Plain, direct, no headers.`;
      const text = await askClaude(
        prompt,
        "You are a quality manager at a manufacturing plant writing a concise weekly QC summary for leadership."
      );
      setSummary(text);
    } catch (e) {
      setError("Couldn't reach the AI service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const byLine = {};
  state.qcLogs.forEach((l) => { byLine[l.line] = (byLine[l.line] || 0) + l.qty; });
  const chartData = Object.entries(byLine).map(([line, qty]) => ({ line, qty }));
  const sevTone = { minor: T.blue, major: T.amber, critical: T.red };

  return (
    <div>
      <SectionTitle
        id="08"
        title="Quality control reporting"
        subtitle="Log defects as they're found on the floor; get a running chart plus an AI-written summary for leadership when you need one."
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
        <Panel style={{ padding: 20 }}>
          <Eyebrow>Log a defect</Eyebrow>
          <form onSubmit={addLog} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <Input label="Line / station" value={form.line} onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))} placeholder="Line 2 - Stamping" />
            <Input label="Defect description" value={form.defect} onChange={(e) => setForm((f) => ({ ...f, defect: e.target.value }))} placeholder="Burr on edge" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Quantity" type="number" min="1" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} />
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>Severity</span>
                <select
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                  style={{ width: "100%", background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 5, padding: "8px 10px", color: T.text, fontSize: 13.5 }}
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            </div>
            <Btn type="submit" style={{ alignSelf: "flex-start" }}><Plus size={14} /> Add to log</Btn>
          </form>
        </Panel>

        <Panel style={{ padding: 20 }}>
          <Eyebrow>Defects by line</Eyebrow>
          <div style={{ height: 200, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="line" stroke={T.faint} fontSize={10.5} />
                <YAxis stroke={T.faint} fontSize={11} />
                <Tooltip contentStyle={{ background: T.panelAlt, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Bar dataKey="qty" fill={T.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Btn onClick={generateSummary} disabled={loading} style={{ marginTop: 10 }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            {loading ? "Summarizing..." : "Generate management summary"}
          </Btn>
          {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 8 }}>{error}</div>}
          {summary && (
            <div style={{ marginTop: 12, padding: 12, background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 13, lineHeight: 1.55 }}>
              {summary}
            </div>
          )}
        </Panel>
      </div>

      <Panel style={{ padding: 20 }}>
        <Eyebrow>Defect log</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {state.qcLogs.map((l) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 5 }}>
              <div style={{ display: "flex", alignItems: "center", fontSize: 13 }}>
                <Led color={sevTone[l.severity]} />
                <span style={{ fontFamily: T.mono, color: T.faint, marginRight: 10 }}>{l.date}</span>
                <span style={{ marginRight: 10 }}>{l.line}</span>
                <span style={{ color: T.muted }}>{l.defect} · qty {l.qty}</span>
              </div>
              <button onClick={() => removeLog(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.faint }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ============================ APP SHELL ============================ */
export default function App() {
  useFonts();
  const [state, update, loaded] = useAppState();
  const [tab, setTab] = useState("dashboard");

  const moduleProps = { state, update };
  const screens = {
    dashboard: <Dashboard state={state} go={setTab} />,
    quoting: <QuotingModule {...moduleProps} />,
    inventory: <InventoryModule {...moduleProps} />,
    suppliers: <SuppliersModule {...moduleProps} />,
    maintenance: <MaintenanceModule {...moduleProps} />,
    sales: <SalesModule {...moduleProps} />,
    docs: <DocsModule {...moduleProps} />,
    safety: <SafetyModule {...moduleProps} />,
    quality: <QualityModule {...moduleProps} />,
  };

  if (!loaded) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 color={T.amber} className="animate-spin" size={22} />
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans, color: T.text, display: "flex" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        table { font-variant-numeric: tabular-nums; }
        ::selection { background: ${T.amberDim}; }
        @media (prefers-reduced-motion: reduce) {
          .animate-spin { animation: none; }
        }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 232, borderRight: `1px solid ${T.border}`, padding: "22px 14px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 22px 8px" }}>
          <Radio size={16} color={T.amber} />
          <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 14.5, letterSpacing: "0.01em" }}>
            FLOORLINE
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {MODULES.map((m) => {
            const active = tab === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setTab(m.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 5,
                  background: active ? T.panelAlt : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  color: active ? T.text : T.muted,
                }}
              >
                <span style={{ fontFamily: T.mono, fontSize: 10.5, color: active ? T.amber : T.faint, width: 16 }}>{m.id}</span>
                <m.icon size={15} color={active ? T.amber : T.muted} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{m.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", padding: "12px 8px 0 8px", fontSize: 11, color: T.faint, fontFamily: T.mono, borderTop: `1px solid ${T.border}` }}>
          v0.1 · prototype build
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "28px 36px", maxWidth: 1180, overflowX: "hidden" }}>
        {screens[tab]}
      </div>
    </div>
  );
}
