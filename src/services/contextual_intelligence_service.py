# -*- coding: utf-8 -*-
"""
Contextual Intelligence & Multi-Source Sentiment Enricher Service.

Implements the multi-source enrichment pipeline from enhance/:
- Wall St Analyst consensus, price targets (min/mean/high), and recommendation keys
- Corporate financial ratios, dividend yields, ex-dividend dates, and P/E multiples
- Polymarket Gamma API & Manifold Markets active binary prediction event odds
- StockTwits message stream Bullish/Bearish ratios
- Reddit /r/WallStreetBets trending rank and 24H comment velocity
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import requests

logger = logging.getLogger(__name__)


def get_analyst_and_news_context(symbol: str) -> Dict[str, Any]:
    """Fetches Wall St analyst consensus, price targets, corporate actions, and news via yfinance."""
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        info = getattr(ticker, "info", {}) or {}

        # 1. Analyst Price Targets & Consensus
        targets: Dict[str, Any] = {
            "recommendation": "N/A",
            "mean": None,
            "high": None,
            "low": None,
            "number_of_analysts": 0,
        }
        try:
            raw_targets = getattr(ticker, "analyst_price_targets", None)
            if raw_targets is not None and isinstance(raw_targets, dict):
                targets = {
                    "current": raw_targets.get("current"),
                    "mean": raw_targets.get("mean"),
                    "high": raw_targets.get("high"),
                    "low": raw_targets.get("low"),
                    "recommendation": str(info.get("recommendationKey", "N/A")).upper(),
                    "number_of_analysts": info.get("numberOfAnalystOpinions", 0),
                }
            elif "targetMeanPrice" in info:
                targets = {
                    "current": info.get("currentPrice"),
                    "mean": info.get("targetMeanPrice"),
                    "high": info.get("targetHighPrice"),
                    "low": info.get("targetLowPrice"),
                    "recommendation": str(info.get("recommendationKey", "N/A")).upper(),
                    "number_of_analysts": info.get("numberOfAnalystOpinions", 0),
                }
        except Exception as e:
            logger.debug(f"[AnalystContext] Error parsing targets for {symbol}: {e}")

        # 2. Corporate Actions & Financials
        corporate_actions = {
            "dividend_rate": info.get("dividendRate", 0.0) or 0.0,
            "dividend_yield": info.get("dividendYield", 0.0) or 0.0,
            "ex_dividend_date": info.get("exDividendDate", None),
            "payout_ratio": info.get("payoutRatio", None),
            "trailing_pe": info.get("trailingPE", None),
            "forward_pe": info.get("forwardPE", None),
        }

        # 3. News Headlines
        news_items = []
        try:
            raw_news = getattr(ticker, "news", []) or []
            for item in raw_news[:5]:
                title = item.get("title") or (item.get("content", {}) if isinstance(item.get("content"), dict) else {}).get("title")
                link = item.get("link") or (item.get("content", {}) if isinstance(item.get("content"), dict) else {}).get("canonicalUrl", {}).get("url")
                publisher = item.get("publisher") or (item.get("content", {}) if isinstance(item.get("content"), dict) else {}).get("provider", {}).get("displayName")
                if title:
                    news_items.append({
                        "title": title,
                        "link": link or "#",
                        "publisher": publisher or "Financial News",
                    })
        except Exception as e:
            logger.debug(f"[AnalystContext] Error parsing news for {symbol}: {e}")

        return {
            "analyst_targets": targets,
            "corporate_actions": corporate_actions,
            "news": news_items,
        }
    except Exception as e:
        logger.warning(f"[AnalystContext] General error for {symbol}: {e}")
        return {
            "analyst_targets": {"recommendation": "N/A", "mean": None, "high": None, "low": None},
            "corporate_actions": {},
            "news": [],
        }


def get_prediction_market_odds(symbol: str) -> List[Dict[str, Any]]:
    """Queries Polymarket Gamma API and Manifold Markets for active binary events affecting the ticker."""
    events: List[Dict[str, Any]] = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    clean_sym = symbol.strip().upper()

    # 1. Polymarket Public Gamma API
    try:
        poly_url = f"https://gamma-api.polymarket.com/events?limit=3&active=true&closed=false&q={clean_sym}"
        r = requests.get(poly_url, headers=headers, timeout=5)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list):
                for ev in data:
                    title = ev.get("title")
                    markets = ev.get("markets", [])
                    if markets and title:
                        outcome_prices = markets[0].get("outcomePrices")
                        yes_prob = "N/A"
                        if outcome_prices:
                            try:
                                if isinstance(outcome_prices, list) and len(outcome_prices) > 0:
                                    yes_prob = f"{float(outcome_prices[0]) * 100:.1f}%"
                            except Exception:
                                pass
                        events.append({
                            "source": "Polymarket",
                            "event": title,
                            "probability": yes_prob,
                            "url": f"https://polymarket.com/event/{ev.get('slug', '')}",
                        })
    except Exception as e:
        logger.debug(f"[PredictionMarkets] Polymarket fetch failed for {clean_sym}: {e}")

    # 2. Manifold Markets Public API
    try:
        manifold_url = f"https://api.manifold.markets/v0/search-markets?term={clean_sym}&limit=3&filter=open"
        r2 = requests.get(manifold_url, headers=headers, timeout=5)
        if r2.status_code == 200:
            data = r2.json()
            if isinstance(data, list):
                for m in data:
                    prob = f"{float(m.get('probability', 0)) * 100:.1f}%" if "probability" in m else "N/A"
                    events.append({
                        "source": "Manifold",
                        "event": m.get("question", f"{clean_sym} Market Question"),
                        "probability": prob,
                        "url": m.get("url", "https://manifold.markets"),
                    })
    except Exception as e:
        logger.debug(f"[PredictionMarkets] Manifold fetch failed for {clean_sym}: {e}")

    return events[:4]


def get_social_and_forum_sentiment(symbol: str) -> Dict[str, Any]:
    """Fetches retail sentiment from StockTwits and Reddit/WallStreetBets trackers."""
    sentiment_summary = {
        "stocktwits_sentiment": "Neutral",
        "stocktwits_bullish_pct": 50.0,
        "reddit_rank": "N/A",
        "reddit_sentiment": "Neutral",
        "social_volume_flag": "Normal",
    }
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    clean_sym = symbol.strip().upper()

    # 1. StockTwits Public Stream API
    try:
        st_url = f"https://api.stocktwits.com/api/2/streams/symbol/{clean_sym}.json"
        r = requests.get(st_url, headers=headers, timeout=5)
        if r.status_code == 200:
            st_data = r.json()
            messages = st_data.get("messages", [])
            bullish, bearish = 0, 0
            for msg in messages:
                sent = (
                    msg.get("entities", {})
                    .get("sentiment", {})
                    .get("basic", "")
                    .lower()
                )
                if sent == "bullish":
                    bullish += 1
                elif sent == "bearish":
                    bearish += 1

            total = bullish + bearish
            if total > 0:
                bull_pct = (bullish / total) * 100
                sentiment_summary["stocktwits_bullish_pct"] = round(bull_pct, 1)
                sentiment_summary["stocktwits_sentiment"] = (
                    "Bullish"
                    if bull_pct >= 60
                    else ("Bearish" if bull_pct <= 40 else "Neutral")
                )
    except Exception as e:
        logger.debug(f"[SocialSentiment] StockTwits fetch failed for {clean_sym}: {e}")

    # 2. Reddit / WallStreetBets Trending API (Tradestie Public Endpoint)
    try:
        reddit_url = "https://tradestie.com/api/v1/apps/reddit"
        r_reddit = requests.get(reddit_url, headers=headers, timeout=5)
        if r_reddit.status_code == 200:
            reddit_list = r_reddit.json()
            if isinstance(reddit_list, list):
                for item in reddit_list:
                    if str(item.get("ticker", "")).upper() == clean_sym:
                        rank_idx = reddit_list.index(item) + 1
                        sentiment_summary["reddit_rank"] = f"#{rank_idx} on WSB"
                        sentiment_summary["reddit_sentiment"] = item.get("sentiment", "Neutral")
                        sentiment_summary["social_volume_flag"] = f"{item.get('no_of_comments', 0)} comments today"
                        break
    except Exception as e:
        logger.debug(f"[SocialSentiment] Reddit WSB fetch failed for {clean_sym}: {e}")

    return sentiment_summary


def enrich_ticker_payload(symbol: str) -> Dict[str, Any]:
    """Master context function consolidating all layers for a security."""
    analyst_news = get_analyst_and_news_context(symbol)
    prediction_odds = get_prediction_market_odds(symbol)
    social_sentiment = get_social_and_forum_sentiment(symbol)

    return {
        "symbol": symbol.strip().upper(),
        "analyst_intelligence": analyst_news.get("analyst_targets", {}),
        "corporate_actions": analyst_news.get("corporate_actions", {}),
        "news_feed": analyst_news.get("news", []),
        "prediction_markets": prediction_odds,
        "social_sentiment": social_sentiment,
        "enriched_at": datetime.now(timezone.utc).isoformat(),
    }
