#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Base Screener Agent Architecture
Defines the abstract interface and standard record schema for multi-source stock screener ingestion.
Supports Barchart, MarketChameleon, and arbitrary future screener sources.
"""

from __future__ import annotations

import csv
import datetime
import io
import json
import os
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


@dataclass
class ScreenerRecord:
    symbol: str
    name: str
    last_price: float
    price_change: float
    percent_change: float
    opinion: str  # e.g., "100% Buy", "80% Buy", "Hold", "Sell"
    opinion_pct: float  # e.g., 100.0, 80.0, -40.0
    opinion_previous: str = ""
    opinion_last_week: str = ""
    opinion_last_month: str = ""
    has_options: bool = True
    has_weekly_options: bool = True
    signal_strength: str = "Strong"
    signal_direction: str = "Bullish"
    source: str = "barchart"
    source_url: str = ""
    updated_at: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    recommended_strategy: str = "BULL_PUT_SPREAD"
    notes: str = ""
    extra_fields: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        return d


@dataclass
class ScreenerDataset:
    source_id: str
    source_name: str
    source_url: str
    timestamp: str
    total_count: int
    records: List[ScreenerRecord]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "source_url": self.source_url,
            "timestamp": self.timestamp,
            "total_count": self.total_count,
            "records": [r.to_dict() for r in self.records],
        }


class BaseScreenerAgent(ABC):
    """Abstract base class for all screener ingestion agents."""

    source_id: str = "base"
    display_name: str = "Base Screener"
    description: str = "Base screener provider"
    default_url: str = ""

    def __init__(self, target_url: Optional[str] = None):
        self.target_url = target_url or self.default_url

    @abstractmethod
    def fetch_records(self, limit: int = 100) -> List[ScreenerRecord]:
        """Fetch live records from the screener data source."""
        pass

    @abstractmethod
    def parse_csv(self, csv_data: Union[str, Path, io.StringIO]) -> List[ScreenerRecord]:
        """Parse raw CSV data or file path into standard ScreenerRecord objects."""
        pass

    def export_csv(self, records: List[ScreenerRecord], output_path: Union[str, Path]) -> str:
        """Export standardized screener records to a CSV file."""
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        fieldnames = [
            "symbol",
            "name",
            "last_price",
            "price_change",
            "percent_change",
            "opinion",
            "opinion_pct",
            "opinion_previous",
            "opinion_last_week",
            "opinion_last_month",
            "has_options",
            "has_weekly_options",
            "signal_strength",
            "signal_direction",
            "recommended_strategy",
            "source",
            "updated_at",
        ]

        with open(out, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for r in records:
                row = r.to_dict()
                writer.writerow(row)

        return str(out.resolve())

    def save_dataset_json(
        self, records: List[ScreenerRecord], output_path: Union[str, Path]
    ) -> str:
        """Save standard JSON payload for frontend consumption."""
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        dataset = ScreenerDataset(
            source_id=self.source_id,
            source_name=self.display_name,
            source_url=self.target_url,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            total_count=len(records),
            records=records,
        )

        with open(out, "w", encoding="utf-8") as f:
            json.dump(dataset.to_dict(), f, indent=2, ensure_ascii=False)

        return str(out.resolve())
