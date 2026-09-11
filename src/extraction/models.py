"""
Entity and Relation Models
Represent atomic structured domain knowledge extracted from company dialogue.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ExtractedEntity(BaseModel):
    name: str
    entity_type: str  # e.g., 'person', 'process', 'policy', 'threshold', 'channel'
    confidence: float
    source_chunk_id: str
    context_snippet: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)

class ExtractedRelation(BaseModel):
    source_entity: str
    relation_type: str  # e.g., 'requires', 'escalates_to', 'owns', 'defines_threshold'
    target_entity: str
    confidence: float
    source_chunk_id: str
    context_snippet: Optional[str] = None

class ExtractionResult(BaseModel):
    chunk_id: str
    entities: List[ExtractedEntity] = Field(default_factory=list)
    relations: List[ExtractedRelation] = Field(default_factory=list)
    extraction_source: str = "gliner_fallback"
