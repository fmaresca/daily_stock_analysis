/**
 * Automated Test Suite: Ask Strategy Agent & Multi-LLM Execution Layer
 * ====================================================================
 * Verifies:
 * 1. Default Gemini 3.8 Flash model resolution and camelCase functionDeclarations for tools
 * 2. Multi-LLM fallback auto-synthesis from provider environment keys (Groq, Cerebras, OpenRouter, etc.)
 * 3. Preservation of tool_calls on assistant turns in callOpenAICompatible
 * 4. Technical indicators extraction (spotPrice, SMA20/50, RSI14, upperBb, lowerBb, bbWidthPct, bollingerBands)
 * 5. Ticker news dual payload (headlines + articles) and Macro calendar dual payload (events + upcomingEvents)
 * 6. Tool alias handling (get_macro_economic_calendar -> getEconomicCalendarEvents)
 * 7. /api/agent/chat key_status discovery of fallback chains
 * 8. Notice text cleanly citing Google Gemini 3.8 Flash
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getFallbackSlots, completeLLM } from '../functions/api/_llm.js';
import {
  getMarketPriceAndTechnicals,
  getTickerNews,
  getEconomicCalendarEvents,
  executeAgentTool,
} from '../functions/api/agent/_agent_tools.js';

test('1. Multi-LLM Fallback Auto-Synthesis from Provider Keys', () => {
  const customEnv = {
    GROQ_API_KEY: 'gsk_mock_test_key_123',
    OPENROUTER_API_KEY: 'sk-or-v1-mock_test_key_456',
    CEREBRAS_API_KEY: 'csk-mock_test_key_789',
  };

  const slots = getFallbackSlots(customEnv);
  assert.strictEqual(slots.length, 3, 'Must auto-synthesize all 3 configured provider slots');
  assert.strictEqual(slots[0].name, 'groq');
  assert.strictEqual(slots[0].apiKey, 'gsk_mock_test_key_123');
  assert.strictEqual(slots[1].name, 'cerebras');
  assert.strictEqual(slots[2].name, 'openrouter');
});

test('2. Gemini 3.8 Flash Default & Tool Function Declarations CamelCase Contract', async () => {
  const origFetch = globalThis.fetch;
  let capturedBody = null;
  let capturedUrl = '';

  globalThis.fetch = async (url, options) => {
    capturedUrl = String(url);
    capturedBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: 'Gemini 3.8 Flash reasoning verified.' }]
        }
      }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const res = await completeLLM({
      env: { GEMINI_API_KEY: 'mock_gemini_key' },
      messages: [{ role: 'user', content: 'Analyze NVDA' }],
      tools: [{
        type: 'function',
        function: {
          name: 'get_market_price_and_technicals',
          description: 'Fetch technicals',
          parameters: { type: 'object', properties: { symbol: { type: 'string' } } }
        }
      }],
    });

    assert.ok(capturedUrl.includes('gemini-3.8-flash'), 'Default Gemini model must be gemini-3.8-flash');
    assert.ok(capturedBody.tools, 'Tools payload must be present');
    assert.ok(Array.isArray(capturedBody.tools[0].functionDeclarations), 'Tools MUST be serialized as camelCase functionDeclarations for Gemini REST v1beta');
    assert.strictEqual(capturedBody.tools[0].functionDeclarations[0].name, 'get_market_price_and_technicals');
    assert.strictEqual(res.text, 'Gemini 3.8 Flash reasoning verified.');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('3. Assistant Tool Calls Preservation in OpenAI-Compatible Calls', async () => {
  const origFetch = globalThis.fetch;
  let capturedPayload = null;

  globalThis.fetch = async (url, options) => {
    capturedPayload = JSON.parse(options.body);
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'Follow-up analysis after tool call' } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const res = await completeLLM({
      env: {
        LLM_PROVIDER: 'openai',
        LLM_API_KEY: 'mock_key',
        LLM_BASE_URL: 'https://api.groq.com/openai/v1',
      },
      messages: [
        { role: 'user', content: 'Price check on NVDA' },
        {
          role: 'assistant',
          content: '',
          tool_calls: [{
            id: 'call_123',
            type: 'function',
            function: { name: 'get_market_price_and_technicals', arguments: '{"symbol":"NVDA"}' }
          }]
        },
        {
          role: 'tool',
          tool_call_id: 'call_123',
          name: 'get_market_price_and_technicals',
          content: '{"spotPrice":225.50}'
        }
      ]
    });

    assert.strictEqual(res.text, 'Follow-up analysis after tool call');
    assert.ok(capturedPayload, 'Payload must be passed');
    const assistantMsg = capturedPayload.messages.find(m => m.role === 'assistant');
    assert.ok(assistantMsg, 'Assistant message must exist');
    assert.ok(Array.isArray(assistantMsg.tool_calls), 'tool_calls array must be preserved on assistant message for multi-turn validation');
    assert.strictEqual(assistantMsg.tool_calls[0].id, 'call_123');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('4. Technical Indicators Tool Schema Completeness', async () => {
  const origFetch = globalThis.fetch;

  // Mock Yahoo query response
  globalThis.fetch = async () => {
    const mockCloses = [
      100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
      110, 111, 112, 113, 114, 115, 116, 117, 118, 120,
    ];
    return new Response(JSON.stringify({
      chart: {
        result: [{
          meta: { regularMarketPrice: 120, chartPreviousClose: 118 },
          indicators: { quote: [{ close: mockCloses }] },
        }]
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const tech = await getMarketPriceAndTechnicals('NVDA', {});
    assert.strictEqual(tech.symbol, 'NVDA');
    assert.strictEqual(tech.spotPrice, 120);
    assert.ok(typeof tech.sma20 === 'number', 'sma20 must be number');
    assert.ok(typeof tech.rsi14 === 'number', 'rsi14 must be number');
    assert.ok(typeof tech.upperBb === 'number', 'upperBb top-level must be number');
    assert.ok(typeof tech.lowerBb === 'number', 'lowerBb top-level must be number');
    assert.ok(typeof tech.bbWidthPct === 'number', 'bbWidthPct top-level must be number');
    assert.ok(tech.bollingerBands && typeof tech.bollingerBands.upper === 'number', 'nested bollingerBands.upper must be number');
    assert.ok(tech.bollingerBands && typeof tech.bollingerBands.lower === 'number', 'nested bollingerBands.lower must be number');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('5. Ticker News Dual Schema (Headlines & Articles) Contract', async () => {
  const origFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    const mockRss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title><![CDATA[NVIDIA Unveils Next-Gen AI Compute Clusters]]></title>
          <source>Reuters</source>
          <pubDate>Mon, 12 Oct 2026 10:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`;
    return new Response(mockRss, { status: 200, headers: { 'Content-Type': 'application/xml' } });
  };

  try {
    const news = await getTickerNews('NVDA', {});
    assert.strictEqual(news.symbol, 'NVDA');
    assert.strictEqual(news.newsCount, 1);
    assert.ok(Array.isArray(news.headlines), 'headlines array must exist');
    assert.ok(Array.isArray(news.articles), 'articles array must exist');
    assert.strictEqual(news.headlines[0].headline, 'NVIDIA Unveils Next-Gen AI Compute Clusters');
    assert.strictEqual(news.articles[0].title, 'NVIDIA Unveils Next-Gen AI Compute Clusters');
    assert.strictEqual(news.articles[0].source, 'Reuters');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('6. Macro Economic Calendar Dual Schema (Events & UpcomingEvents) & Tool Alias Contract', async () => {
  const macro = await executeAgentTool('get_macro_economic_calendar', {}, {});
  assert.ok(!macro.error, 'get_macro_economic_calendar alias must succeed without error');
  assert.ok(Array.isArray(macro.events), 'events array must exist');
  assert.ok(Array.isArray(macro.upcomingEvents), 'upcomingEvents array must exist');
  assert.ok(macro.upcomingEvents.length > 0);
  assert.ok(macro.upcomingEvents[0].name || macro.upcomingEvents[0].event);
});

test('7. /api/agent/chat key_status Detects Fallback Providers', async () => {
  const { createSessionToken } = await import('../functions/api/_auth_utils.js');
  const chatModule = await import('../functions/api/agent/chat.js');
  const testSecret = 'test_session_secret_for_contract_suite_123456789_32chars!';
  const token = await createSessionToken({ sub: '1', id: '1', email: 'tester@example.com', role: 'user', tv: 0 }, testSecret);

  const req = new Request('http://localhost/api/agent/chat?action=key_status', {
    method: 'GET',
    headers: {
      'Cookie': `deltaharvest_session=${token}`,
    },
  });

  const mockDb = {
    prepare: () => ({
      bind: () => ({
        first: async () => ({ id: '1', email: 'tester@example.com', role: 'user', is_active: 1, token_version: 0 }),
        run: async () => ({ success: true }),
      }),
      first: async () => ({ id: '1', email: 'tester@example.com', role: 'user', is_active: 1, token_version: 0 }),
      run: async () => ({ success: true }),
    }),
  };

  const envWithFallback = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: testSecret,
    DB: mockDb,
    GROQ_API_KEY: 'gsk_mock_key',
  };

  const res = await chatModule.onRequest({ request: req, env: envWithFallback });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.configured, true, 'Fallback provider must satisfy configured: true');
  assert.strictEqual(data.provider, 'groq');
  assert.strictEqual(data.fallbackCount, 1);
});

test('8. extractTickerFromMessage Accurately Detects AXTI Over Conversational English "GOING"', async () => {
  const { extractTickerFromMessage } = await import('../functions/api/agent/chat.js');

  const userQuery = 'What is going on with AXTI today and is it a good option writing candidate and at what strike price for the week?';
  const detectedTicker = extractTickerFromMessage(userQuery, 'SPY');
  assert.strictEqual(detectedTicker, 'AXTI', 'Must extract "AXTI" and NEVER mistake "GOING" for a ticker');

  assert.strictEqual(extractTickerFromMessage('What is going on with TSLA?', 'SPY'), 'TSLA');
  assert.strictEqual(extractTickerFromMessage('Tell me about $NVDA', 'SPY'), 'NVDA');
  assert.strictEqual(extractTickerFromMessage('Can I sell cash-secured puts on symbol AXTI?', 'SPY'), 'AXTI');
  assert.strictEqual(extractTickerFromMessage('What is going on with the market today?', 'SPY'), 'SPY');
});

test('9. generateQuantitativeAnalysisReport for AXTI Directly Answers Options Writing Query', async () => {
  const { generateQuantitativeAnalysisReport } = await import('../functions/api/agent/chat.js');

  const mockTechData = {
    symbol: 'AXTI',
    spotPrice: 64.10,
    prevClose: 64.18,
    changePct: -0.12,
    sma20: 74.85,
    sma50: 71.68,
    rsi14: 41.4,
    upperBb: 89.94,
    lowerBb: 59.76,
    bbWidthPct: 40.3,
    bollingerBands: { upper: 89.94, middle: 74.85, lower: 59.76 }
  };

  const mockNewsData = {
    symbol: 'AXTI',
    articles: [{ title: 'AXTI Reports Strong Semiconductor Demand', source: 'Reuters', pubDate: new Date().toISOString() }]
  };

  const report = generateQuantitativeAnalysisReport({
    ticker: 'AXTI',
    lens: 'Risk/Defensive',
    userQuery: 'What is going on with AXTI today and is it a good option writing candidate and at what strike price for the week?',
    techData: mockTechData,
    newsData: mockNewsData,
    macroData: { upcomingEvents: [{ name: 'CPI', date: '2026-10-14', impact: 'High' }] },
  });

  assert.ok(report.includes('### 📊 AXTI Institutional Strategy Briefing'), 'Must headline with AXTI');
  assert.ok(report.includes('$64.1'), 'Must include real spot price $64.1');
  assert.ok(!report.includes('Spot Price: **$N/A**'), 'Must NOT have $N/A spot price');
  assert.ok(report.includes('74.85'), 'Must cite 20-day SMA');
  assert.ok(report.includes('41.4'), 'Must cite 14-Day RSI');
  assert.ok(report.includes('Option Writing Candidate Assessment'), 'Must directly address user inquiry');
  assert.ok(report.includes('Google Gemini 3.8 Flash'), 'Notice must cite Google Gemini 3.8 Flash');
});

test('10. enrichEnvFromSystemSettings Loads D1 System Settings into Env', async () => {
  const { enrichEnvFromSystemSettings } = await import('../functions/api/agent/chat.js');

  const mockDb = {
    prepare: (query) => ({
      all: async () => ({
        results: [
          { key: 'gemini_api_key', value: 'mock_d1_gemini_key' },
          { key: 'groq_api_key', value: 'mock_d1_groq_key' },
        ]
      })
    })
  };

  const enriched = await enrichEnvFromSystemSettings({ DB: mockDb });
  assert.strictEqual(enriched.GEMINI_API_KEY, 'mock_d1_gemini_key');
  assert.strictEqual(enriched.GROQ_API_KEY, 'mock_d1_groq_key');
});

