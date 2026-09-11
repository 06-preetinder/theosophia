import pytest
from src.ingestion.chunker import ConversationChunk
from src.extraction.extractor import EntityExtractor
from src.extraction.entity_resolver import EntityResolver

def test_extraction_rules():
    extractor = EntityExtractor(use_ml_model=False)
    chunk = ConversationChunk(
        chunk_id="chk_test_1",
        channel_id="C01",
        participants=["Sarah_SupportLead", "Alex_Compliance"],
        start_timestamp=100.0,
        end_timestamp=200.0,
        text="[Alex_Compliance]: Follow Policy REF-04 strictly. Any refund over $500 escalates to #risk-disputes.",
        message_count=1
    )

    result = extractor.extract_from_chunk(chunk)
    entity_names = [e.name for e in result.entities]

    assert any("Policy REF-04" in name for name in entity_names)
    assert any("$500" in name for name in entity_names)
    assert any("#risk-disputes" in name for name in entity_names)

def test_entity_resolver_dedup():
    from src.extraction.models import ExtractedEntity
    resolver = EntityResolver()
    
    e1 = ExtractedEntity(name="Alex_Compliance", entity_type="person", confidence=0.8, source_chunk_id="c1")
    e2 = ExtractedEntity(name="@alex_compliance", entity_type="person", confidence=0.8, source_chunk_id="c2")

    resolved = resolver.resolve_entities([e1, e2])
    assert len(resolved) == 1
    assert resolved[0].confidence > 0.8
