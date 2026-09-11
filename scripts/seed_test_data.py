"""
Seed Realistic Enterprise Data Script
Simulates authentic fintech customer support, compliance, and refund operational conversations.
"""

from pathlib import Path
from src.config import settings
from src.ingestion.message_store import MessageStore
from src.ingestion.slack_connector import SlackConnector
from src.ingestion.chunker import Chunker

FINTECH_CONVERSATIONS = [
    {
        "channel_id": "C_SUPPORT_01",
        "channel_name": "support-tier2-refunds",
        "dialogue": [
            {
                "user_id": "U_SARAH",
                "user_name": "Sarah_SupportLead",
                "text": "Hey team, quick refresher on chargeback and refund thresholds for merchants on Starter Tier. Customer #8921 is asking for an immediate $350 refund on a disputed gateway charge.",
                "has_replies": True
            },
            {
                "user_id": "U_ALEX",
                "user_name": "Alex_ComplianceOfficer",
                "text": "According to Policy REF-04: If the refund amount is under $500, tier-2 support agents can directly approve via the Stripe dashboard without compliance sign-off, provided the account has zero active fraud flags.",
                "is_reply": True
            },
            {
                "user_id": "U_SARAH",
                "user_name": "Sarah_SupportLead",
                "text": "Got it. What if the transaction is over $500 or in GBP/EUR?",
                "is_reply": True
            },
            {
                "user_id": "U_ALEX",
                "user_name": "Alex_ComplianceOfficer",
                "text": "Over $500 requires written sign-off from Head of Risk (@Elena) or an automated risk score strictly below 0.25. If there's an active chargeback ticket, escalate to #risk-disputes immediately.",
                "is_reply": True
            },
            {
                "user_id": "U_ELENA",
                "user_name": "Elena_HeadOfRisk",
                "text": "Confirmed. Always check KYC level 2 verification before releasing funds. Never bypass KYC.",
                "is_reply": True
            }
        ]
    },
    {
        "channel_id": "C_COMPLIANCE_02",
        "channel_name": "aml-alert-triage",
        "dialogue": [
            {
                "user_id": "U_MARCUS",
                "user_name": "Marcus_Analyst",
                "text": "Alert ALT-9823 triggered on wire transfer of $75,000 to offshore jurisdiction. How do we escalate this?",
                "has_replies": True
            },
            {
                "user_id": "U_ALEX",
                "user_name": "Alex_ComplianceOfficer",
                "text": "Any cross-border transaction over $50,000 must trigger a Form SAR draft. Freeze the payout batch in Postgres using `/scripts/freeze_transfer.py` and notify Marcus and Elena within 15 minutes.",
                "is_reply": True
            },
            {
                "user_id": "U_MARCUS",
                "user_name": "Marcus_Analyst",
                "text": "Freezing done. Generating transaction provenance report now.",
                "is_reply": True
            }
        ]
    },
    {
        "channel_id": "C_INCIDENTS_03",
        "channel_name": "tech-incident-war-room",
        "dialogue": [
            {
                "user_id": "U_DEV_DAVE",
                "user_name": "Dave_SRE",
                "text": "Payment gateway latency spiking above 2500ms on AWS us-east-1. Checking Redis circuit breaker."
            },
            {
                "user_id": "U_SARAH",
                "user_name": "Sarah_SupportLead",
                "text": "Customers are complaining about timed-out checkout screens. Should we switch to secondary processor?"
            },
            {
                "user_id": "U_DEV_DAVE",
                "user_name": "Dave_SRE",
                "text": "Switched traffic to Checkout.com fallback gateway. Latency back to 180ms. Incident resolved."
            }
        ]
    }
]

def seed_data():
    store = MessageStore(settings.SQLITE_DB_PATH)
    connector = SlackConnector(bot_token="", message_store=store)

    total_msgs = 0
    for conv in FINTECH_CONVERSATIONS:
        msgs = connector.ingest_mock_conversation(
            channel_id=conv["channel_id"],
            channel_name=conv["channel_name"],
            conversation_script=conv["dialogue"]
        )
        total_msgs += len(msgs)

    print(f"[*] Ingested {total_msgs} raw simulated enterprise messages into SQLite.")

    # Execute chunking verification
    all_msgs = store.get_all_messages()
    chunker = Chunker()
    chunks = chunker.chunk_messages(all_msgs)

    print(f"[*] Chunker created {len(chunks)} contextual dialogue blocks:")
    for c in chunks:
        print(f"    - [{c.chunk_id}] Channel: #{c.channel_name} | Messages: {c.message_count} | Participants: {', '.join(c.participants)}")

if __name__ == "__main__":
    seed_data()
