/**
 * Cloudflare Pages Functions: Server-side Multi-LLM Provider Abstraction
 * 
 * Supports:
 * - Google Gemini (default, zero-breaking change with GEMINI_API_KEY)
 * - OpenAI-compatible endpoints (DeepSeek, Qwen, Ollama, OpenAI via LLM_BASE_URL + LLM_API_KEY + LLM_MODEL)
 * - Anthropic Claude (via ANTHROPIC_API_KEY + ANTHROPIC_MODEL)
 * 
 * Features:
 * - Dynamic provider selection via LLM_PROVIDER
 * - 1-retry automatic failover via LLM_FALLBACK_PROVIDER
 * - Sanitized latency & provider observability (ZERO key/prompt leakage)
 * - Standardized tool-calling and JSON formatting
 */

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
 * Standardized LLM completion interface.
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
 * @param {string} [options.thinkingLevel] e.g. "HIGH" for Gemini Extended Thinking
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
  const fallbackProvider = env?.LLM_FALLBACK_PROVIDER
    ? env.LLM_FALLBACK_PROVIDER.trim().toLowerCase()
    : null;

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
    console.warn(`[LLM] Primary provider (${primaryProvider}) failed: ${primaryErr.message}`);

    if (fallbackProvider && fallbackProvider !== primaryProvider) {
      console.info(`[LLM] Initiating failover to fallback provider: ${fallbackProvider}`);
      try {
        return await executeProviderCall({
          provider: fallbackProvider,
          env,
          system,
          messages,
          tools,
          maxTokens,
          temperature,
          responseFormat,
          modelOverride: "", // Clear modelOverride so fallback uses its native default
          thinkingLevel,
          timeoutMs,
        });
      } catch (fallbackErr) {
        console.error(`[LLM] Fallback provider (${fallbackProvider}) also failed: ${fallbackErr.message}`);
        throw new Error(`LLM provider '${primaryProvider}' failed (${primaryErr.message}) and fallback '${fallbackProvider}' failed (${fallbackErr.message})`);
      }
    }

    throw primaryErr;
  }
}

/**
 * Dispatch call to specific provider implementation.
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
  } else {
    // If unknown name, default to OpenAI-compatible
    result = await callOpenAICompatible(params);
  }

  const latencyMs = Date.now() - startTime;
  // Truncated preview for diagnostic log, NEVER logging keys or long prompt contents
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
}) {
  const apiKey = await resolveGeminiApiKey(env);
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable in Cloudflare Pages.");
  }

  let model = modelOverride || env.GEMINI_MODEL || "gemini-3.8-flash";
  if (model === "gemini-2.5-flash" || model === "gemini/gemini-2.5-flash") {
    model = "gemini-3.8-flash";
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Convert messages to Gemini contents format
  const contents = [];
  for (const m of messages) {
    // 1. Tool execution result (role: "tool" or has tool_call_id)
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

    // 2. Assistant message with function calls
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

    // 3. Standard text conversation message (must have non-empty text)
    const role = (m.role === "assistant" || m.role === "model") ? "model" : "user";
    const textContent = (typeof m.content === "string" ? m.content.trim() : "") || (m.content ? String(m.content) : "");
    if (textContent) {
      contents.push({
        role,
        parts: [{ text: textContent }],
      });
    }
  }

  // Ensure contents has at least one valid message
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

  // Convert tools to Gemini functionDeclarations format if provided
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const errorText = await resp.text();
    if (resp.status === 429) {
      throw new Error(`Google AI Studio rate limit reached (HTTP 429).`);
    }
    throw new Error(`Gemini API error (${resp.status}): ${errorText}`);
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
 * OpenAI-compatible REST Implementation (DeepSeek, Qwen, Ollama, OpenAI)
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
  timeoutMs,
}) {
  const apiKey = env.LLM_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing LLM_API_KEY environment variable for OpenAI-compatible provider.");
  }

  const baseUrl = (env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
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
        content: m.content,
      });
    } else {
      formattedMessages.push({
        role: m.role,
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resp;
  try {
    resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`OpenAI-compatible request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`OpenAI-compatible API error (${resp.status}): ${errorText}`);
  }

  const data = await resp.json();
  const choice = data?.choices?.[0];
  const message = choice?.message || {};

  const textResult = message.content || "";
  const toolCalls = (message.tool_calls || []).map(tc => ({
    id: tc.id,
    name: tc.function?.name,
    arguments: tc.function?.arguments || "{}",
  }));

  return {
    text: textResult,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
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
  timeoutMs,
}) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const baseUrl = (env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1").replace(/\/+$/, "");
  const model = modelOverride || env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  const endpoint = `${baseUrl}/messages`;

  const formattedMessages = messages.map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
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
      throw new Error(`Anthropic request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Anthropic API error (${resp.status}): ${errorText}`);
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
