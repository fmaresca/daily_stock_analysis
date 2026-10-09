/**
 * Cloudflare Pages Functions: Server-side Multi-LLM Provider Abstraction
 * 
 * Supports:
 * - Google Gemini (default, zero-breaking change with GEMINI_API_KEY)
 * - Numbered multi-provider failover chain (LLM_FALLBACK_1..9 with comma-separated multi-key rotation)
 * - OpenAI-compatible endpoints (Groq, Cerebras, OpenRouter, Mistral, NVIDIA NIM, Cohere, DeepSeek, etc.)
 * - Cloudflare Workers AI (CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN)
 * - Anthropic Claude (ANTHROPIC_API_KEY + ANTHROPIC_MODEL)
 * 
 * Iron Rules:
 * 1. Zero key leakage in chat, code, logs, test fixtures, or responses.
 * 2. Fail over on 401 / 429 / 5xx / network timeout — NEVER on 400 (surface 400s immediately).
 * 3. Default path unchanged: with no fallback env vars set, behavior is byte-identical to today.
 * 4. Per-attempt timeout so hanging providers do not stall the chain; log provider name + latency only.
 */

/**
 * Sanitizes any potential API key or token substrings from text/errors.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeKeyLeakage(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/\b(gsk_|csk-|sk-or-v1-|sk-or-|nvapi-|sk-)[A-Za-z0-9_\-\.]{8,}\b/gi, "[REDACTED_KEY]")
    .replace(/[a-f0-9]{32,}/gi, (m) => m.length >= 32 ? "[REDACTED_HEX]" : m);
}

/**
 * Resolves the primary active LLM provider name without exposing key material.
 * @param {Record<string, any>} env
 * @returns {string} Provider name ('gemini', 'openai', 'anthropic', etc.)
 */
