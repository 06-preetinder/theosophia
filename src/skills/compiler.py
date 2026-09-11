"""
Theosophia Skill Compiler
Synthesizes verified knowledge graph subgraphs into executable, safe YAML agent skills.
"""

import re
import yaml
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from src.graph.local_graph import LocalGraphDB

class SkillStep(BaseModel):
    id: str
    action: str  # 'verify_condition', 'call_api', 'escalate', 'branch'
    description: str
    guard: Optional[str] = None
    fallback: str = "escalate_to_human"
    params: Dict[str, Any] = Field(default_factory=dict)

class ExecutableSkill(BaseModel):
    id: str
    version: str = "1.0.0"
    description: str
    domain: str = "fintech"
    confidence: float
    source_policy: str
    steps: List[SkillStep]
    escalation_channel: str = "#support-escalations"
    audit_trail: Dict[str, Any] = Field(default_factory=dict)

class SkillCompiler:
    def __init__(self, graph_db: LocalGraphDB):
        self.graph = graph_db

    def compile_skill_from_domain(self, policy_or_process_name: str) -> Optional[ExecutableSkill]:
        """
        Queries the knowledge graph around the domain entity and generates
        a deterministic executable workflow specification.
        """
        subgraph = self.graph.get_subgraph(policy_or_process_name)
        if not subgraph["nodes"]:
            return None

        # Determine threshold rules and policies
        threshold_val = 500  # Default fallback
        policy_name = policy_or_process_name
        escalation_channel = "#risk-disputes"

        for n in subgraph["nodes"]:
            if n["label"].lower() == "threshold":
                num_match = re.search(r'\d+', n["name"].replace(",", ""))
                if num_match:
                    threshold_val = int(num_match.group())
            elif n["label"].lower() == "channel":
                escalation_channel = n["name"]
            elif n["label"].lower() == "policy":
                policy_name = n["name"]

        # Synthesize verified steps
        steps = [
            SkillStep(
                id="verify_account_fraud_status",
                action="verify_condition",
                description="Verify merchant account has zero active chargeback flags and is at KYC Level 2.",
                guard="account.active_fraud_flags == 0 AND account.kyc_level >= 2",
                fallback="escalate_to_risk_review",
                params={"check": "kyc_and_fraud_flags"}
            ),
            SkillStep(
                id="evaluate_refund_threshold",
                action="branch",
                description=f"Automated refund processing under statutory limit of ${threshold_val} per {policy_name}.",
                guard=f"transaction.amount <= {threshold_val}",
                fallback="require_executive_signoff",
                params={"max_allowed_amount": threshold_val}
            ),
            SkillStep(
                id="execute_payment_gateway_reversal",
                action="call_api",
                description="Call processor API (e.g. Stripe/Adyen) to issue the credit reversal.",
                guard="steps.evaluate_refund_threshold.passed == True",
                fallback="escalate_to_support_lead",
                params={"endpoint": "/v1/payments/refund", "idempotency_key": "auto_generated"}
            )
        ]

        avg_confidence = round(sum(n["confidence"] for n in subgraph["nodes"]) / len(subgraph["nodes"]), 2)

        return ExecutableSkill(
            id=f"skill_{policy_name.lower().replace(' ', '_').replace('-', '_')}",
            version="1.0.0",
            description=f"Autonomous workflow synthesized from knowledge graph for {policy_name}.",
            confidence=avg_confidence,
            source_policy=policy_name,
            steps=steps,
            escalation_channel=escalation_channel,
            audit_trail={
                "nodes_referenced": [n["id"] for n in subgraph["nodes"]],
                "edge_count": len(subgraph["edges"])
            }
        )

    def export_to_yaml(self, skill: ExecutableSkill) -> str:
        return yaml.dump(skill.model_dump(), sort_keys=False, default_flow_style=False)
