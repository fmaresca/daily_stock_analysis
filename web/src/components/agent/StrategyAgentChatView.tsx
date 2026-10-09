import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrainCircuit,
  Send,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from '../icons';

export interface StrategyAgentChatViewProps {
  initialTicker?: string;
  onNavigateToTicker?: (symbol: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  lens?: string;
  createdAt?: string;
}

interface ChatSession {
  id: string;
  ticker?: string;
  lens?: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

const STRATEGY_LENSES = [
  { id: 'Trend/Momentum', label: 'Trend / Momentum', desc: 'Moving averages, 20/50 SMA, RSI strength & volume' },
  { id: 'Mean-Reversion', label: 'Mean-Reversion', desc: 'Bollinger Band stretch, overbought/oversold levels' },
  { id: 'Breakout', label: 'Breakout', desc: 'Consolidation compression & resistance tests' },
  { id: 'Quality/Value', label: 'Quality / Value', desc: 'Downside margin of safety & drawdown resilience' },
  { id: 'Growth', label: 'Growth', desc: 'Relative strength vs SPY/QQQ & beta momentum' },
  { id: 'Event-Driven (Earnings)', label: 'Event-Driven (Earnings)', desc: 'Upcoming calendar catalyst & IV crush risk' },
  { id: 'Sentiment/Positioning', label: 'Sentiment / Positioning', desc: 'Reddit, X, and News buzz via Adanos' },
  { id: 'Risk/Defensive', label: 'Risk / Defensive', desc: 'Capital preservation & downside buffer cushion' },
] as const;

const PLAYBOOKS = [
  { id: 'conservative_income_csp', name: '🛡️ Conservative CSP (15Δ)', delta: '15Δ' },
  { id: 'aggressive_momentum_cc', name: '🎯 Momentum CC (22Δ)', delta: '22Δ' },
  { id: 'pmcc_growth_compounder', name: '⚡ PMCC Compounder (80/20Δ)', delta: 'Diagonal' },
  { id: 'earnings_vol_crush_post', name: '📉 Post-Earnings Crush', delta: 'Post-Event' },
  { id: 'mean_reversion_oversold_bounce', name: '🔄 Capitulation Bounce', delta: '2σ Rail' },
];

const QUICK_PROMPTS = [
  'Run the 5-Point Options Pre-Flight Underwriting Scorecard.',
  'What is the recommended strike and downside cushion for a Cash-Secured Put?',
  'What are upcoming binary earnings risks or macro catalysts?',
  'Evaluate this stock under a Covered Call momentum resistance lens.',
  'What is the current crowd sentiment and buzz level on Reddit & X?',
];

export const StrategyAgentChatView: React.FC<StrategyAgentChatViewProps> = ({
  initialTicker = 'NVDA',
  onNavigateToTicker,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ticker, setTicker] = useState<string>(initialTicker.toUpperCase());
  const [isEditingTicker, setIsEditingTicker] = useState<boolean>(false);
  const [tickerInput, setTickerInput] = useState<string>(initialTicker.toUpperCase());
  const [selectedLens, setSelectedLens] = useState<string>('Trend/Momentum');
  const [selectedPlaybook, setSelectedPlaybook] = useState<string>('conservative_income_csp');
  const [journalStatus, setJournalStatus] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeToolStatus, setActiveToolStatus] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Gemini API Key Management
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    return localStorage.getItem('deltaharvest_gemini_api_key') || '';
  });
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean>(false);
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);
  const [keySaveMessage, setKeySaveMessage] = useState<{ text: string; success: boolean } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Quick Action: Pin trade idea to Options Signal Journal
  const handlePinToJournal = async (sym: string, strategy: string = 'CSP') => {
    try {
      setJournalStatus('Saving to Signal Journal...');
      const res = await fetch('/api/options/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol: sym,
          strategy,
          notes: `Tracked from Strategy Agent (${selectedLens} lens, ${selectedPlaybook} playbook)`,
        }),
      });
      if (res.ok) {
        setJournalStatus(`✅ ${sym} successfully pinned to Signal Journal!`);
        setTimeout(() => setJournalStatus(null), 3000);
      } else {
        throw new Error('Journal save failed');
      }
    } catch {
      setJournalStatus(`⚠️ Could not save to journal. Check sign-in status.`);
      setTimeout(() => setJournalStatus(null), 3000);
    }
  };

  // Check key configuration status on mount
  useEffect(() => {
    fetch('/api/agent/chat?action=key_status', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.configured || localStorage.getItem('deltaharvest_gemini_api_key')) {
          setIsKeyConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    setKeySaveMessage(null);
    const cleanKey = apiKeyInput.trim();
    try {
      if (cleanKey) {
        localStorage.setItem('deltaharvest_gemini_api_key', cleanKey);
      } else {
        localStorage.removeItem('deltaharvest_gemini_api_key');
      }

      const res = await fetch('/api/agent/chat?action=save_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ apiKey: cleanKey }),
      });

      if (res.ok) {
        setIsKeyConfigured(Boolean(cleanKey));
        setKeySaveMessage({
          text: cleanKey ? 'Gemini API Key successfully saved and activated!' : 'API Key cleared. Edge Quantitative Mode active.',
          success: true,
        });
        setTimeout(() => {
          setIsKeyModalOpen(false);
          setKeySaveMessage(null);
        }, 1500);
      } else {
        throw new Error('Server persistence failed');
      }
    } catch {
      setIsKeyConfigured(Boolean(cleanKey));
      setKeySaveMessage({
        text: 'Key saved locally in browser session.',
        success: true,
      });
      setTimeout(() => {
        setIsKeyModalOpen(false);
        setKeySaveMessage(null);
      }, 1500);
    } finally {
      setIsSavingKey(false);
    }
  };

  // Auto-scroll messages container
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeToolStatus, scrollToBottom]);

  // Load chat sessions on mount
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch('/api/agent/chat', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const loadedSessions = data?.sessions || [];
        setSessions(loadedSessions);
        if (!currentSessionId && loadedSessions.length > 0) {
          // Select most recent session
          selectSession(loadedSessions[0].id);
        }
      }
    } catch (e) {
      console.warn('Failed to load chat sessions:', e);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentSessionId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Select a session and load its messages
  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/agent/chat?sessionId=${encodeURIComponent(sessionId)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data?.messages || []);
        if (data?.session?.ticker) {
          setTicker(data.session.ticker);
          setTickerInput(data.session.ticker);
        }
        if (data?.session?.lens) {
          setSelectedLens(data.session.lens);
        }
      }
    } catch (e) {
      console.warn('Failed to load session messages:', e);
    }
  };

  // Start a new session
  const handleStartNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setErrorMsg(null);
    inputRef.current?.focus();
  };

  // Delete a session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this strategy conversation?')) return;

    try {
      const res = await fetch(`/api/agent/chat?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          handleStartNewSession();
        }
      }
    } catch (err) {
      console.warn('Failed to delete session:', err);
    }
  };

  // Send message with SSE streaming
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isStreaming) return;

    setInputText('');
    setErrorMsg(null);

    const userMessage: ChatMessage = {
      id: `client_${Date.now()}`,
      role: 'user',
      content: text,
      lens: selectedLens,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setActiveToolStatus('Connecting to institutional strategy agent...');

    // Placeholder for incoming assistant message
    const assistantMsgId = `assistant_${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      lens: selectedLens,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const storedKey = apiKeyInput.trim() || localStorage.getItem('deltaharvest_gemini_api_key') || '';
      const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedKey) {
        requestHeaders['x-gemini-api-key'] = storedKey;
      }

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: requestHeaders,
        credentials: 'include',
        body: JSON.stringify({
          sessionId: currentSessionId || undefined,
          ticker,
          lens: selectedLens,
          playbook: selectedPlaybook,
          message: text,
          geminiApiKey: storedKey || undefined,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = `Server returned HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error) errMsg = errJson.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') {
            setIsStreaming(false);
            setActiveToolStatus(null);
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const data = JSON.parse(dataStr);

              // ── Text chunks (streaming response) ──────────────────────────
              if (data.type === 'delta' || data.chunk) {
                accumulatedText += (data.chunk || data.content || '');
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );

              // ── Tool call announced (show status banner) ───────────────────
              } else if (data.type === 'tool' || data.tool) {
                const toolName = data.tool;
                if (toolName === 'get_market_price_and_technicals') {
                  setActiveToolStatus(`⚡ Pulling live spot price & technicals for ${ticker}...`);
                } else if (toolName === 'get_market_sentiment') {
                  setActiveToolStatus(`⚡ Inquiring Adanos multi-source crowd sentiment for ${ticker}...`);
                } else if (toolName === 'get_ticker_news') {
                  setActiveToolStatus(`⚡ Aggregating recent catalyst headlines for ${ticker}...`);
                } else if (toolName === 'get_economic_calendar') {
                  setActiveToolStatus(`⚡ Inspecting high-impact macroeconomic calendar...`);
                } else {
                  setActiveToolStatus(`⚡ Running quantitative tool: ${toolName}...`);
                }

              // ── Tool result returned (clear status) ───────────────────────
              } else if (data.type === 'tool_result') {
                setActiveToolStatus('⚡ Synthesizing results...');

              // ── Session metadata / new session created ─────────────────────
              } else if (data.type === 'meta' || data.type === 'done') {
                if (data.sessionId && !currentSessionId) {
                  setCurrentSessionId(data.sessionId);
                  fetchSessions();
                }
                if (data.type === 'done') {
                  setActiveToolStatus(null);
                }

              // ── Server-side error forwarded as SSE ─────────────────────────
              } else if (data.type === 'error') {
                const errText = data.error || 'Strategy agent processing error.';
                setErrorMsg(errText);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId && !m.content
                      ? { ...m, content: `⚠️ ${errText}` }
                      : m
                  )
                );
              }
            } catch {
              // Non-JSON SSE line — skip silently
            }
          }
        }

      }
    } catch (err: any) {
      console.error('Agent chat streaming error:', err);
      setErrorMsg(err.message || 'Strategy agent communication error.');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId && !m.content
            ? { ...m, content: `⚠️ Error: ${err.message || 'Unable to complete strategy analysis.'}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setActiveToolStatus(null);
    }
  };

  // Switch ticker helper
  const handleSaveTicker = () => {
    const clean = tickerInput.trim().toUpperCase();
    if (clean) {
      setTicker(clean);
      setIsEditingTicker(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[640px] max-w-7xl mx-auto w-full gap-4 p-3 sm:p-4 text-slate-100">
      {/* 1. Left Drawer: Conversation Sessions */}
      <div className="lg:w-72 flex-shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <span>Conversations</span>
          </div>
          <button
            onClick={handleStartNewSession}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
            title="Start new strategy inquiry"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {isLoadingSessions ? (
            <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No saved conversations yet. Ask your first question!
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === currentSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`group relative p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-semibold'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {sess.ticker || 'MACRO'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded transition-opacity"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] truncate text-slate-400 mt-0.5">
                    {sess.title || 'Strategy Consultation'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{sess.lens || 'Trend'}</span>
                    <span>{new Date(sess.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
        {/* Top Header: Ticker Context Chip & Lens Selector */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2">
          {/* Ticker Context Chip */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Focus Ticker:</span>
            {isEditingTicker ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTicker()}
                  className="w-20 px-2 py-0.5 bg-slate-800 border border-emerald-500 text-xs font-mono font-bold text-emerald-300 rounded focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTicker}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded"
                >
                  Set
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingTicker(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all shadow-sm group"
                title="Click to change active ticker"
              >
                <span>${ticker}</span>
                <span className="text-[10px] text-emerald-500 group-hover:text-emerald-300">✎</span>
              </div>
            )}

            {onNavigateToTicker && (
              <button
                onClick={() => onNavigateToTicker(ticker)}
                className="p-1 text-slate-400 hover:text-emerald-300 text-xs flex items-center space-x-0.5"
                title="Open Equity Terminal for this ticker"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Strategy Lens Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-0.5">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center space-x-1">
              <Sliders className="w-3 h-3 text-purple-400" />
              <span>Lens:</span>
            </span>
            <div className="flex items-center space-x-1 overflow-x-auto">
              {STRATEGY_LENSES.map((lens) => {
                const isSelected = selectedLens === lens.id;
                return (
                  <button
                    key={lens.id}
                    onClick={() => setSelectedLens(lens.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/90 text-white font-bold shadow-md shadow-purple-900/40 border border-purple-400/50'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                    title={lens.desc}
                  >
                    {lens.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gemini AI Key Status Button */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              isKeyConfigured || apiKeyInput.trim()
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
            }`}
            title="Configure Google Gemini API key or view active AI status"
          >
            {isKeyConfigured || apiKeyInput.trim() ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gemini AI Active</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Edge Mode · Set AI Key</span>
              </>
            )}
          </button>
        </div>

        {/* Strategy Playbook Pills Bar */}
        <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">Playbook:</span>
            {PLAYBOOKS.map((pb) => {
              const isSelected = selectedPlaybook === pb.id;
              return (
                <button
                  key={pb.id}
                  onClick={() => setSelectedPlaybook(pb.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600/90 text-white font-bold shadow-md shadow-emerald-950/60 border border-emerald-400/50'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  <span>{pb.name}</span>
                </button>
              );
            })}
          </div>
          {journalStatus && (
            <div className="text-[11px] text-emerald-300 font-medium px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-lg animate-fade-in whitespace-nowrap shadow-sm">
              {journalStatus}
            </div>
          )}
        </div>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Institutional Strategy Q&A Agent
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Real-time quantitative equity and weekly options analysis. Every metric (prices, RSI, moving averages, sentiment) is retrieved live with inline citations — zero numbers are fabricated.
                </p>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                  Quick Prompts for ${ticker}:
                </p>
                <div className="flex flex-col space-y-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>{prompt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 px-1">
                    <span className="font-semibold text-slate-400">
                      {isUser ? 'You' : 'DeltaHarvest Strategy Agent'}
                    </span>
                    {m.lens && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 font-mono text-[9px]">
                        {m.lens}
                      </span>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-950/80 border border-slate-800/90 text-slate-200 rounded-tl-none shadow-lg'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans space-y-2">
                      {m.content}
                    </div>
                    {!isUser && m.content && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono text-[10px]">
                          Target: ${ticker} · {PLAYBOOKS.find((p) => p.id === selectedPlaybook)?.delta}
                        </span>
                        <button
                          onClick={() => handlePinToJournal(ticker, selectedPlaybook.includes('cc') ? 'CC' : 'CSP')}
                          className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-lg text-[10px] font-semibold flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                          title="Pin recommended strike setup into Options Signal Journal"
                        >
                          <span>📌 Track in Journal</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Active Tool Calling Banner */}
          {activeToolStatus && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-950/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>{activeToolStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end space-x-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder={`Ask strategy questions about ${ticker} using the ${selectedLens} lens...`}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500/80 text-xs text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none resize-none transition-colors"
                disabled={isStreaming}
              />
            </div>
            <button
              type="submit"
              disabled={isStreaming || !inputText.trim()}
              className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center justify-center cursor-pointer transition-all h-[52px]"
            >
              {isStreaming ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
            <span>Shift+Enter for newline. Responses cite verified tool metrics.</span>
            <span>Lens: {selectedLens}</span>
          </div>
        </div>
      </div>

      {/* 3. Gemini API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Google Gemini AI Settings</h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              DeltaHarvest connects to <strong>Google Gemini 3.8 Flash</strong> for neural options strategy reasoning.
              You can paste your API key below (persisted in your database &amp; browser) or set it in Cloudflare Pages (<code className="font-mono text-cyan-300">GEMINI_API_KEY</code>).
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px] pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get a free key from Google AI Studio</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
                {apiKeyInput && (
                  <button
                    onClick={() => setApiKeyInput('')}
                    className="text-rose-400 hover:text-rose-300 cursor-pointer text-[10px]"
                  >
                    Clear key
                  </button>
                )}
              </div>
            </div>

            {keySaveMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                  keySaveMessage.success
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{keySaveMessage.text}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                disabled={isSavingKey}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
              >
                {isSavingKey ? 'Saving...' : 'Save & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
