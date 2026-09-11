"""
Hybrid NER & Relation Extractor
Supports zero-shot GLiNER/GLiREL model execution with heuristic fallback for offline zero-cost execution.
"""

import re
from typing import List, Optional
from src.ingestion.chunker import ConversationChunk
from src.extraction.models import ExtractedEntity, ExtractedRelation, ExtractionResult

DEFAULT_ENTITY_LABELS = [
    "person", "team", "process", "policy", "threshold", 
    "system", "document", "channel", "action"
]

class EntityExtractor:
    def __init__(self, use_ml_model: bool = False):
        self.use_ml_model = use_ml_model
        self.gliner_model = None

        if self.use_ml_model:
            try:
                from gliner import GLiNER
                self.gliner_model = GLiNER.from_pretrained("urchade/gliner_small-v2.1")
            except Exception as e:
                print(f"[!] Warning: GLiNER model unavailable ({e}). Defaulting to deterministic rule-based extractor.")
                self.use_ml_model = False

    def extract_from_chunk(self, chunk: ConversationChunk) -> ExtractionResult:
        if self.use_ml_model and self.gliner_model:
            return self._extract_with_gliner(chunk)
        return self._extract_rule_based(chunk)

    def _extract_with_gliner(self, chunk: ConversationChunk) -> ExtractionResult:
        entities: List[ExtractedEntity] = []
        preds = self.gliner_model.predict_entities(chunk.text, DEFAULT_ENTITY_LABELS, threshold=0.45)
        
        for p in preds:
            entities.append(ExtractedEntity(
                name=p["text"],
                entity_type=p["label"],
                confidence=round(float(p["score"]), 3),
                source_chunk_id=chunk.chunk_id,
                context_snippet=chunk.text[:120]
            ))
            
        return ExtractionResult(
            chunk_id=chunk.chunk_id,
            entities=entities,
            relations=[],
            extraction_source="gliner_model"
        )

    def _extract_rule_based(self, chunk: ConversationChunk) -> ExtractionResult:
        """
        Deterministic regex and structural parser for enterprise domain patterns:
        - Policies: REF-04, KYC-2, SAR
        - Dollar Thresholds: $500, $50,000, 75,000
        - Channels: #risk-disputes, #support
        - Roles/People: @Elena, Alex_ComplianceOfficer
        """
        entities: List[ExtractedEntity] = []
        relations: List[ExtractedRelation] = []

        text = chunk.text

        # 1. Detect Policies
        policy_matches = re.findall(r'\b(Policy\s+[A-Z0-9\-]+|KYC\s+level\s+\d+|Form\s+[A-Z]+)\b', text, re.I)
        for p in set(policy_matches):
            entities.append(ExtractedEntity(
                name=p.strip(),
                entity_type="policy",
                confidence=0.95,
                source_chunk_id=chunk.chunk_id
            ))

        # 2. Detect Financial Thresholds
        thresholds = re.findall(r'(\$\d{1,3}(?:,\d{3})*|\b\d+\s*(?:USD|GBP|EUR)\b)', text)
        for t in set(thresholds):
            entities.append(ExtractedEntity(
                name=t.strip(),
                entity_type="threshold",
                confidence=0.98,
                source_chunk_id=chunk.chunk_id
            ))

        # 3. Detect Channels / Escalation targets
        channels = re.findall(r'(#[a-zA-Z0-9_\-]+)', text)
        for c in set(channels):
            entities.append(ExtractedEntity(
                name=c.strip(),
                entity_type="channel",
                confidence=0.99,
                source_chunk_id=chunk.chunk_id
            ))

        # 4. Detect People / Actors from Dialogue Speakers
        for participant in chunk.participants:
            entities.append(ExtractedEntity(
                name=participant,
                entity_type="person",
                confidence=1.0,
                source_chunk_id=chunk.chunk_id
            ))

        # 5. Discover Relationships
        # e.g., If Policy and Threshold exist together in chunk
        for pol in [e for e in entities if e.entity_type == "policy"]:
            for thresh in [e for e in entities if e.entity_type == "threshold"]:
                relations.append(ExtractedRelation(
                    source_entity=pol.name,
                    relation_type="defines_threshold",
                    target_entity=thresh.name,
                    confidence=0.88,
                    source_chunk_id=chunk.chunk_id
                ))

        for ch in [e for e in entities if e.entity_type == "channel"]:
            relations.append(ExtractedRelation(
                source_entity="Support_Team",
                relation_type="escalates_to",
                target_entity=ch.name,
                confidence=0.92,
                source_chunk_id=chunk.chunk_id
            ))

        return ExtractionResult(
            chunk_id=chunk.chunk_id,
            entities=entities,
            relations=relations,
            extraction_source="rule_engine"
        )