export function getActiveProviderName(env = {}) {
  if (env?.LLM_PROVIDER && typeof env.LLM_PROVIDER === "string" && env.LLM_PROVIDER.trim()) {
    return env.LLM_PROVIDER.trim().toLowerCase();
  }
  if (
    env?.GEMINI_API_KEY ||
    env?.GEMINI_API_KEYS ||
    env?.GOOGLE_API_KEY ||
    env?.GOOGLE_GEMINI_API_KEY ||
    env?.GEMINI_TOKEN
  ) {
    return "gemini";
  }
  if (env?.LLM_API_KEY || env?.OPENAI_API_KEY) {
    return "openai";
  }
  if (env?.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  return "gemini";
}

/**
 * Resolves Gemini API key across env vars, comma-separated lists, and D1 system_settings.
 * @param {Record<string, any>} env
 * @returns {Promise<string>}
 */
export async function resolveGeminiApiKey(env = {}) {
  let key = (
    env?.GEMINI_API_KEY ||
    env?.GEMINI_API_KEYS ||
    env?.GOOGLE_API_KEY ||
    env?.GOOGLE_GEMINI_API_KEY ||
    env?.GEMINI_TOKEN ||
    ""
  );
  if (typeof key === "string" && key.includes(",")) {
    key = key.split(",")[0].trim();
  }
  if (!key && env?.DB && typeof env.DB.prepare === "function") {
    try {
      const row = await env.DB.prepare(
        "SELECT value FROM system_settings WHERE key IN ('gemini_api_key', 'GEMINI_API_KEY', 'google_api_key', 'llm_api_key') ORDER BY updated_at DESC LIMIT 1"
      ).first();
      if (row?.value && typeof row.value === "string" && row.value.trim()) {
        key = row.value.trim().split(",")[0].trim();
      }
    } catch {
      // non-blocking
    }
  }
  return (key || "").trim();
}

/**
 * Selects an API key from a potentially comma-separated multi-key string for intra-slot rotation.
 * @param {string} rawKey
 * @returns {string}
 */
export function resolveSlotApiKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string") return "";
  const parts = rawKey.split(",").map(k => k.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  // Uniform rotation across available keys
  const idx = Math.floor(Math.random() * parts.length);
  return parts[idx];
}

/**
 * Default slot conventions for the 7-provider failover chain.
 * Overridable via LLM_FALLBACK_<n>_PROVIDER, LLM_FALLBACK_<n>_BASE_URL, LLM_FALLBACK_<n>_MODEL.
 */
export const DEFAULT_SLOT_CONFIGS = {
  1: {
    provider: "openai-compatible",
    name: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  2: {
    provider: "openai-compatible",
    name: "cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    model: "llama-3.3-70b",
  },
  3: {
    provider: "openai-compatible",
    name: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openrouter/free",
  },
  4: {
    provider: "openai-compatible",
    name: "mistral",
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-small-latest",
  },
  5: {
    provider: "openai-compatible",
    name: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "meta/llama-3.3-70b-instruct",
  },
  6: {
    provider: "cloudflare-workers-ai",
    name: "cloudflare-workers-ai",
    baseUrl: "",
    model: "@cf/meta/llama-3.1-8b-instruct",
  },
  7: {
    provider: "openai-compatible",
    name: "cohere",
    baseUrl: "https://api.cohere.ai/compatibility/v1",
    model: "command-r-plus",
  },
};

/**
 * Parses numbered fallback slots (LLM_FALLBACK_1..9) stopping at the first missing slot.
 * @param {Record<string, any>} env
 * @returns {Array<{slot: number, providerType: string, name: string, baseUrl: string, apiKey: string, model: string}>}
 */
export function getFallbackSlots(env = {}) {
  const slots = [];
  for (let n = 1; n <= 9; n++) {
    const def = DEFAULT_SLOT_CONFIGS[n] || {};

    const providerRaw = (env[`LLM_FALLBACK_${n}_PROVIDER`] || def.provider || "").trim();
    const apiKeyRaw = (env[`LLM_FALLBACK_${n}_API_KEY`] || "").trim();
    const baseUrlRaw = (env[`LLM_FALLBACK_${n}_BASE_URL`] || def.baseUrl || "").trim();
    const modelRaw = (env[`LLM_FALLBACK_${n}_MODEL`] || def.model || "").trim();

    // Check if slot n exists in env (key provided or explicit provider/base_url env var set)
    const isConfiguredInEnv = Boolean(
      apiKeyRaw ||
      env[`LLM_FALLBACK_${n}_PROVIDER`] ||
      env[`LLM_FALLBACK_${n}_BASE_URL`] ||
      env[`LLM_FALLBACK_${n}_MODEL`] ||
      (def.provider === "cloudflare-workers-ai" && env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN)
    );

    if (!isConfiguredInEnv) {
      break; // Stop parsing at first gap
    }

    const providerLower = providerRaw.toLowerCase();
    let providerType = "openai-compatible";
    if (providerLower === "cloudflare-workers-ai" || providerLower === "cf-workers-ai") {
      providerType = "cloudflare-workers-ai";
    } else if (providerLower === "anthropic") {
      providerType = "anthropic";
    } else if (providerLower === "gemini") {
      providerType = "gemini";
    } else {
      providerType = "openai-compatible";
    }

    // Derive display name for diagnostics and chain tests
    let friendlyName = def.name || (providerLower && providerLower !== "openai-compatible" ? providerLower : "");
    const bUrl = baseUrlRaw.toLowerCase();
    if (bUrl.includes("groq.com") || providerLower.includes("groq")) {
      friendlyName = "groq";
    } else if (bUrl.includes("cerebras.ai") || providerLower.includes("cerebras")) {
      friendlyName = "cerebras";
    } else if (bUrl.includes("openrouter.ai") || providerLower.includes("openrouter")) {
      friendlyName = "openrouter";
    } else if (bUrl.includes("mistral.ai") || providerLower.includes("mistral")) {
      friendlyName = "mistral";
    } else if (bUrl.includes("nvidia.com") || providerLower.includes("nvidia")) {
      friendlyName = "nvidia";
    } else if (providerType === "cloudflare-workers-ai" || bUrl.includes("cloudflare.com")) {
      friendlyName = "cloudflare-workers-ai";
    } else if (bUrl.includes("cohere.com") || bUrl.includes("cohere.ai") || providerLower.includes("cohere")) {
      friendlyName = "cohere";
    } else if (!friendlyName) {
      friendlyName = providerType;
    }

    slots.push({
      slot: n,
      providerType,
      name: friendlyName,
      baseUrl: baseUrlRaw,
      apiKey: apiKeyRaw,
      model: modelRaw,
    });
  }
  return slots;
}

/**
 * Checks whether an error is a non-retryable 400 request-shape bug.
 * Iron Rule #2: Fail over on 401 / 429 / 5xx / network timeout — NEVER on 400.
 * @param {any} err
 * @returns {boolean}
 */
export function isNonRetryableError(err) {
  if (!err) return false;
  if (err.status === 400 || err.statusCode === 400) return true;
  const msg = String(err.message || "");
  if (msg.includes("(400)") || msg.includes("HTTP 400") || /\bstatus:\s*400\b/i.test(msg)) {
    return true;
  }
  return false;
}

/**
 * Standardized LLM completion interface with 7+ provider failover chain.
 * 
 * @param {Object} options
 * @param {Record<string, any>} options.env Cloudflare Pages environment
 * @param {string} [options.system] Optional system prompt
 * @param {Array<{role: string, content: string, tool_call_id?: string, name?: string}>} options.messages
 * @param {Array<any>} [options.tools] Optional function calling tool definitions
 * @param {number} [options.maxTokens]
 * @param {number} [options.temperature]
 * @param {"json" | "text"} [options.responseFormat]
 * @param {string} [options.modelOverride]
 * @param {string} [options.providerOverride]
 * @param {string} [options.thinkingLevel]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<{text: string, toolCalls?: Array<any>, provider: string, model: string, latencyMs: number}>}
 */
export async function completeLLM({
  env = {},
  system = "",
  messages = [],
  tools = null,
  maxTokens = 2048,
  temperature = 0.2,
  responseFormat = "text",
  modelOverride = "",
  providerOverride = "",
  thinkingLevel = "",
  timeoutMs = 45000,
}) {
  const primaryProvider = (providerOverride || getActiveProviderName(env)).toLowerCase();
  const fallbackSlots = getFallbackSlots(env);

  let lastError = null;

  // 1. Attempt Primary Provider
  try {
    return await executeProviderCall({
      provider: primaryProvider,
      env,
      system,
      messages,
      tools,
      maxTokens,
      temperature,
      responseFormat,
      modelOverride,
      thinkingLevel,
      timeoutMs,
    });
  } catch (primaryErr) {
    // Iron Rule #2: If 400, surface immediately — do NOT fail over
    if (isNonRetryableError(primaryErr)) {
      throw primaryErr;
    }
    lastError = primaryErr;
    console.warn(`[LLM] Primary provider (${primaryProvider}) failed: ${sanitizeKeyLeakage(primaryErr.message)}`);
  }

  // 2. Walk Numbered Fallback Chain (Slots 1..9)
  if (fallbackSlots.length > 0) {
    for (const slot of fallbackSlots) {
      try {
        console.info(`[LLM] Initiating failover to slot ${slot.slot} (${slot.name}): model=${slot.model || "default"}`);
        return await executeSlotCall({
          slot,
          env,
          system,
          messages,
          tools,
          maxTokens,
          temperature,
          responseFormat,
          thinkingLevel,
          timeoutMs: Math.min(timeoutMs, 30000), // Per-attempt timeout guard
        });
      } catch (slotErr) {
        // Iron Rule #2: If 400, surface immediately
        if (isNonRetryableError(slotErr)) {
          throw slotErr;
        }
        lastError = slotErr;
        console.warn(`[LLM] Fallback slot ${slot.slot} (${slot.name}) failed: ${sanitizeKeyLeakage(slotErr.message)}`);
      }
    }
  } else if (env?.LLM_FALLBACK_PROVIDER) {
    // Legacy single fallback provider compatibility
    const legacyFallback = env.LLM_FALLBACK_PROVIDER.trim().toLowerCase();
    if (legacyFallback !== primaryProvider) {
      console.info(`[LLM] Initiating failover to legacy fallback provider: ${legacyFallback}`);
      try {
        return await executeProviderCall({
          provider: legacyFallback,
          env,
          system,
          messages,
          tools,
          maxTokens,
          temperature,
          responseFormat,
          modelOverride: "",
          thinkingLevel,
          timeoutMs,
        });
      } catch (legacyErr) {
        if (isNonRetryableError(legacyErr)) {
          throw legacyErr;
        }
        console.error(`[LLM] Legacy fallback (${legacyFallback}) also failed: ${sanitizeKeyLeakage(legacyErr.message)}`);
        throw new Error(`LLM primary '${primaryProvider}' failed (${sanitizeKeyLeakage(lastError?.message || "")}) and fallback '${legacyFallback}' failed (${sanitizeKeyLeakage(legacyErr.message)})`);
      }
    }
  }

  // All providers in chain exhausted
  throw lastError || new Error(`All LLM providers in failover chain exhausted`);
}

/**
 * Dispatches an execution against a specific numbered slot.
 */
async function executeSlotCall(params) {
  const { slot, env } = params;
  const startTime = Date.now();

  const apiKey = resolveSlotApiKey(slot.apiKey);
  let result;

  if (slot.providerType === "cloudflare-workers-ai") {
    result = await callCloudflareWorkersAi({
      ...params,
      apiKeyOverride: apiKey,
      modelOverride: slot.model,
      baseUrlOverride: slot.baseUrl,
    });
  } else if (slot.providerType === "anthropic") {
    result = await callAnthropic({
      ...params,
      apiKeyOverride: apiKey,
      modelOverride: slot.model,
      baseUrlOverride: slot.baseUrl,
    });
  } else if (slot.providerType === "gemini") {
    result = await callGemini({
      ...params,
      apiKeyOverride: apiKey,
      modelOverride: slot.model,
    });
  } else {
    // Default to OpenAI-compatible
    result = await callOpenAICompatible({
      ...params,
      apiKeyOverride: apiKey,
      baseUrlOverride: slot.baseUrl,
      modelOverride: slot.model,
    });
  }

  const latencyMs = Date.now() - startTime;
  const preview = (result.text || "").slice(0, 60).replace(/[\r\n]+/g, " ");
  console.info(`[LLM] Slot: ${slot.slot} | Provider: ${slot.name} | Model: ${result.model} | Latency: ${latencyMs}ms | Preview: "${preview}..."`);

  return {
    ...result,
    slot: slot.slot,
    provider: slot.name,
    latencyMs,
  };
}

/**
 * Dispatch call to specific primary provider implementation.
 */
async function executeProviderCall(params) {
  const { provider } = params;
  const startTime = Date.now();

  let result;
  if (provider === "gemini") {
    result = await callGemini(params);
  } else if (provider === "openai") {
    result = await callOpenAICompatible(params);
  } else if (provider === "anthropic") {
    result = await callAnthropic(params);
  } else if (provider === "cloudflare-workers-ai") {
    result = await callCloudflareWorkersAi(params);
  } else {
    result = await callOpenAICompatible(params);
  }

  const latencyMs = Date.now() - startTime;
  const preview = (result.text || "").slice(0, 60).replace(/[\r\n]+/g, " ");
  console.info(`[LLM] Provider: ${provider} | Model: ${result.model} | Latency: ${latencyMs}ms | Preview: "${preview}..."`);

  return {
    ...result,
    provider,
    latencyMs,
  };
}

/**
 * Google Gemini REST Implementation (matches existing analyze-options.js behavior)
 */
async function callGemini({
  env,
  system,
  messages,
  tools,
  maxTokens,
  temperature,
  responseFormat,
  modelOverride,
  thinkingLevel,
  timeoutMs,
  apiKeyOverride,
}) {
  const apiKey = apiKeyOverride || await resolveGeminiApiKey(env);
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable in Cloudflare Pages.");
  }

  let model = modelOverride || env.GEMINI_MODEL || "gemini-3.8-flash";
  if (model === "gemini-2.5-flash" || model === "gemini/gemini-2.5-flash") {
    model = "gemini-3.8-flash";
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  // Convert messages to Gemini contents format
  const contents = [];
  for (const m of messages) {
    if (m.role === "tool" || m.tool_call_id) {
      let responseObj;
      try {
        responseObj = typeof m.content === "string" ? JSON.parse(m.content) : m.content;
      } catch {
        responseObj = { output: m.content };
      }
      if (!responseObj || typeof responseObj !== "object" || Array.isArray(responseObj)) {
        responseObj = { output: responseObj };
      }

      contents.push({
        role: "function",
        parts: [{
          functionResponse: {
            name: m.name || "tool",
            response: {
              name: m.name || "tool",
              content: responseObj,
            },
          },
        }],
      });
      continue;
    }

    if (m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      const parts = [];
      if (m.content && typeof m.content === "string" && m.content.trim()) {
        parts.push({ text: m.content.trim() });
      }
      for (const tc of m.tool_calls) {
        const fnName = tc.function?.name || tc.name || "tool";
        let fnArgs = {};
        try {
          fnArgs = typeof tc.function?.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : (tc.function?.arguments || tc.args || {});
        } catch {
          fnArgs = {};
        }
        parts.push({
          functionCall: {
            name: fnName,
            args: fnArgs,
          },
        });
      }
      if (parts.length > 0) {
        contents.push({
          role: "model",
          parts,
        });
      }
      continue;
    }

    const role = (m.role === "assistant" || m.role === "model") ? "model" : "user";
    const textContent = (typeof m.content === "string" ? m.content.trim() : "") || (m.content ? String(m.content) : "");
    if (textContent) {
      contents.push({
        role,
        parts: [{ text: textContent }],
      });
    }
  }

  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "Hello" }],
    });
  }

  const generationConfig = {
    temperature: typeof temperature === "number" ? temperature : 0.2,
    maxOutputTokens: maxTokens,
  };

  if (responseFormat === "json") {
    generationConfig.response_mime_type = "application/json";
  }

  if (thinkingLevel) {
    generationConfig.thinking_config = {
      thinking_level: thinkingLevel
    };
  }

  const bodyPayload = {
    contents,
    generationConfig,
  };

  if (system && typeof system === "string" && system.trim()) {
    bodyPayload.system_instruction = {
      parts: [{ text: system.trim() }]
    };
  }

  if (Array.isArray(tools) && tools.length > 0) {
    bodyPayload.tools = [{
      function_declarations: tools.map(t => {
        if (t.function) {
          return {
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters
          };
        }
        return t;
      })
    }];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resp;
  try {
    resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const timeoutErr = new Error(`Gemini request timed out after ${timeoutMs}ms`);
      timeoutErr.name = "TimeoutError";
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const errorText = await resp.text();
    const sanitizedError = sanitizeKeyLeakage(errorText);
    const err = new Error(`Gemini API error (${resp.status}): ${sanitizedError}`);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  let textResult = "";
  const toolCalls = [];

  for (const part of parts) {
    if (part.text) {
      textResult += part.text;
    }
    if (part.functionCall) {
      toolCalls.push({
        id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: part.functionCall.name,
        arguments: typeof part.functionCall.args === "string"
          ? part.functionCall.args
          : JSON.stringify(part.functionCall.args || {}),
      });
    }
  }

  return {
    text: textResult,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    model,
    raw: data,
  };
}

/**
 * OpenAI-compatible REST Implementation (Groq, Cerebras, OpenRouter, Mistral, NVIDIA NIM, Cohere, etc.)
 */
async function callOpenAICompatible({
  env,
  system,
  messages,
  tools,
  maxTokens,
  temperature,
  responseFormat,
  modelOverride,
  baseUrlOverride,
  apiKeyOverride,
  timeoutMs,
}) {
  const apiKey = apiKeyOverride || env.LLM_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing LLM_API_KEY environment variable for OpenAI-compatible provider.");
  }

  const baseUrl = (baseUrlOverride || env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = modelOverride || env.LLM_MODEL || "gpt-4o-mini";
  const endpoint = `${baseUrl}/chat/completions`;

  const formattedMessages = [];
  if (system && typeof system === "string" && system.trim()) {
    formattedMessages.push({ role: "system", content: system.trim() });
  }

  for (const m of messages) {
    if (m.tool_call_id) {
      formattedMessages.push({
        role: "tool",
        tool_call_id: m.tool_call_id,
        name: m.name,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      });
    } else {
      formattedMessages.push({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.content,
      });
    }
  }

  const payload = {
    model,
    messages: formattedMessages,
    temperature: typeof temperature === "number" ? temperature : 0.2,
    max_tokens: maxTokens,
  };

  if (responseFormat === "json") {
    payload.response_format = { type: "json_object" };
  }

  if (Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools.map(t => {
      if (t.type === "function") return t;
      return {
        type: "function",
        function: {
          name: t.name || t.function?.name,
          description: t.description || t.function?.description,
          parameters: t.parameters || t.function?.parameters,
        }
      };
    });
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };

  // OpenRouter special case headers per documented convention
  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = env.APP_URL || "https://deltaharvest.app";
    headers["X-Title"] = "DeltaHarvest";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resp;
  try {
    resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const timeoutErr = new Error(`OpenAI-compatible request timed out after ${timeoutMs}ms`);
      timeoutErr.name = "TimeoutError";
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const errorText = await resp.text();
    const sanitizedError = sanitizeKeyLeakage(errorText);
    const err = new Error(`OpenAI-compatible API error (${resp.status}): ${sanitizedError}`);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  const choice = data?.choices?.[0];
  const message = choice?.message || {};

  const textResult = message.content || "";
  const toolCalls = (message.tool_calls || []).map(tc => ({
    id: tc.id,
    name: tc.function?.name,
    arguments: typeof tc.function?.arguments === "string" ? tc.function.arguments : JSON.stringify(tc.function?.arguments || {}),
  }));

  return {
    text: textResult,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    model,
    raw: data,
  };
}

/**
 * Cloudflare Workers AI REST Implementation
 */
async function callCloudflareWorkersAi({
  env,
  system,
  messages,
  maxTokens,
  temperature,
  modelOverride,
  apiKeyOverride,
  baseUrlOverride,
  timeoutMs,
}) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID || baseUrlOverride;
  const apiToken = apiKeyOverride || env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN for Cloudflare Workers AI.");
  }

  const model = modelOverride || env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`;

  const formattedMessages = [];
  if (system && typeof system === "string" && system.trim()) {
    formattedMessages.push({ role: "system", content: system.trim() });
  }

  for (const m of messages) {
    formattedMessages.push({
      role: m.role === "assistant" || m.role === "model" ? "assistant" : (m.role === "system" ? "system" : "user"),
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resp;
  try {
    resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: formattedMessages,
        max_tokens: maxTokens || 2048,
        temperature: typeof temperature === "number" ? temperature : 0.2,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const timeoutErr = new Error(`Cloudflare Workers AI request timed out after ${timeoutMs}ms`);
      timeoutErr.name = "TimeoutError";
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const errorText = await resp.text();
    const sanitizedError = sanitizeKeyLeakage(errorText);
    const err = new Error(`Cloudflare Workers AI API error (${resp.status}): ${sanitizedError}`);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  const textResult = data?.result?.response || data?.response || data?.choices?.[0]?.message?.content || "";

  return {
    text: textResult,
    model,
    raw: data,
  };
}

/**
 * Anthropic Messages REST Implementation
 */
async function callAnthropic({
  env,
  system,
  messages,
  tools,
  maxTokens,
  temperature,
  modelOverride,
  apiKeyOverride,
  baseUrlOverride,
  timeoutMs,
}) {
  const apiKey = apiKeyOverride || env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const baseUrl = (baseUrlOverride || env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1").replace(/\/+$/, "");
  const model = modelOverride || env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  const endpoint = `${baseUrl}/messages`;

  const formattedMessages = messages.map(m => ({
    role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
    content: m.content,
  }));

  const payload = {
    model,
    max_tokens: maxTokens || 2048,
    messages: formattedMessages,
    temperature: typeof temperature === "number" ? temperature : 0.2,
  };

  if (system && typeof system === "string" && system.trim()) {
    payload.system = system.trim();
  }

  if (Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools.map(t => {
      const fn = t.function || t;
      return {
        name: fn.name,
        description: fn.description,
        input_schema: fn.parameters || { type: "object", properties: {} }
      };
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resp;
  try {
    resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const timeoutErr = new Error(`Anthropic request timed out after ${timeoutMs}ms`);
      timeoutErr.name = "TimeoutError";
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const errorText = await resp.text();
    const sanitizedError = sanitizeKeyLeakage(errorText);
    const err = new Error(`Anthropic API error (${resp.status}): ${sanitizedError}`);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  let textResult = "";
  const toolCalls = [];

  for (const block of data.content || []) {
    if (block.type === "text") {
      textResult += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: JSON.stringify(block.input || {}),
      });
    }
  }

  return {
    text: textResult,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    model,
    raw: data,
  };
}

/**
 * Admin Test Tool: Attempts a single lightweight completion for one configured slot.
 * Returns { slot, provider, model, ok, latencyMs, error } - NEVER leaks keys!
 * 
 * @param {Record<string, any>} env
 * @param {Object} slot
 * @returns {Promise<{slot: number, provider: string, model: string, ok: boolean, latencyMs: number, error?: string}>}
 */
export async function testFallbackSlot(env, slot) {
  const startTime = Date.now();
  try {
    await executeSlotCall({
      slot,
      env,
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 5,
      temperature: 0,
      timeoutMs: 15000,
    });
    return {
      slot: slot.slot,
      provider: slot.name,
      model: slot.model,
      ok: true,
      latencyMs: Date.now() - startTime,
    };
  } catch (err) {
    return {
      slot: slot.slot,
      provider: slot.name,
      model: slot.model,
      ok: false,
      latencyMs: Date.now() - startTime,
      error: sanitizeKeyLeakage(err.message || "Unknown error"),
    };
  }
}
