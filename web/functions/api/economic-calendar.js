/**
 * Cloudflare Pages Function: GET /api/economic-calendar
 * Ingests free weekly macro schedule, normalizes to US Eastern Time (ET),
 * deterministically maps sector impacts and impacted securities, and caches at edge.
 */

const SECTOR_IMPACT_MAP = {
  CPI: {
    sectors: "Technology, Real Estate, Financials, Utilities",
    tickers: "QQQ, VNQ, XLF, TLT",
    impact: "High"
  },
  PCE: {
    sectors: "Broad Market, Tech, Long Duration Assets",
    tickers: "SPY, QQQ, TLT",
    impact: "High"
  },
  FOMC: {
    sectors: "Banking, Tech, Real Estate, Precious Metals",
    tickers: "KRE, XLF, QQQ, GLD",
    impact: "High"
  },
  "FED": {
    sectors: "Banking, Broad Market, Bonds",
    tickers: "SPY, QQQ, TLT, XLF",
    impact: "High"
  },
  "NON-FARM": {
    sectors: "Consumer Discretionary, Industrials, Small Caps",
    tickers: "XLY, XLI, IWM",
    impact: "High"
  },
  PAYROLLS: {
    sectors: "Consumer Discretionary, Industrials, Financials",
    tickers: "XLY, XLI, XLF",
    impact: "High"
  },
  "RETAIL SALES": {
    sectors: "Consumer Discretionary, Retail, Transports",
    tickers: "XLY, XRT, IYT",
    impact: "High"
  },
  "UNEMPLOYMENT": {
    sectors: "Broad Equities, Discretionary",
    tickers: "SPY, XLY, IWM",
    impact: "High"
  },
  PMI: {
    sectors: "Industrials, Basic Materials, Cyclicals",
    tickers: "XLI, XLB",
    impact: "Moderate"
  },
  "ISM": {
    sectors: "Industrials, Materials, Tech Supply",
    tickers: "XLI, XLB, SOXX",
    impact: "Moderate"
  },
  "CRUDE OIL": {
    sectors: "Energy, Transportation, Airlines",
    tickers: "XLE, JETS, IYT",
    impact: "Moderate"
  },
  "JOBLESS CLAIMS": {
    sectors: "Broad Equities, High-Beta Assets",
    tickers: "SPY, IWM",
    impact: "Moderate"
  },
  HOUSING: {
    sectors: "Homebuilders, Building Products, Real Estate",
    tickers: "ITB, XHB, VNQ, HD",
    impact: "Low"
  },
  GDP: {
    sectors: "Broad Market, Cyclicals, Small Caps",
    tickers: "SPY, DIA, IWM",
    impact: "High"
  },
  "TREASURY": {
    sectors: "Bonds, Financials, High Dividend",
    tickers: "TLT, IEF, XLF",
    impact: "Moderate"
  }
};

const FALLBACK_INDICATORS = [
  {
    title: "ISM Services PMI",
    country: "USD",
    dateET: "Mon, Sep 7",
    timeET: "10:00 AM",
    impact: "Moderate",
    forecast: "52.0",
    previous: "51.4",
    sectors: "Industrials, Basic Materials, Tech Supply",
    tickers: "XLI, XLB, SOXX",
    isoDate: new Date().toISOString()
  },
  {
    title: "Initial Jobless Claims",
    country: "USD",
    dateET: "Thu, Sep 10",
    timeET: "08:30 AM",
    impact: "Moderate",
    forecast: "228K",
    previous: "227K",
    sectors: "Broad Equities, High-Beta Assets",
    tickers: "SPY, IWM",
    isoDate: new Date().toISOString()
  },
  {
    title: "CPI m/m & Core CPI y/y",
    country: "USD",
    dateET: "Wed, Sep 16",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "0.2% / 3.2%",
    previous: "0.2% / 3.2%",
    sectors: "Technology, Real Estate, Financials, Utilities",
    tickers: "QQQ, VNQ, XLF, TLT",
    isoDate: new Date().toISOString()
  },
  {
    title: "FOMC Rate Decision & Press Conference",
    country: "USD",
    dateET: "Wed, Sep 16",
    timeET: "02:00 PM",
    impact: "High",
    forecast: "4.75% - 5.00%",
    previous: "5.25% - 5.50%",
    sectors: "Banking, Tech, Real Estate, Precious Metals",
    tickers: "KRE, XLF, QQQ, GLD",
    isoDate: new Date().toISOString()
  },
  {
    title: "Retail Sales m/m",
    country: "USD",
    dateET: "Fri, Sep 18",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "0.3%",
    previous: "0.1%",
    sectors: "Consumer Discretionary, Retail, Transports",
    tickers: "XLY, XRT, IYT",
    isoDate: new Date().toISOString()
  }
];

export async function onRequestGet() {
  try {
    // 100% Free, zero-auth weekly calendar endpoint
    const response = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      headers: {
        "User-Agent": "DailyStockAnalysis/1.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        indicators: FALLBACK_INDICATORS,
        source: "fallback_baseline",
        fallback: true,
        notice: "Remote macro feed temporarily unavailable. Displaying baseline schedule.",
        last_updated: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const events = await response.json();
    if (!Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({
        indicators: FALLBACK_INDICATORS,
        source: "fallback_baseline",
        fallback: true,
        notice: "No events returned from upstream. Displaying baseline schedule.",
        last_updated: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Filter strictly for USD events
    const usdEvents = events
      .filter((e) => e.country === "USD")
      .map((event) => {
        const titleUpper = (event.title || "").toUpperCase();
        let affectedSectors = "Broad Equities";
        let affectedTickers = "SPY";
        let rawImpact = event.impact || "Low";
        let mappedImpact = rawImpact === "High" ? "High" : (rawImpact === "Medium" ? "Moderate" : "Low");

        // Map sector correlations
        for (const [key, mapping] of Object.entries(SECTOR_IMPACT_MAP)) {
          if (titleUpper.includes(key)) {
            affectedSectors = mapping.sectors;
            affectedTickers = mapping.tickers;
            if (mapping.impact === "High") mappedImpact = "High";
            else if (mapping.impact === "Moderate" && mappedImpact !== "High") mappedImpact = "Moderate";
            break;
          }
        }

        // Convert ISO date to Eastern Time
        let dateET = event.date || "";
        let timeET = "";
        let isoDate = event.date || "";

        try {
          const eventDate = new Date(event.date);
          if (!isNaN(eventDate.getTime())) {
            isoDate = eventDate.toISOString();
            dateET = eventDate.toLocaleDateString("en-US", {
              timeZone: "America/New_York",
              weekday: "short",
              month: "short",
              day: "numeric"
            });
            timeET = eventDate.toLocaleTimeString("en-US", {
              timeZone: "America/New_York",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            });
          }
        } catch {
          // Keep raw string if parsing fails
        }

        return {
          title: event.title || "Economic Release",
          country: "USD",
          dateET,
          timeET,
          impact: mappedImpact,
          forecast: event.forecast && event.forecast.trim() !== "" ? event.forecast : "--",
          previous: event.previous && event.previous.trim() !== "" ? event.previous : "--",
          sectors: affectedSectors,
          tickers: affectedTickers,
          isoDate
        };
      });

    return new Response(JSON.stringify({
      indicators: usdEvents,
      source: "faireconomy_media",
      fallback: false,
      last_updated: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800" // Cache 30 mins on Cloudflare Edge
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      indicators: FALLBACK_INDICATORS,
      source: "fallback_baseline",
      fallback: true,
      notice: `Upstream error (${err.message || 'unknown'}). Displaying baseline schedule.`,
      last_updated: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}
