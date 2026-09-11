"""
Slack Ingestion Connector
Handles live Slack API extraction as well as offline/simulated data feeds.
"""

import time
import requests
from typing import List, Dict, Any, Optional
from src.ingestion.message_store import RawMessage, MessageStore

class SlackConnector:
    BASE_URL = "https://slack.com/api"

    def __init__(self, bot_token: str, message_store: MessageStore):
        self.bot_token = bot_token
        self.store = message_store
        self.headers = {
            "Authorization": f"Bearer {self.bot_token}",
            "Content-Type": "application/json; charset=utf-8"
        }

    def list_channels(self, types: str = "public_channel,private_channel") -> List[Dict[str, Any]]:
        """Fetch list of accessible Slack channels."""
        if not self.bot_token or self.bot_token.startswith("xoxb-your"):
            return []

        url = f"{self.BASE_URL}/conversations.list"
        params = {"types": types, "exclude_archived": True, "limit": 200}
        response = requests.get(url, headers=self.headers, params=params)
        data = response.json()
        if not data.get("ok"):
            raise RuntimeError(f"Slack API error: {data.get('error')}")
        return data.get("channels", [])

    def fetch_channel_history(self, channel_id: str, channel_name: Optional[str] = None, limit: int = 500) -> List[RawMessage]:
        """Fetch messages from a channel and store them."""
        if not self.bot_token or self.bot_token.startswith("xoxb-your"):
            return []

        url = f"{self.BASE_URL}/conversations.history"
        messages: List[RawMessage] = []
        cursor = None

        while len(messages) < limit:
            params = {
                "channel": channel_id,
                "limit": min(100, limit - len(messages))
            }
            if cursor:
                params["cursor"] = cursor

            resp = requests.get(url, headers=self.headers, params=params)
            data = resp.json()

            if not data.get("ok"):
                if data.get("error") == "ratelimited":
                    time.sleep(2)
                    continue
                raise RuntimeError(f"Slack error in channel {channel_id}: {data.get('error')}")

            raw_msgs = data.get("messages", [])
            for m in raw_msgs:
                # Discard join/leave system noise
                if m.get("subtype") in ["channel_join", "channel_leave"]:
                    continue

                ts = float(m.get("ts", 0))
                thread_ts = float(m["thread_ts"]) if "thread_ts" in m else None

                raw_msg = RawMessage(
                    message_id=f"{channel_id}_{m.get('ts')}",
                    channel_id=channel_id,
                    channel_name=channel_name,
                    user_id=m.get("user", "unknown"),
                    user_name=m.get("username"),
                    text=m.get("text", ""),
                    timestamp=ts,
                    thread_ts=thread_ts,
                    source_system="slack"
                )
                messages.append(raw_msg)

            if not data.get("has_more"):
                break
            cursor = data.get("response_metadata", {}).get("next_cursor")
            if not cursor:
                break

        # Persist batch to store
        self.store.save_batch(messages)
        return messages

    def ingest_mock_conversation(self, channel_id: str, channel_name: str, conversation_script: List[Dict[str, Any]]) -> List[RawMessage]:
        """
        Helper for testing, synthetic generation, and demos when live Slack is disconnected.
        Accepts structured conversation turns.
        """
        messages: List[RawMessage] = []
        base_time = time.time() - (len(conversation_script) * 120)
        thread_id = None

        for idx, turn in enumerate(conversation_script):
            msg_ts = base_time + (idx * 60)
            is_thread_child = turn.get("is_reply", False)
            if idx == 0 and turn.get("has_replies", False):
                thread_id = msg_ts

            msg = RawMessage(
                message_id=f"{channel_id}_{msg_ts}",
                channel_id=channel_id,
                channel_name=channel_name,
                user_id=turn.get("user_id", f"U{idx:03d}"),
                user_name=turn.get("user_name", "TeamMember"),
                text=turn.get("text", ""),
                timestamp=msg_ts,
                thread_ts=thread_id if is_thread_child else None,
                source_system="slack_simulation"
            )
            messages.append(msg)

        self.store.save_batch(messages)
        return messages
