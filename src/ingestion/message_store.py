"""
Message Storage Layer
SQLite backed structured storage for raw ingested conversations and messages.
"""

import sqlite3
from typing import List, Dict, Any, Optional
from pathlib import Path
from pydantic import BaseModel, Field

class RawMessage(BaseModel):
    message_id: str
    channel_id: str
    channel_name: Optional[str] = None
    user_id: str
    user_name: Optional[str] = None
    text: str
    timestamp: float
    thread_ts: Optional[float] = None
    source_system: str = "slack"
    raw_payload: Optional[str] = None

class MessageStore:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    message_id TEXT PRIMARY KEY,
                    channel_id TEXT NOT NULL,
                    channel_name TEXT,
                    user_id TEXT NOT NULL,
                    user_name TEXT,
                    text TEXT NOT NULL,
                    timestamp REAL NOT NULL,
                    thread_ts REAL,
                    source_system TEXT NOT NULL DEFAULT 'slack',
                    raw_payload TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_ts);
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
            """)
            conn.commit()

    def save_message(self, msg: RawMessage) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO messages (
                    message_id, channel_id, channel_name, user_id, user_name,
                    text, timestamp, thread_ts, source_system, raw_payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                msg.message_id, msg.channel_id, msg.channel_name, msg.user_id,
                msg.user_name, msg.text, msg.timestamp, msg.thread_ts,
                msg.source_system, msg.raw_payload
            ))
            conn.commit()
            return True

    def save_batch(self, messages: List[RawMessage]) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            rows = [
                (
                    m.message_id, m.channel_id, m.channel_name, m.user_id,
                    m.user_name, m.text, m.timestamp, m.thread_ts,
                    m.source_system, m.raw_payload
                )
                for m in messages
            ]
            cursor.executemany("""
                INSERT OR REPLACE INTO messages (
                    message_id, channel_id, channel_name, user_id, user_name,
                    text, timestamp, thread_ts, source_system, raw_payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows)
            conn.commit()
            return len(rows)

    def get_messages_by_channel(self, channel_id: str, limit: int = 1000) -> List[RawMessage]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM messages 
                WHERE channel_id = ? 
                ORDER BY timestamp ASC 
                LIMIT ?
            """, (channel_id, limit))
            return [RawMessage(**dict(row)) for row in cursor.fetchall()]

    def get_threads(self, channel_id: Optional[str] = None) -> List[float]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT DISTINCT thread_ts FROM messages WHERE thread_ts IS NOT NULL"
            params = []
            if channel_id:
                query += " AND channel_id = ?"
                params.append(channel_id)
            cursor.execute(query, params)
            return [row[0] for row in cursor.fetchall()]

    def get_thread_messages(self, thread_ts: float) -> List[RawMessage]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM messages 
                WHERE thread_ts = ? OR (timestamp = ? AND thread_ts IS NULL)
                ORDER BY timestamp ASC
            """, (thread_ts, thread_ts))
            return [RawMessage(**dict(row)) for row in cursor.fetchall()]

    def get_all_messages(self, limit: int = 10000) -> List[RawMessage]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM messages ORDER BY timestamp ASC LIMIT ?", (limit,))
            return [RawMessage(**dict(row)) for row in cursor.fetchall()]

    def count(self) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM messages")
            return cursor.fetchone()[0]
