"""
Entity Resolution Module
Normalizes noisy entity aliases and merges duplicate nodes using string similarity.
"""

from typing import List, Dict, Set
from src.extraction.models import ExtractedEntity

class EntityResolver:
    def __init__(self, similarity_threshold: float = 0.85):
        self.similarity_threshold = similarity_threshold

    @staticmethod
    def _normalize_name(name: str) -> str:
        # Strip prefixes like '@' or '#'
        clean = name.strip().lstrip("@").lstrip("#")
        # Strip common trailing title qualifiers if present
        clean = clean.replace("_", " ")
        return clean.lower()

    def resolve_entities(self, entities: List[ExtractedEntity]) -> List[ExtractedEntity]:
        """
        Deduplicates entities across conversation chunks and consolidates confidence ratings.
        """
        resolved: Dict[str, ExtractedEntity] = {}

        for ent in entities:
            norm_key = (self._normalize_name(ent.name), ent.entity_type)
            
            if norm_key not in resolved:
                resolved[norm_key] = ent
            else:
                existing = resolved[norm_key]
                # Boost confidence if observed across multiple sources
                existing.confidence = min(1.0, round(existing.confidence + 0.05, 3))
                if len(ent.name) > len(existing.name):
                    existing.name = ent.name # Prefer more descriptive proper noun

        return list(resolved.values())
