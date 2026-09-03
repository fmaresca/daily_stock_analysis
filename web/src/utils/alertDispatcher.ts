/**
 * Real-Time Alert Engine & Multi-Channel Webhook Dispatcher
 *
 * Supports:
 * 1. Native HTML5 Browser Push Notifications
 * 2. Discord Webhook alerts with rich embeds
 * 3. Telegram Bot alerts (Markdown formatted)
 * 4. Algorithmic trigger evaluation (RSI Oversold, Lower Bollinger Band support, IV Rank spike)
 */

import { TickerMeta, OptionOpportunity } from '../types/options';

export interface AlertSettings {
  enableBrowserNotifications: boolean;
  enableDiscordWebhook: boolean;
  discordWebhookUrl: string;
  enableTelegramWebhook: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  alertOnRsiOversold: boolean;
  alertOnBollingerBand: boolean;
  alertOnHighIvr: boolean;
  lastDispatchedTime?: string;
}

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  enableBrowserNotifications: false,
  enableDiscordWebhook: false,
  discordWebhookUrl: '',
  enableTelegramWebhook: false,
  telegramBotToken: '',
  telegramChatId: '',
  alertOnRsiOversold: true,
  alertOnBollingerBand: true,
  alertOnHighIvr: true,
};

const STORAGE_KEY = 'deltaharvest_alert_settings';

export function getAlertSettings(): AlertSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load alert settings:', e);
  }
  return DEFAULT_ALERT_SETTINGS;
}

export function saveAlertSettings(settings: AlertSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save alert settings:', e);
  }
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendBrowserNotification(title: string, body: string, tag?: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      tag: tag || 'deltaharvest-alert',
      icon: '/favicon.ico',
    });
  } catch (e) {
    console.warn('Notification trigger failed:', e);
  }
}

export async function sendDiscordAlert(
  webhookUrl: string,
  title: string,
  description: string,
  fields: { name: string; value: string; inline?: boolean }[] = []
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const payload = {
    username: 'DeltaHarvest Income Bot',
    avatar_url: 'https://raw.githubusercontent.com/fmaresca/daily_stock_analysis/main/web/public/favicon.ico',
    embeds: [
      {
        title: `🚨 ${title}`,
        description,
        color: 0x10b981, // Emerald green
        fields,
        footer: {
          text: 'DeltaHarvest Quantitative Screener',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch (e) {
    console.warn('Discord webhook failed:', e);
    return false;
  }
}

export async function sendTelegramAlert(
  botToken: string,
  chatId: string,
  text: string
): Promise<boolean> {
  if (!botToken || !chatId) return false;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    return resp.ok;
  } catch (e) {
    console.warn('Telegram alert failed:', e);
    return false;
  }
}

export async function evaluateAndDispatchAlerts(
  tickers: TickerMeta[],
  opportunities: OptionOpportunity[]
): Promise<{ dispatchedCount: number; messages: string[] }> {
  const settings = getAlertSettings();
  const alertMessages: string[] = [];

  for (const t of tickers) {
    const isRsiOversold = settings.alertOnRsiOversold && t.rsi_14 !== undefined && t.rsi_14 < 35;
    const isNearLowerBand =
      settings.alertOnBollingerBand &&
      t.lower_band !== undefined &&
      t.spot_price <= t.lower_band * 1.02;
    const isHighIvr = settings.alertOnHighIvr && t.ivr_30d !== undefined && t.ivr_30d >= 45;

    if (isRsiOversold || isNearLowerBand || isHighIvr) {
      const triggers: string[] = [];
      if (isRsiOversold) triggers.push(`RSI-14 Oversold (${t.rsi_14?.toFixed(1)})`);
      if (isNearLowerBand) triggers.push(`Near Lower Support ($${t.spot_price.toFixed(2)} vs Lower BB $${t.lower_band?.toFixed(2)})`);
      if (isHighIvr) triggers.push(`Elevated IVR (${t.ivr_30d?.toFixed(0)}%)`);

      const msg = `${t.symbol}: ${triggers.join(' | ')}`;
      alertMessages.push(msg);

      // 1. Browser Notification
      if (settings.enableBrowserNotifications) {
        sendBrowserNotification(
          `⚡ DeltaHarvest Opportunity: ${t.symbol}`,
          triggers.join(' • '),
          `alert-${t.symbol}`
        );
      }

      // 2. Discord Webhook
      if (settings.enableDiscordWebhook && settings.discordWebhookUrl) {
        sendDiscordAlert(
          settings.discordWebhookUrl,
          `Opportunity Alert: ${t.symbol} ($${t.spot_price.toFixed(2)})`,
          `Technical criteria met: ${triggers.join(', ')}`,
          [
            { name: 'Spot Price', value: `$${t.spot_price.toFixed(2)}`, inline: true },
            { name: 'RSI-14', value: `${t.rsi_14?.toFixed(1) || 'N/A'}`, inline: true },
            { name: 'IV Rank (30d)', value: `${t.ivr_30d?.toFixed(0) || 'N/A'}%`, inline: true },
          ]
        );
      }

      // 3. Telegram Webhook
      if (settings.enableTelegramWebhook && settings.telegramBotToken && settings.telegramChatId) {
        const tgText = `*DeltaHarvest Alert: ${t.symbol}*\nPrice: $${t.spot_price.toFixed(2)}\nTriggers: ${triggers.join(', ')}`;
        sendTelegramAlert(settings.telegramBotToken, settings.telegramChatId, tgText);
      }
    }
  }

  if (alertMessages.length > 0) {
    saveAlertSettings({ ...settings, lastDispatchedTime: new Date().toISOString() });
  }

  return {
    dispatchedCount: alertMessages.length,
    messages: alertMessages,
  };
}
