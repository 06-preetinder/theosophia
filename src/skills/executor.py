"""
Theosophia Skill Execution Runtime (SER)
Simulates deterministic dry-run and live execution of synthesized skills with guard audits.
"""

from typing import Dict, Any, List
from pydantic import BaseModel, Field
from src.skills.compiler import ExecutableSkill, SkillStep

class ExecutionTraceStep(BaseModel):
    step_id: str
    action: str
    status: str  # 'PASSED', 'FAILED', 'ESCALATED'
    guard_evaluated: str
    output_message: str

class SkillExecutionResult(BaseModel):
    skill_id: str
    success: bool
    escalated: bool
    escalation_reason: str = ""
    traces: List[ExecutionTraceStep] = Field(default_factory=list)

class SkillExecutor:
    def execute(self, skill: ExecutableSkill, context: Dict[str, Any], dry_run: bool = True) -> SkillExecutionResult:
        traces: List[ExecutionTraceStep] = []
        is_escalated = False
        escalation_reason = ""

        # Context payload unpacking
        amount = float(context.get("amount", 0.0))
        active_fraud_flags = int(context.get("active_fraud_flags", 0))
        kyc_level = int(context.get("kyc_level", 1))

        for step in skill.steps:
            if step.id == "verify_account_fraud_status":
                if active_fraud_flags == 0 and kyc_level >= 2:
                    traces.append(ExecutionTraceStep(
                        step_id=step.id,
                        action=step.action,
                        status="PASSED",
                        guard_evaluated=step.guard or "",
                        output_message="Account KYC verified; zero fraud flags confirmed."
                    ))
                else:
                    is_escalated = True
                    escalation_reason = f"Account failed fraud/KYC guard (KYC={kyc_level}, FraudFlags={active_fraud_flags}). Escalating via {step.fallback}."
                    traces.append(ExecutionTraceStep(
                        step_id=step.id,
                        action=step.action,
                        status="ESCALATED",
                        guard_evaluated=step.guard or "",
                        output_message=escalation_reason
                    ))
                    break

            elif step.id == "evaluate_refund_threshold":
                max_allowed = float(step.params.get("max_allowed_amount", 500))
                if amount <= max_allowed:
                    traces.append(ExecutionTraceStep(
                        step_id=step.id,
                        action=step.action,
                        status="PASSED",
                        guard_evaluated=step.guard or "",
                        output_message=f"Amount ${amount:.2f} is within statutory threshold of ${max_allowed:.2f}."
                    ))
                else:
                    is_escalated = True
                    escalation_reason = f"Refund amount ${amount:.2f} exceeds standard threshold of ${max_allowed:.2f}. Escalating to {skill.escalation_channel} for executive sign-off."
                    traces.append(ExecutionTraceStep(
                        step_id=step.id,
                        action=step.action,
                        status="ESCALATED",
                        guard_evaluated=step.guard or "",
                        output_message=escalation_reason
                    ))
                    break

            elif step.id == "execute_payment_gateway_reversal":
                traces.append(ExecutionTraceStep(
                    step_id=step.id,
                    action=step.action,
                    status="PASSED",
                    guard_evaluated=step.guard or "",
                    output_message=f"{'[DRY RUN] ' if dry_run else ''}API endpoint {step.params.get('endpoint')} invoked. Reversal approved."
                ))

        return SkillExecutionResult(
            skill_id=skill.id,
            success=not is_escalated,
            escalated=is_escalated,
            escalation_reason=escalation_reason,
            traces=traces
        )
