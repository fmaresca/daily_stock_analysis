import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Check,
  AlertTriangle,
  Zap,
  Activity,
  ShieldCheck,
} from './icons';
import {
  getAlertSettings,
  saveAlertSettings,
  AlertSettings,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
  sendDiscordAlert,
  sendTelegramAlert,
  evaluateAndDispatchAlerts,
} from '../utils/alertDispatcher';
import { TickerMeta, OptionOpportunity } from '../types/options';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: TickerMeta[];
  opportunities: OptionOpportunity[];
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  tickers,
  opportunities,
}) => {
  const [settings, setSettings] = useState<AlertSettings>(() => getAlertSettings());
  const [browserPermGranted, setBrowserPermGranted] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermGranted(Notification.permission === 'granted');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleBrowser = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestBrowserNotificationPermission();
      setBrowserPermGranted(granted);
      const updated = { ...settings, enableBrowserNotifications: granted };
      setSettings(updated);
      saveAlertSettings(updated);
      if (granted) {
        sendBrowserNotification('DeltaHarvest Alerts Active', 'Desktop browser notifications are now enabled.');
      }
    } else {
      const updated = { ...settings, enableBrowserNotifications: false };
      setSettings(updated);
      saveAlertSettings(updated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAlertSettings(settings);
    setTestStatus('Settings saved successfully!');
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleTestDiscord = async () => {
    if (!settings.discordWebhookUrl) {
      setTestStatus('Please enter a Discord Webhook URL first.');
      return;
    }
    setTestStatus('Sending test notification to Discord...');
    const ok = await sendDiscordAlert(
      settings.discordWebhookUrl,
      'Test Alert: DeltaHarvest Income Engine',
      'This is a verified test alert from your DeltaHarvest options screener session.',
      [
        { name: 'Status', value: 'Connected & Operational', inline: true },
        { name: 'Environment', value: 'Production Web UI', inline: true },
      ]
    );
    setTestStatus(ok ? 'Discord test alert sent successfully!' : 'Discord webhook failed. Please check URL.');
    setTimeout(() => setTestStatus(null), 5000);
  };

  const handleTestTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      setTestStatus('Please enter Telegram Bot Token and Chat ID.');
      return;
    }
    setTestStatus('Sending test notification to Telegram...');
    const ok = await sendTelegramAlert(
      settings.telegramBotToken,
      settings.telegramChatId,
      '⚡ *DeltaHarvest Test Alert*\nYour Telegram alerts are verified and active.'
    );
    setTestStatus(ok ? 'Telegram test message sent!' : 'Telegram delivery failed. Check bot token and chat ID.');
    setTimeout(() => setTestStatus(null), 5000);
  };

  const handleManualScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await evaluateAndDispatchAlerts(tickers, opportunities);
      if (res.dispatchedCount > 0) {
        setScanResult(`Scan complete! Found and dispatched ${res.dispatchedCount} opportunity alerts.`);
      } else {
        setScanResult('Scan complete! No watchlist stocks currently meet extreme alert criteria.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Real-Time Alerts &amp; Webhook Dispatcher</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Priority 1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Receive instant notifications when watchlist symbols breach RSI, support, or IV Rank thresholds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Status Message */}
          {testStatus && (
            <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl text-blue-300 flex items-center justify-between">
              <span>{testStatus}</span>
              <button onClick={() => setTestStatus(null)} className="text-blue-400">✕</button>
            </div>
          )}

          {scanResult && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center justify-between">
              <span>{scanResult}</span>
              <button onClick={() => setScanResult(null)} className="text-emerald-400">✕</button>
            </div>
          )}

          {/* Section 1: Alert Triggers */}
          <div className="space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
              Algorithmic Alert Triggers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.alertOnRsiOversold}
                  onChange={(e) => setSettings({ ...settings, alertOnRsiOversold: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                />
                <div>
                  <span className="font-bold text-white block">RSI Oversold</span>
                  <span className="text-[10px] text-slate-400">14-Day RSI &lt; 35 (Sweet-spot dip buying)</span>
                </div>
              </label>

              <label className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.alertOnBollingerBand}
                  onChange={(e) => setSettings({ ...settings, alertOnBollingerBand: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                />
                <div>
                  <span className="font-bold text-white block">Lower Band Support</span>
                  <span className="text-[10px] text-slate-400">Spot &le; Lower Band + 2%</span>
                </div>
              </label>

              <label className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.alertOnHighIvr}
                  onChange={(e) => setSettings({ ...settings, alertOnHighIvr: e.target.checked })}
                  className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-900"
                />
                <div>
                  <span className="font-bold text-white block">High IV Rank Spike</span>
                  <span className="text-[10px] text-slate-400">IVR &ge; 45% (High option premium)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Browser Push Notifications */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white block text-sm">Native Desktop Notifications</span>
                <p className="text-[11px] text-slate-400">Receive popup alerts in your OS notification center even when tab is backgrounded.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleBrowser(!settings.enableBrowserNotifications)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                  settings.enableBrowserNotifications && browserPermGranted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {settings.enableBrowserNotifications && browserPermGranted ? 'Enabled ✓' : 'Enable Notifications'}
              </button>
            </div>
          </div>

          {/* Section 3: Discord Webhook */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Discord Channel Webhook</span>
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={settings.enableDiscordWebhook}
                  onChange={(e) => setSettings({ ...settings, enableDiscordWebhook: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-500 bg-slate-900"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={settings.discordWebhookUrl}
                onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestDiscord}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold whitespace-nowrap transition-colors"
              >
                Test Discord
              </button>
            </div>
          </div>

          {/* Section 4: Telegram Webhook */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Telegram Bot Alerts</span>
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={settings.enableTelegramWebhook}
                  onChange={(e) => setSettings({ ...settings, enableTelegramWebhook: e.target.checked })}
                  className="rounded border-slate-700 text-blue-500 bg-slate-900"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={settings.telegramBotToken}
                onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                placeholder="Bot Token (e.g. 123456:ABC-DEF...)"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.telegramChatId}
                  onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                  placeholder="Chat ID (e.g. @channel or 987654)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold whitespace-nowrap transition-colors"
                >
                  Test
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleManualScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold flex items-center space-x-1.5 transition-colors"
          >
            {isScanning ? (
              <Activity className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isScanning ? 'Evaluating...' : '⚡ Scan Active Watchlist Now'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-md shadow-emerald-600/30"
            >
              Save Alert Rules
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
