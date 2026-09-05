#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Screener Agent Registry
Manages registration, discovery, and execution of multi-source screener agents.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Type

from .base_agent import BaseScreenerAgent
from .barchart_agent import BarchartScreenerAgent
from .barchart_custom_agent import BarchartCustomWatchlistAgent
from .marketchameleon_agent import MarketChameleonScreenerAgent


class ScreenerRegistry:
    """Registry of available screener source agents."""

    _agents: Dict[str, Type[BaseScreenerAgent]] = {
        "barchart": BarchartScreenerAgent,
        "barchart_custom": BarchartCustomWatchlistAgent,
        "marketchameleon": MarketChameleonScreenerAgent,
    }

    @classmethod
    def register(cls, source_id: str, agent_cls: Type[BaseScreenerAgent]) -> None:
        """Register a new screener source agent class."""
        cls._agents[source_id.lower()] = agent_cls

    @classmethod
    def get_agent(cls, source_id: str, target_url: Optional[str] = None) -> BaseScreenerAgent:
        """Instantiate an agent by its source identifier."""
        sid = source_id.lower()
        if sid not in cls._agents:
            available = list(cls._agents.keys())
            raise ValueError(f"Unknown screener source: '{source_id}'. Available sources: {available}")
        return cls._agents[sid](target_url=target_url)

    @classmethod
    def list_sources(cls) -> List[Dict[str, str]]:
        """List metadata for all registered screener sources."""
        result = []
        for sid, agent_cls in cls._agents.items():
            result.append({
                "source_id": sid,
                "display_name": agent_cls.display_name,
                "description": agent_cls.description,
                "default_url": agent_cls.default_url,
            })
        return result
