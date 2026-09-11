"""
End-to-End Test: Graph Ingestion -> Skill Synthesis -> Autonomous Execution
"""

from src.config import settings
from src.graph.local_graph import LocalGraphDB, GraphNode, GraphEdge
from src.skills.compiler import SkillCompiler
from src.skills.executor import SkillExecutor

def run_e2e_demo():
    print("[*] Starting Theosophia End-to-End Skill Synthesis...")
    graph = LocalGraphDB(settings.DATA_DIR / "test_graph.db")

    # Populate verified domain knowledge into graph
    graph.merge_node(GraphNode(id="pol_ref04", label="Policy", name="Policy REF-04", confidence=0.95))
    graph.merge_node(GraphNode(id="thresh_500", label="Threshold", name="$500", confidence=0.98))
    graph.merge_node(GraphNode(id="chan_disputes", label="Channel", name="#risk-disputes", confidence=0.99))
    graph.merge_node(GraphNode(id="officer_alex", label="Person", name="Alex_ComplianceOfficer", confidence=1.0))

    graph.merge_edge(GraphEdge(source_id="pol_ref04", target_id="thresh_500", rel_type="DEFINES_THRESHOLD", confidence=0.95))
    graph.merge_edge(GraphEdge(source_id="pol_ref04", target_id="chan_disputes", rel_type="ESCALATES_TO", confidence=0.92))

    print("[+] Graph nodes and edges merged successfully.")

    # Compile Skill from Graph
    compiler = SkillCompiler(graph)
    skill = compiler.compile_skill_from_domain("Policy REF-04")
    assert skill is not None

    print(f"\n[+] SYNTHESIZED EXECUTABLE SKILL: {skill.id}")
    print(f"    Confidence: {skill.confidence} | Steps: {len(skill.steps)}")
    yaml_spec = compiler.export_to_yaml(skill)
    print("\n--- YAML SKILL SPECIFICATION ---")
    print(yaml_spec)

    # Execute Scenario A: Under $500 threshold with verified KYC
    executor = SkillExecutor()
    print("\n--- SCENARIO 1: Refund $350 (Compliant with Policy REF-04) ---")
    res_pass = executor.execute(skill, {"amount": 350, "active_fraud_flags": 0, "kyc_level": 2})
    for t in res_pass.traces:
        print(f"  [{t.status}] {t.step_id}: {t.output_message}")
    print(f"  Outcome: {'SUCCESS' if res_pass.success else 'FAILED'}")

    # Execute Scenario B: Over $500 threshold requiring escalation
    print("\n--- SCENARIO 2: Refund $850 (Exceeds Policy REF-04 $500 threshold) ---")
    res_esc = executor.execute(skill, {"amount": 850, "active_fraud_flags": 0, "kyc_level": 2})
    for t in res_esc.traces:
        print(f"  [{t.status}] {t.step_id}: {t.output_message}")
    print(f"  Outcome: {'ESCALATED TO HUMAN' if res_esc.escalated else 'SUCCESS'}")

if __name__ == "__main__":
    run_e2e_demo()
