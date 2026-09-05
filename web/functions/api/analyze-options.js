/**
 * Cloudflare Pages Function: POST /api/analyze-options
 * Serverless Edge handler for automated weekly options quantitative screening.
 * Leverages Google Gemini models with Extended Thinking (thinking_config: { thinking_level: "HIGH" }).
 * Protects user API keys and runs at edge with zero overage risk on Cloudflare Pages.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // Retrieve Google Gemini API Key from Cloudflare Pages environment variables
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Missing GEMINI_API_KEY environment variable in Cloudflare Pages. Please set GEMINI_API_KEY in Settings > Environment Variables, or use the 'Copy Prompt for Gemini Pro Plan' bridge to analyze in gemini.google.com at zero cost."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      screenerData,
      strategy = "BOTH",
      minAroc = 15,
      modelOverride
    } = body;

    if (!screenerData || typeof screenerData !== "string" || screenerData.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Screener data payload is empty. Please provide CSV, tab-delimited, or text screener data." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default to gemini-2.5-flash or gemini-3.8-flash based on environment / user override
    const targetModel = modelOverride || env.GEMINI_MODEL || "gemini-2.5-flash";

    // Format the institutional quantitative prompt enforcing strict income discipline & extended thinking
    const promptTemplate = `You are an institutional derivatives portfolio manager and quantitative options analyst specializing in conservative weekly income generation through Cash-Secured Puts (CSPs) and Covered Calls (CCs).

### OBJECTIVE
Analyze the provided weekly stock screener data and generate an institutional shortlist of optimal weekly option candidates to write for immediate income, prioritizing capital preservation, probability of expiring out-of-the-money (PoP > 75%), and favorable risk-adjusted yield.

### THINKING & REASONING MANDATE
Activate deep quantitative thinking. Systematically evaluate cross-sectional volatility, moving average cushions (20-day and 50-day SMA), swing support/resistance levels, earnings announcement calendar risk, and annualized return on capital (AROC).

### SCREENING RULES & CONSTRAINTS
1. EXPIRATION: Focus strictly on the nearest weekly expiration (5 to 10 Days to Expiration [DTE]).
2. EARNINGS RISK: STRICT BLACKOUT. If an earnings announcement occurs prior to or during the expiration cycle, immediately reject the candidate or flag it with a score of 0.
3. CASH-SECURED PUTS (CSPs):
   - Delta Range: -0.15 to -0.30 (approx. 70-85% out-of-the-money probability).
   - Technical Anchor: Strike must be set AT or BELOW verified technical support (e.g., 20-day or 50-day SMA, recent swing low).
   - Downside Cushion: Minimum 3.5% to 6.0% buffer between current underlying stock price and strike.
   - IV Regime: Prefer elevated IV Rank (> 35th percentile) where option premium is rich relative to historical volatility, excluding binary events.
4. COVERED CALLS (CCs):
   - Delta Range: +0.15 to +0.30.
   - Technical Anchor: Strike must be set AT or ABOVE overhead resistance (e.g., upper Bollinger Band, 50-day SMA, or major swing high).
5. LIQUIDITY & SPREAD:
   - Minimum Open Interest: > 100 contracts on the selected strike.
   - Bid/Ask Spread: Bid/Ask spread must not exceed 10% of the bid price (favor penny/nickel tick spreads).
6. ANNUALIZED RETURN FORMULA:
   - Annualized Return on Capital (AROC) = ((Premium / Strike Price) * (365 / DTE)) * 100.
   - Target Minimum AROC: >= ${minAroc}% for puts; >= 12.0% for calls (excluding capital gain to strike).

### INPUT DATA
User Strategy Preference: ${strategy}
Target Minimum Annualized Yield: ${minAroc}%
Screener Payload:
${screenerData}

### REQUIRED JSON OUTPUT STRUCTURE
Return ONLY a valid, raw JSON object (no surrounding Markdown wrappers, no \`\`\`json prefixes) adhering to this schema:
{
  "market_regime_context": "Brief 2-sentence macro/volatility backdrop assessment",
  "candidates": [
    {
      "ticker": "AAPL",
      "strategy": "CSP",
      "current_price": 224.50,
      "recommended_strike": 217.50,
      "expiration_date": "YYYY-MM-DD",
      "dte": 7,
      "delta": -0.21,
      "bid_ask": "1.15 / 1.18",
      "expected_premium": 1.15,
      "downside_cushion_pct": 3.12,
      "annualized_yield_pct": 27.55,
      "iv_rank": 42.0,
      "technical_anchor": "Strike sits 1.2% below the 20-day SMA ($220.10) and above horizontal swing low support.",
      "earnings_date": "None during cycle",
      "selection_tier": "PRIMARY",
      "risk_factors": "Potential tech sector beta drawdown if NDX breaks 50 SMA."
    }
  ],
  "rejected_candidates": [
    {
      "ticker": "XYZ",
      "reason": "Earnings announcement within 3 days; excessive binary gap risk."
    }
  ]
}`;

    // Direct edge fetch to Google Generative Language REST API
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: promptTemplate }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        // Mandatory Extended Thinking level configuration
        thinking_config: {
          thinking_level: "HIGH"
        },
        response_mime_type: "application/json"
      }
    };

    const apiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      // Handle rate limit specifically
      if (apiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Google AI Studio rate limit reached (HTTP 429). You are protected with zero billing! Please wait a moment, or use the 'Copy Prompt for Gemini Pro Plan' button to run unlimited analyses inside gemini.google.com with your paid consumer subscription."
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Gemini API error (${apiResponse.status}): ${errorText}` }),
        { status: apiResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await apiResponse.json();

    // Extract model response text
    const candidatePart = data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
    const rawText = candidatePart?.text || "{}";

    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch {
      // Fallback clean-up if model returns escaped markdown tags
      const sanitized = rawText.replace(/```json\n?|```/g, "").trim();
      parsedResult = JSON.parse(sanitized);
    }

    return new Response(JSON.stringify(parsedResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
