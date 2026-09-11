import pytest
from pathlib import Path
from src.ingestion.message_store import MessageStore, RawMessage
from src.ingestion.chunker import Chunker

def test_message_store_lifecycle(tmp_path: Path):
    db_path = tmp_path / "test_store.db"
    store = MessageStore(db_path)

    msg1 = RawMessage(
        message_id="msg_1",
        channel_id="C01",
        channel_name="general",
        user_id="U01",
        user_name="Alice",
        text="Hello world",
        timestamp=1000.0,
        thread_ts=None
    )
    msg2 = RawMessage(
        message_id="msg_2",
        channel_id="C01",
        channel_name="general",
        user_id="U02",
        user_name="Bob",
        text="Hello Alice!",
        timestamp=1010.0,
        thread_ts=1000.0
    )

    store.save_message(msg1)
    store.save_message(msg2)

    assert store.count() == 2
    channel_msgs = store.get_messages_by_channel("C01")
    assert len(channel_msgs) == 2

    chunker = Chunker()
    chunks = chunker.chunk_messages(channel_msgs)
    assert len(chunks) >= 1
    assert any("Bob" in c.participants for c in chunks)
