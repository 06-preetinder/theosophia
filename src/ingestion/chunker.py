"""
Conversation Chunker
Groups individual asynchronous Slack messages into coherent contextual dialogue blocks.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.ingestion.message_store import RawMessage, MessageStore

class ConversationChunk(BaseModel):
    chunk_id: str
    channel_id: str
    channel_name: Optional[str] = None
    thread_ts: Optional[float] = None
    participants: List[str]
    start_timestamp: float
    end_timestamp: float
    text: str
    message_count: int
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Chunker:
    def __init__(self, time_gap_threshold_seconds: float = 1800.0): # 30 mins window for unthreaded chats
        self.time_gap_threshold = time_gap_threshold_seconds

    def chunk_messages(self, messages: List[RawMessage]) -> List[ConversationChunk]:
        """
        Takes raw chronological messages and segments them into coherent chunks:
        1. Threaded conversations are grouped by thread_ts.
        2. Non-threaded channel messages are grouped by time-proximity windows.
        """
        if not messages:
            return []

        threaded_groups: Dict[float, List[RawMessage]] = {}
        unthreaded: List[RawMessage] = []

        for msg in messages:
            if msg.thread_ts is not None:
                if msg.thread_ts not in threaded_groups:
                    threaded_groups[msg.thread_ts] = []
                threaded_groups[msg.thread_ts].append(msg)
            else:
                unthreaded.append(msg)

        chunks: List[ConversationChunk] = []

        # 1. Process Threaded Groups
        for thread_ts, thread_msgs in threaded_groups.items():
            sorted_msgs = sorted(thread_msgs, key=lambda x: x.timestamp)
            chunk = self._build_chunk_from_sequence(
                messages=sorted_msgs,
                chunk_id=f"thread_{sorted_msgs[0].channel_id}_{thread_ts}",
                thread_ts=thread_ts
            )
            chunks.append(chunk)

        # 2. Process Unthreaded Messages via sliding time-window
        if unthreaded:
            sorted_unthreaded = sorted(unthreaded, key=lambda x: x.timestamp)
            current_window: List[RawMessage] = [sorted_unthreaded[0]]

            for next_msg in sorted_unthreaded[1:]:
                prev_msg = current_window[-1]
                time_diff = next_msg.timestamp - prev_msg.timestamp
                same_channel = next_msg.channel_id == prev_msg.channel_id

                if same_channel and time_diff <= self.time_gap_threshold:
                    current_window.append(next_msg)
                else:
                    chunks.append(self._build_chunk_from_sequence(
                        messages=current_window,
                        chunk_id=f"unthreaded_{current_window[0].channel_id}_{current_window[0].timestamp}"
                    ))
                    current_window = [next_msg]

            if current_window:
                chunks.append(self._build_chunk_from_sequence(
                    messages=current_window,
                    chunk_id=f"unthreaded_{current_window[0].channel_id}_{current_window[0].timestamp}"
                ))

        return chunks

    def _build_chunk_from_sequence(self, messages: List[RawMessage], chunk_id: str, thread_ts: Optional[float] = None) -> ConversationChunk:
        participants = sorted(list({m.user_name or m.user_id for m in messages}))
        
        # Formulate dialogue script representation
        formatted_lines = []
        for m in messages:
            speaker = m.user_name or m.user_id
            formatted_lines.append(f"[{speaker}]: {m.text.strip()}")
            
        full_text = "\n".join(formatted_lines)

        return ConversationChunk(
            chunk_id=chunk_id,
            channel_id=messages[0].channel_id,
            channel_name=messages[0].channel_name,
            thread_ts=thread_ts,
            participants=participants,
            start_timestamp=messages[0].timestamp,
            end_timestamp=messages[-1].timestamp,
            text=full_text,
            message_count=len(messages),
            metadata={
                "source_system": messages[0].source_system,
                "first_message_id": messages[0].message_id,
                "last_message_id": messages[-1].message_id
            }
        )
