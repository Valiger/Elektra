"""
insights_schema.py — Pydantic schemas for the 8-graph insights endpoint.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel


class GraphSeries(BaseModel):
    values:    List[float]
    aggregate: float


class InsightsResponse(BaseModel):
    filter:  str
    periods: List[str]
    graphs:  Dict[str, GraphSeries]
