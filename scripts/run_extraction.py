"""
End-to-End Extraction Runner Script
Ingests raw conversation chunks -> Extracts Domain Entities & Relations -> Resolves Knowledge.
"""

from src.config import settings
from src.ingestion.message_store import MessageStore
from src.ingestion.chunker import Chunker
from src.extraction.extractor import EntityExtractor
from src.extraction.entity_resolver import EntityResolver

def run_extraction():
    print("[*] Launching Theosophia Domain Knowledge Extraction Pipeline...")
    store = MessageStore(settings.SQLITE_DB_PATH)
    messages = store.get_all_messages()
    print(f"[*] Loaded {len(messages)} stored messages from SQLite.")

    chunker = Chunker()
    chunks = chunker.chunk_messages(messages)
    print(f"[*] Grouped messages into {len(chunks)} contextual conversation chunks.")

    extractor = EntityExtractor(use_ml_model=False)
    all_raw_entities = []
    all_raw_relations = []

    for chunk in chunks:
        res = extractor.extract_from_chunk(chunk)
        all_raw_entities.extend(res.entities)
        all_raw_relations.extend(res.relations)

    print(f"[*] Extracted {len(all_raw_entities)} raw entities and {len(all_raw_relations)} relationships.")

    resolver = EntityResolver()
    unique_entities = resolver.resolve_entities(all_raw_entities)

    print(f"\n[+] RESOLVED DOMAIN ENTITIES ({len(unique_entities)} canonical nodes):")
    for e in unique_entities:
        print(f"    • [{e.entity_type.upper()}] '{e.name}' (Confidence: {e.confidence})")

    print(f"\n[+] DISCOVERED DOMAIN RELATIONSHIPS ({len(all_raw_relations)} edges):")
    for r in all_raw_relations:
        print(f"    • ({r.source_entity}) -[:{r.relation_type}]-> ({r.target_entity}) [Confidence: {r.confidence}]")

if __name__ == "__main__":
    run_extraction()
