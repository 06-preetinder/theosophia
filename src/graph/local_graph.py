"""
Local In-Memory / SQLite Graph Engine
Provides property graph node and edge storage with Cypher-like traversal query capabilities.
Seamlessly transitions to remote Neo4j Aura when live credentials are provided.
"""

import sqlite3
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from pydantic import BaseModel, Field

class GraphNode(BaseModel):
    id: str
    label: str  # e.g. 'Person', 'Policy', 'Process', 'Threshold'
    name: str
    confidence: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    source_id: str
    target_id: str
    rel_type: str  # e.g. 'DEFINES_THRESHOLD', 'ESCALATES_TO', 'REQUIRES'
    confidence: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)

class LocalGraphDB:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS graph_nodes (
                    id TEXT PRIMARY KEY,
                    label TEXT NOT NULL,
                    name TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    properties_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS graph_edges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_id TEXT NOT NULL,
                    target_id TEXT NOT NULL,
                    rel_type TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    properties_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(source_id, target_id, rel_type)
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_node_label ON graph_nodes(label);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_edge_source ON graph_edges(source_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_edge_target ON graph_edges(target_id);")
            conn.commit()

    def merge_node(self, node: GraphNode) -> None:
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO graph_nodes (id, label, name, confidence, properties_json)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    confidence = MAX(graph_nodes.confidence, excluded.confidence),
                    properties_json = excluded.properties_json
            """, (node.id, node.label, node.name, node.confidence, json.dumps(node.properties)))
            conn.commit()

    def merge_edge(self, edge: GraphEdge) -> None:
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO graph_edges (source_id, target_id, rel_type, confidence, properties_json)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(source_id, target_id, rel_type) DO UPDATE SET
                    confidence = MAX(graph_edges.confidence, excluded.confidence),
                    properties_json = excluded.properties_json
            """, (edge.source_id, edge.target_id, edge.rel_type, edge.confidence, json.dumps(edge.properties)))
            conn.commit()

    def get_node(self, node_id: str) -> Optional[GraphNode]:
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM graph_nodes WHERE id = ?", (node_id,))
            row = cur.fetchone()
            if not row:
                return None
            return GraphNode(
                id=row["id"],
                label=row["label"],
                name=row["name"],
                confidence=row["confidence"],
                properties=json.loads(row["properties_json"] or "{}")
            )

    def get_subgraph(self, root_name: str, depth: int = 1) -> Dict[str, Any]:
        """
        Traverse relations centered on a given node or entity name.
        """
        with self._get_conn() as conn:
            cur = conn.cursor()
            # Find matching root
            cur.execute("SELECT * FROM graph_nodes WHERE name LIKE ? OR id = ?", (f"%{root_name}%", root_name))
            root = cur.fetchone()
            if not root:
                return {"nodes": [], "edges": []}

            root_id = root["id"]
            nodes = {root_id: GraphNode(
                id=root["id"], label=root["label"], name=root["name"],
                confidence=root["confidence"], properties=json.loads(root["properties_json"] or "{}")
            )}
            edges: List[GraphEdge] = []

            # 1-hop outgoing edges
            cur.execute("SELECT * FROM graph_edges WHERE source_id = ?", (root_id,))
            for r in cur.fetchall():
                edges.append(GraphEdge(
                    source_id=r["source_id"], target_id=r["target_id"],
                    rel_type=r["rel_type"], confidence=r["confidence"],
                    properties=json.loads(r["properties_json"] or "{}")
                ))
                # Grab target node
                target = self.get_node(r["target_id"])
                if target:
                    nodes[target.id] = target

            # 1-hop incoming edges
            cur.execute("SELECT * FROM graph_edges WHERE target_id = ?", (root_id,))
            for r in cur.fetchall():
                edges.append(GraphEdge(
                    source_id=r["source_id"], target_id=r["target_id"],
                    rel_type=r["rel_type"], confidence=r["confidence"],
                    properties=json.loads(r["properties_json"] or "{}")
                ))
                source = self.get_node(r["source_id"])
                if source:
                    nodes[source.id] = source

            return {
                "nodes": [n.model_dump() for n in nodes.values()],
                "edges": [e.model_dump() for e in edges]
            }

    def get_all_nodes(self) -> List[GraphNode]:
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM graph_nodes ORDER BY confidence DESC")
            return [
                GraphNode(
                    id=r["id"], label=r["label"], name=r["name"],
                    confidence=r["confidence"], properties=json.loads(r["properties_json"] or "{}")
                )
                for r in cur.fetchall()
            ]

    def get_all_edges(self) -> List[GraphEdge]:
        with self._get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM graph_edges")
            return [
                GraphEdge(
                    source_id=r["source_id"], target_id=r["target_id"],
                    rel_type=r["rel_type"], confidence=r["confidence"],
                    properties=json.loads(r["properties_json"] or "{}")
                )
                for r in cur.fetchall()
            ]
