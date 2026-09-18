var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "5mb" }));
var aiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/gis/overpass", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    const mirrors = [
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.private.coffee/api/interpreter",
      "https://overpass-api.de/api/interpreter"
    ];
    for (const mirror of mirrors) {
      try {
        const response = await fetch(mirror, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "PropIndexPropertyGuardian/1.0 (https://propindex.ai; contact: aravindvijayan193@gmail.com)"
          },
          body: "data=" + encodeURIComponent(query),
          signal: AbortSignal.timeout(9e3)
        });
        if (response.ok) {
          const json = await response.json();
          return res.json(json);
        }
      } catch (err) {
        console.warn(`Overpass mirror ${mirror} failed:`, err?.message || err);
      }
    }
    return res.status(502).json({ error: "Overpass query timed out across all available mirrors" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to query Overpass" });
  }
});
app.post("/api/gemini/analyze-property", async (req, res) => {
  try {
    const { location, lat, lon, purpose, waterSource, knownIssues, rawMetrics, notes, preset } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: "Gemini client offline; delegating to calibrated local geotechnical engine"
      });
    }
    const prompt = `You are INDEX, the Senior Forensic Geotechnical Engineer and Environmental Property Due Diligence Auditor at PropIndex.
CRITICAL DIRECTIVE: You are an independent risk assessor hired by the prospective buyer to protect their life savings. Real estate due diligence MUST NEVER be optimistic, flattering, or generic. Most plots in developing corridors have substantial hidden liabilities: groundwater depletion, seasonal waterlogging, uncompacted fill, poor soil bearing capacity, narrow road widths (<5m), high-tension wire easement buffers, or municipal master-plan zoning traps.
Deliver an unvarnished, forensic, and scientifically grounded appraisal for:
- Location: ${location} (${lat}, ${lon})
- Intended Purpose: ${purpose}
- Reported Water Source: ${waterSource}
- Known Environmental Issues: ${Array.isArray(knownIssues) ? knownIssues.join(", ") : "None reported"}
- Additional Client Notes: ${notes || "None"}
- Preliminary Calculated Metrics: ${JSON.stringify(rawMetrics || {})}

Analyze the exact micro-geography:
1. Geology & Foundation: Exact regional soil strata (e.g. lateritic gravel, black cotton expansive clay, coastal sabkha/marine silt, alluvial flood loam, granite-gneiss), estimated Safe Bearing Capacity (SBC in kN/m\xB2), and realistic foundation requirements (e.g., DMC piles, stepped strip footing, under-reamed piles).
2. Environmental & Climate Liabilities: Micro-basin flood overflow, summer water-table drawdown rate, extreme precipitation runoff, landslide/slope instability, or industrial particulate plumes.
3. Statutory & Zoning Red Flags: Master plan reservations, CRZ coastal distance, Data Bank / wetland conversion legality (e.g. Kerala Conservation of Paddy Land and Wetland Act 2008 / Karnataka Land Reforms Act / NBC setbacks), right-of-way roads, and 30-year non-encumbrance needs.
4. Honest Score Modifier: Integer between -18 and +4 based on real site liabilities. If there are known water shortages, flood risks, steep slopes, or tanker dependencies, this MUST be negative (e.g. -6 to -15). Only truly pristine, fully de-risked sites with municipal infrastructure and zero hazards receive 0 to +4.

Return strictly JSON matching this structure:
{
  "summary": "Realistic 2-3 sentence forensic appraisal. State clearly if the site carries significant liabilities or cautions.",
  "geologicalContext": "Detailed geological formation, specific subsoil profile, Safe Bearing Capacity (SBC in kN/m\xB2), and foundation civil engineering recommendation.",
  "environmentalRisks": [
    "Specific local micro-environmental hazard 1 with technical details",
    "Specific local hazard 2"
  ],
  "regulatoryGuidance": [
    "Specific statutory requirement 1 (exact regional act, zoning designation, or buffer restriction)",
    "Specific statutory check 2"
  ],
  "resilienceRecommendation": "Essential engineering intervention required to mitigate identified site risks",
  "scoreModifier": -6
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const responseText = response.text || "{}";
    try {
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch {
      return res.json({
        summary: responseText.slice(0, 300),
        geologicalContext: "Standard regional soil profile.",
        environmentalRisks: ["Monitor seasonal drainage."],
        regulatoryGuidance: ["Verify local zoning bylaws."],
        resilienceRecommendation: "Implement rainwater harvesting and groundwater recharge pits."
      });
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI property analysis" });
  }
});
app.post("/api/gemini/atlas-chat", async (req, res) => {
  try {
    const { question, history, activeSection } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        reply: `**Atlas Intelligence Notice**: Running in offline mode.

Regarding **"${question}"**:

\u2022 **Forensic Due Diligence**: PropIndex evaluates physical and legal ground realities before capital deployment. In high-risk flood zones (<3m MSL) or uncompacted filled soils, standard construction without engineered pile foundations or retaining walls leads to catastrophic structural settling.
\u2022 **LEED + WELL Synergy**: Our integrated assessment couples LEED (environmental preservation, micro-drainage, zero-runoff swales) with WELL (indoor air quality, non-toxic groundwater, acoustic calm) to ensure the land protects both planetary ecology and human health.
\u2022 **Actionable Advice**: For verified site-specific investigation, run a **QuickScan** or contact our accredited geotechnical engineering team (+91 73560 60616 / +971 56 361 2718).`
      });
    }
    const systemInstruction = `You are ATLAS (Unit 01), the Senior Forensic Due Diligence AI Guardian and Lead Geotechnical & Environmental Auditor at PropIndex.
You are addressing a prospective land/property buyer or investor who needs rigorous, scientifically accurate, and legally grounded intelligence.

CORE SPECIALTIES:
1. Forensic Ground Realities: You reject marketing puffery. You explain soil bearing capacity (SBC in kN/m\xB2), NASA SRTM slope gradients, GloFAS multi-decade flood return periods, high-tension wire clearances, and statutory land titles.
2. Proprietary USP - LEED + WELL Integration: You passionately and rigorously explain how PropIndex saves nature and human life by synthesizing LEED (planetary ecology, wetland preservation, carbon offset, stormwater sponge design) and WELL (human health, ambient PM2.5, non-toxic water, biophilic acoustics) BEFORE any land purchase or architectural design.
3. Actuarial Deductions & Caps: You explain why PropIndex enforces hard caps and score deductions (e.g. -34 pts for flood traps, -25 pts for tanker water dependency) rather than giving fake 95/100 ratings like sales brokers do.
4. Comprehensive & Thorough: Never give brief 1-sentence dismissals. Provide deep, authoritative, beautifully structured responses with bold headings, bullet points, technical civil engineering specifics, and concrete action steps.
The user is currently browsing the "${activeSection || "general"}" section of the PropIndex platform.`;
    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        contents.push(`${msg.sender === "user" ? "User" : "Atlas"}: ${msg.text}`);
      }
    }
    contents.push(`User: ${question}

Atlas:`);
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${systemInstruction}

CONVERSATION:
${contents.join("\n")}`
    });
    const reply = response.text || "I am analyzing this geospatial query. Please run a QuickScan for exact coordinates.";
    return res.json({ reply, fallback: false });
  } catch (error) {
    console.error("Atlas chat error:", error);
    return res.status(500).json({
      error: error.message || "Failed to process question",
      fallback: true,
      reply: "Atlas experienced a temporary connection interruption with the neural synthesis core. Please review the preloaded due diligence knowledge base or try again."
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PropIndex server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
