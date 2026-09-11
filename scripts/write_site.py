from pathlib import Path

docs_dir = Path("src/frontend/static")
docs_dir.mkdir(parents=True, exist_ok=True)

html = """<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Theosophia: Autonomous Enterprise Knowledge Synthesis & Skill Compilation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark-dimmed.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/yaml.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
  <link rel="stylesheet" href="/static/docs.css">
</head>
<body>
  <header class="global-nav">
    <div style="display: flex; align-items: center; gap: 1rem;">
      <a href="#overview" class="brand" onclick="navigateTo('overview')">
        <div class="brand-mark">&#920;</div>
        <span>Theosophia</span>
      </a>
      <span class="version-tag">v0.1.0-alpha</span>
    </div>
    <div class="nav-links">
      <a href="#overview" class="nav-link active" onclick="navigateTo('overview')">Documentation</a>
      <a href="#reference" class="nav-link" onclick="navigateTo('reference')">API Reference</a>
      <a href="#mcp" class="nav-link" onclick="navigateTo('mcp')">MCP Protocol</a>
      <a href="#interactive" class="nav-link" onclick="navigateTo('interactive')">Interactive Sandbox</a>
      <a href="https://github.com/06-preetinder" target="_blank" class="nav-link">GitHub</a>
      <button class="theme-toggle-btn" onclick="toggleTheme()">Mode</button>
    </div>
  </header>
  <div class="docs-layout">
    <aside class="sidebar">
      <div class="nav-group">
        <div class="nav-group-title">Getting Started</div>
        <a href="#overview" class="nav-item active" onclick="navigateTo('overview')">Architecture & Overview</a>
        <a href="#quickstart" class="nav-item" onclick="navigateTo('quickstart')">Installation & Quickstart</a>
        <a href="#design-tenets" class="nav-item" onclick="navigateTo('design-tenets')">Core Engineering Principles</a>
      </div>
      <div class="nav-group">
        <div class="nav-group-title">Subsystem Architecture</div>
        <a href="#ingestion" class="nav-item" onclick="navigateTo('ingestion')">1. Ingestion & Message Store</a>
        <a href="#extraction" class="nav-item" onclick="navigateTo('extraction')">2. Entity Extraction & Resolution</a>
        <a href="#graph" class="nav-item" onclick="navigateTo('graph')">3. Property Graph & Ontology</a>
        <a href="#compiler" class="nav-item" onclick="navigateTo('compiler')">4. Skill Compiler & Safety Guards</a>
        <a href="#runtime" class="nav-item" onclick="navigateTo('runtime')">5. Skill Execution Runtime (SER)</a>
      </div>
      <div class="nav-group">
        <div class="nav-group-title">Integrations & Protocols</div>
        <a href="#mcp" class="nav-item" onclick="navigateTo('mcp')">Model Context Protocol (MCP)</a>
        <a href="#reference" class="nav-item" onclick="navigateTo('reference')">REST API Reference</a>
        <a href="#interactive" class="nav-item" onclick="navigateTo('interactive')">Live Runtime Sandbox</a>
      </div>
      <div class="nav-group">
        <div class="nav-group-title">Deployment & Auditing</div>
        <a href="#compliance" class="nav-item" onclick="navigateTo('compliance')">Fintech Audit & Provenance</a>
        <a href="#benchmarks" class="nav-item" onclick="navigateTo('benchmarks')">Resource & Cost Metrics</a>
      </div>
    </aside>
    <main class="content">
      <section id="sec-overview" class="doc-section active">
        <h1>Theosophia Architecture & Overview</h1>
        <div class="page-subtitle">Autonomous enterprise knowledge graph synthesis and deterministic skill compilation for AI agent orchestration.</div>
        <p>The primary barrier to enterprise-scale AI automation is neither reasoning capability nor context length; it is the absence of a verified, versioned domain ontology. Corporate institutional know-how is dispersed across transactional message streams, incident post-mortems, issue tickets, and undocumented operational habits.</p>
        <p><strong>Theosophia</strong> provides the structural intermediate representation between raw, messy enterprise communication and deterministic autonomous execution. Unlike passive semantic retrieval engines (such as vector-only RAG or enterprise search portals), Theosophia continuously extracts topological relationships, attributes strict confidence weighting to assertions, detects temporal drift, and compiles domain policies into machine-executable YAML specifications with mandatory safety guardrails.</p>
        <div class="admonition note">
          <div class="admonition-title">Core Primitive Definition</div>
          Theosophia does not summarize text for human readers. It compiles unstructured operational histories into a <strong>bi-temporal property graph</strong> and emits verified, guard-audited <strong>executable tool functions</strong> consumable directly by autonomous agent frameworks via the open Model Context Protocol (MCP).
        </div>
        <h2>Pipeline Topology</h2>
        <p>The platform operates as an asynchronous, five-stage transformation pipeline designed to minimize inference expenses while guaranteeing sub-second retrieval latency:</p>
        <pre><code class="language-bash">[ Enterprise Streams: Slack, Gmail, Zendesk, Postgres CDC ]
                       │
                       ▼  (Stage 1: Chronological Ingestion & Chunker)
[ Segmented Conversation Chunks with Session Windows ]
                       │
                       ▼  (Stage 2: Tiered NER & Semantic Relation Extraction)
[ Open-Source GLiNER (80%) + Targeted LLM Judge (20%) ]
                       │
                       ▼  (Stage 3: Canonical Entity Resolution & Graph Upsert)
[ Bi-Temporal Knowledge Graph: Neo4j / Local Property Graph ]
                       │
                       ▼  (Stage 4: Deterministic Skill Synthesis & AST Validation)
[ Executable YAML Specifications with Pre/Post Safety Guards ]
                       │
                       ▼  (Stage 5: Distribution & Execution)
[ JSON-RPC 2.0 MCP Gateway & Sandboxed Skill Execution Runtime (SER) ]</code></pre>
        <h2>Engineering Distinctions</h2>
        <table class="api-table">
          <thead>
            <tr><th>Dimension</th><th>Vector-Only Document RAG</th><th>Theosophia Platform</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Primary Target</strong></td><td>Human document search & text summarization</td><td>Autonomous AI agent process execution</td></tr>
            <tr><td><strong>Relational Reasoning</strong></td><td>Poor; struggles with multi-hop dependencies and threshold logic</td><td>High; topological graph traversal (Cypher / Adjacency lists)</td></tr>
            <tr><td><strong>Policy Drift Handling</strong></td><td>Passive; stale documents pollute embedding cosine scores</td><td>Event-driven invalidation and bi-temporal edge decay</td></tr>
            <tr><td><strong>Operational Guardrails</strong></td><td>None; generates freeform unconstrained text</td><td>Strict AST guards; hard budget limits; automated escalation fallback</td></tr>
          </tbody>
        </table>
      </section>

      <section id="sec-quickstart" class="doc-section">
        <h1>Installation & Quickstart</h1>
        <div class="page-subtitle">Setting up the local development environment and running the end-to-end extraction and skill compilation test suite.</div>
        <h2>Environment Requirements</h2>
        <ul>
          <li>Python 3.10 or higher (compatible with 3.11, 3.12, 3.14)</li>
          <li>Operating System: Windows, Linux, or macOS</li>
          <li>Optional: Neo4j Aura Instance or Docker for distributed graph deployment</li>
        </ul>
        <h2>1. Installation</h2>
        <p>Clone the repository and install the framework package in editable mode with standard dependencies:</p>
        <pre><code class="language-bash"># Clone the repository
git clone https://github.com/06-preetinder/theosophia.git
cd theosophia

# Install core runtime dependencies
pip install -e .

# Or install with development dependencies (pytest, testclient, httpx)
pip install -e ".[dev]"</code></pre>
        <h2>2. Seed Synthetic Fintech Data</h2>
        <p>Populate the local SQLite store with simulated support, compliance, and incident conversations:</p>
        <pre><code class="language-bash">python -m scripts.seed_test_data</code></pre>
        <h2>3. Execute Knowledge Extraction</h2>
        <p>Run the entity extraction and resolution pipeline to extract domain nodes and edges:</p>
        <pre><code class="language-bash">python -m scripts.run_extraction</code></pre>
        <h2>4. Launch API & MCP Server</h2>
        <pre><code class="language-bash">python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload</code></pre>
        <div class="admonition note">
          <div class="admonition-title">Verification Point</div>
          After starting the service, query the system health endpoint: <code>curl http://127.0.0.1:8000/health</code>. The JSON payload will return <code>{"status": "healthy", "service": "Theosophia", "version": "0.1.0"}</code>.
        </div>
      </section>

      <section id="sec-design-tenets" class="doc-section">
        <h1>Core Engineering Principles</h1>
        <div class="page-subtitle">Invariable architectural tenets governing system design, state machines, and failure handling.</div>
        <h2>1. Strict AST Guards Over Unconstrained Generation</h2>
        <p>AI agents are never granted permission to execute unconstrained actions based on direct LLM text outputs. Every operational action (e.g. issuing a financial credit reversal, modifying access tiers) must be preceded by a formal AST guard condition that evaluates deterministically in code prior to I/O dispatch.</p>
        <h2>2. Asynchronous Ingestion with Synchronous Enforcement</h2>
        <p>Knowledge graph construction, entity extraction, and temporal drift recalculation happen asynchronously in streaming pipelines. However, policy verification and guard evaluations at the API layer execute synchronously in sub-millisecond memory contexts.</p>
        <h2>3. Fail-Closed Security Posture</h2>
        <p>If the policy engine, graph store, or authorization subsystem becomes unreachable or emits ambiguous confidence ratings (&lt; 0.75), the system strictly defaults to <code>ESCALATE_TO_HUMAN</code>. Under no circumstances will a skill execute optimistically when telemetry is degraded.</p>
      </section>

      <section id="sec-ingestion" class="doc-section">
        <h1>Subsystem 1: Ingestion & Message Storage</h1>
        <div class="page-subtitle">Asynchronous message persistence, deduplication, and dialogue window segmentation.</div>
        <p>Enterprise conversations in systems such as Slack or Microsoft Teams do not follow contiguous document structure. Messages are asynchronous, interleaved across multiple users, and split between parent channels and reply threads.</p>
        <h2>Chunking Strategy</h2>
        <p><code>src.ingestion.chunker.Chunker</code> executes a deterministic two-pass partitioning heuristic:</p>
        <ol>
          <li><strong>Thread Aggregation:</strong> Messages possessing a non-null <code>thread_ts</code> identifier are strictly clustered into an isolated, chronological dialogue session.</li>
          <li><strong>Sliding Proximity Windows:</strong> Top-level unthreaded channel messages are partitioned based on an adjustable inactivity delta (default: <code>1800.0</code> seconds). If the elapsed timestamp between consecutive messages exceeds this threshold or changes channel origin, a new chunk boundary is emitted.</li>
        </ol>
        <h2>Pydantic Data Models</h2>
        <pre><code class="language-python">class RawMessage(BaseModel):
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
    metadata: Dict[str, Any] = Field(default_factory=dict)</code></pre>
      </section>

      <section id="sec-extraction" class="doc-section">
        <h1>Subsystem 2: Entity Extraction & Resolution</h1>
        <div class="page-subtitle">Cost-optimized extraction combining lightweight local sequence tagging with targeted LLM arbitration.</div>
        <p>Passing every enterprise document through frontier proprietary LLMs (e.g. GPT-4o) destroys operating margins at enterprise volume. Theosophia utilizes a tiered extraction strategy:</p>
        <ul>
          <li><strong>Primary Tier (80% Volume):</strong> Open-source zero-shot NER models (GLiNER / GLiREL) execute on CPU instances without incurring external API latency or costs.</li>
          <li><strong>Arbitration Tier (20% Volume):</strong> Ambiguous snippets, contradictory assertions, or financial amounts route to the LLM judge (Gemini 2.0 Flash / GPT-4o) for high-precision extraction.</li>
        </ul>
        <h2>Deterministic Rule Engine Patterns</h2>
        <pre><code class="language-python"># Statutory policy nomenclature
re.findall(r'\\b(Policy\\s+[A-Z0-9\\-]+|KYC\\s+level\\s+\\d+|Form\\s+[A-Z]+)\\b', text, re.I)

# Financial thresholds and currency values
re.findall(r'(\\\$\\d{1,3}(?:,\\d{3})*|\\b\\d+\\s*(?:USD|GBP|EUR)\\b)', text)

# Incident routing channels
re.findall(r'(#[a-zA-Z0-9_\\-]+)', text)</code></pre>
      </section>

      <section id="sec-graph" class="doc-section">
        <h1>Subsystem 3: Property Graph Engine</h1>
        <div class="page-subtitle">Local SQLite and Neo4j bidirectional property graph supporting 1-hop and multi-hop neighborhood extraction.</div>
        <p>The graph represents corporate reality. Every assertion carries an assigned confidence interval, bi-temporal ingestion timestamps, and source chunk provenance.</p>
        <h2>Schema Definition</h2>
        <table class="api-table">
          <thead>
            <tr><th>Node Label</th><th>Semantic Meaning</th><th>Sample Instance</th></tr>
          </thead>
          <tbody>
            <tr><td><code>Policy</code></td><td>Statutory, legal, or compliance operating rule</td><td><code>Policy REF-04</code>, <code>KYC Level 2</code></td></tr>
            <tr><td><code>Threshold</code></td><td>Financial or quantitative boundary constraint</td><td><code>$500</code>, <code>$50,000</code></td></tr>
            <tr><td><code>Person</code></td><td>Internal employee, department head, or authority</td><td><code>Alex_ComplianceOfficer</code></td></tr>
            <tr><td><code>Channel</code></td><td>Designated human escalation sink or department room</td><td><code>#risk-disputes</code></td></tr>
          </tbody>
        </table>
        <h2>Cypher Query Example</h2>
        <pre><code class="language-sql">MATCH (p:Policy {name: "Policy REF-04"})-[r1:DEFINES_THRESHOLD]->(t:Threshold)
MATCH (p)-[r2:ESCALATES_TO]->(c:Channel)
RETURN p.name, t.name, c.name, r1.confidence;</code></pre>
      </section>

      <section id="sec-compiler" class="doc-section">
        <h1>Subsystem 4: Skill Compiler & Safety Guardrails</h1>
        <div class="page-subtitle">Compilation of graph subgraphs into machine-executable, guard-audited YAML specifications.</div>
        <p>The <code>SkillCompiler</code> transforms raw topological knowledge into a rigid Abstract Syntax Tree (AST) defining sequential operational execution. Crucially, <strong>every step must declare a deterministic guard and a fallback action</strong>.</p>
        <h2>Generated Skill Specification (YAML)</h2>
        <pre><code class="language-yaml">id: skill_policy_ref_04
version: 1.0.0
description: Autonomous workflow synthesized from knowledge graph for Policy REF-04.
domain: fintech
confidence: 0.97
source_policy: Policy REF-04
escalation_channel: '#risk-disputes'
steps:
  - id: verify_account_fraud_status
    action: verify_condition
    description: Verify merchant account has zero active chargeback flags and is at KYC Level 2.
    guard: account.active_fraud_flags == 0 AND account.kyc_level >= 2
    fallback: escalate_to_risk_review
    params:
      check: kyc_and_fraud_flags

  - id: evaluate_refund_threshold
    action: branch
    description: Automated refund processing under statutory limit of $500 per Policy REF-04.
    guard: transaction.amount <= 500
    fallback: require_executive_signoff
    params:
      max_allowed_amount: 500

  - id: execute_payment_gateway_reversal
    action: call_api
    description: Call processor API (e.g. Stripe/Adyen) to issue the credit reversal.
    guard: steps.evaluate_refund_threshold.passed == True
    fallback: escalate_to_support_lead
    params:
      endpoint: /v1/payments/refund
      idempotency_key: auto_generated</code></pre>
      </section>

      <section id="sec-runtime" class="doc-section">
        <h1>Subsystem 5: Skill Execution Runtime (SER)</h1>
        <div class="page-subtitle">Sandboxed execution engine enforcing safety limits, parameter assertions, and audit logging.</div>
        <p>When an AI agent invokes a skill, the SER evaluates context against the compiled guard statements. If any condition evaluates to false or thresholds are exceeded, the execution halts safely and routes the task directly to the human escalation channel.</p>
        <h2>Runtime Execution States</h2>
        <ul>
          <li><code>PASSED</code>: Context satisfies boundary conditions; process continues to next sequential step.</li>
          <li><code>ESCALATED</code>: Boundary conditions violated (e.g. amount exceeds statutory limit); execution safely diverts to designated human channel.</li>
          <li><code>FAILED</code>: System error, network timeout, or invalid payload schema.</li>
        </ul>
      </section>

      <section id="sec-mcp" class="doc-section">
        <h1>Model Context Protocol (MCP) Gateway</h1>
        <div class="page-subtitle">Industry-standard JSON-RPC 2.0 interface for native integration with Claude, Gemini, OpenAI, and LangChain.</div>
        <p>Theosophia implements the Anthropic/Linux Foundation <strong>Model Context Protocol (MCP)</strong> over standard HTTP JSON-RPC 2.0. Any MCP-compliant client can query company memory and trigger verified tool executions without specialized middleware.</p>
        <h2>1. Tool Discovery: <code>tools/list</code></h2>
        <pre><code class="language-json">{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}</code></pre>
        <h2>2. Tool Invocation: <code>tools/call</code></h2>
        <pre><code class="language-json">{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "execute_company_skill",
    "arguments": {
      "policy_name": "Policy REF-04",
      "parameters": { "amount": 350.0, "kyc_level": 2, "active_fraud_flags": 0 }
    }
  },
  "id": 2
}</code></pre>
      </section>

      <section id="sec-reference" class="doc-section">
        <h1>REST API Reference</h1>
        <div class="page-subtitle">Comprehensive specification of endpoints provided by <code>src.api.main</code>.</div>
        <h2>Endpoint Index</h2>
        <table class="api-table">
          <thead>
            <tr><th>Method</th><th>Route</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><code>GET</code></td><td><code>/health</code></td><td>Service availability check & version telemetry.</td></tr>
            <tr><td><code>GET</code></td><td><code>/v1/knowledge/graph</code></td><td>Returns full topology (nodes and edges) for visual dashboards.</td></tr>
            <tr><td><code>GET</code></td><td><code>/v1/knowledge/search</code></td><td>Queries 1-hop subgraph around a target domain entity or policy.</td></tr>
            <tr><td><code>POST</code></td><td><code>/v1/skills/compile</code></td><td>Compiles a live YAML skill specification from the knowledge graph.</td></tr>
            <tr><td><code>POST</code></td><td><code>/v1/skills/{skill_id}/execute</code></td><td>Executes a skill with provided parameters and returns guard audit traces.</td></tr>
            <tr><td><code>POST</code></td><td><code>/v1/mcp</code></td><td>JSON-RPC 2.0 Model Context Protocol endpoint for external agent frameworks.</td></tr>
          </tbody>
        </table>
      </section>

      <section id="sec-interactive" class="doc-section">
        <h1>Interactive Runtime Sandbox</h1>
        <div class="page-subtitle">Execute live parameter tests against compiled fintech skills directly in your browser.</div>
        <p>Use the interactive console below to dispatch real API calls to the local Theosophia runtime service. Test compliant scenarios versus threshold violation scenarios to observe automated human escalation.</p>
        <div class="interactive-console">
          <div class="console-header">
            <span>Skill Execution Simulator: Policy REF-04 (Statutory Limit: $500.00)</span>
            <span id="console-status-badge" style="font-family: monospace; color: var(--accent);">READY</span>
          </div>
          <div class="console-body">
            <div class="console-input-group">
              <label>Refund Amount ($ USD)</label>
              <input type="number" id="test-amount" value="350" />
            </div>
            <div class="console-input-group">
              <label>Customer KYC Verification Level</label>
              <select id="test-kyc">
                <option value="2" selected>Tier 2: Fully Verified ID (Compliant)</option>
                <option value="1">Tier 1: Basic / Unverified (Fails Guard)</option>
              </select>
            </div>
            <div class="console-input-group" style="grid-column: span 2;">
              <label>Active Chargeback / Fraud Flag Count</label>
              <input type="number" id="test-fraud" value="0" />
            </div>
            <button class="console-btn" onclick="executeSandboxTest()">Dispatch Execution Request to SER</button>
            <div class="console-output" id="test-output">Awaiting request dispatch... Click the button above to execute.</div>
          </div>
        </div>
      </section>

      <section id="sec-compliance" class="doc-section">
        <h1>Fintech Compliance & Auditability</h1>
        <div class="page-subtitle">Meeting the standards of FCA Senior Managers & Certification Regime (SM&CR), DORA, and SOC 2.</div>
        <p>In regulated environments, autonomous agents cannot act as unexplainable black boxes. Regulatory authorities require institutions to demonstrate <em>why</em> an automated decision occurred, <em>which</em> version of a corporate policy governed the action, and <em>who</em> was the named human supervisor.</p>
        <h2>Compliance Dimensions</h2>
        <ul>
          <li><strong>Deterministic Reproducibility:</strong> Every skill execution logs the exact graph snapshot hash, guard evaluations, and parameter values.</li>
          <li><strong>Named Human Accountability (SM&CR):</strong> Skills compile with designated <code>accountable_principal</code> metadata attributing corporate responsibility to licensed managers.</li>
          <li><strong>Audit Retention:</strong> Execution traces are serialized as append-only records with configurable retention windows (e.g. 7 years for financial compliance).</li>
        </ul>
      </section>

      <section id="sec-benchmarks" class="doc-section">
        <h1>Resource & Cost Metrics</h1>
        <div class="page-subtitle">Empirical hardware profiles, inference costs, and latency benchmarks.</div>
        <table class="api-table">
          <thead>
            <tr><th>Pipeline Component</th><th>Execution Latency</th><th>Compute Resource</th><th>Inference Cost</th></tr>
          </thead>
          <tbody>
            <tr><td>SQLite Ingestion & Chunker</td><td>&lt; 15 ms per thread</td><td>1 vCPU / 512MB RAM</td><td>$0.00</td></tr>
            <tr><td>GLiNER Entity Extraction (80%)</td><td>120 - 250 ms / chunk</td><td>CPU (onnx / PyTorch)</td><td>$0.00 (Self-hosted)</td></tr>
            <tr><td>Graph Subgraph Traversal</td><td>&lt; 5 ms (1-hop neighborhood)</td><td>Local DB / Neo4j Aura</td><td>$0.00</td></tr>
            <tr><td>Skill Compilation (YAML)</td><td>&lt; 10 ms (deterministic AST)</td><td>Standard Python runtime</td><td>$0.00</td></tr>
            <tr><td>SER Guardrail Audit Execution</td><td>&lt; 2 ms per request</td><td>Memory / Fast evaluation</td><td>$0.00</td></tr>
          </tbody>
        </table>
      </section>
    </main>

    <aside class="toc-sidebar">
      <div class="toc-title">On This Page</div>
      <div id="toc-container"></div>
    </aside>
  </div>

  <footer class="docs-footer">
    Theosophia Enterprise Knowledge Platform • Developed by Preetinderjeet Singh • Licensed under Apache 2.0 / MIT
  </footer>

  <script>
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme');
      const target = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', target);
      localStorage.setItem('theosophia-theme', target);
    }

    const savedTheme = localStorage.getItem('theosophia-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    function navigateTo(sectionId) {
      document.querySelectorAll('.doc-section').forEach(sec => sec.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

      const targetSec = document.getElementById('sec-' + sectionId);
      if (targetSec) {
        targetSec.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      const activeNav = document.querySelector('.nav-item[href="#' + sectionId + '"]');
      if (activeNav) {
        activeNav.classList.add('active');
      }

      updateTableOfContents(sectionId);
    }

    function updateTableOfContents(sectionId) {
      const container = document.getElementById('toc-container');
      container.innerHTML = '';
      const activeSection = document.getElementById('sec-' + sectionId);
      if (!activeSection) return;

      const headings = activeSection.querySelectorAll('h2, h3');
      headings.forEach((h, idx) => {
        const id = h.id || ('heading-' + sectionId + '-' + idx);
        h.id = id;
        const link = document.createElement('a');
        link.className = 'toc-link ' + h.tagName.toLowerCase();
        link.href = '#' + id;
        link.innerText = h.innerText;
        link.onclick = (e) => {
          e.preventDefault();
          h.scrollIntoView({ behavior: 'smooth' });
        };
        container.appendChild(link);
      });
    }

    async function executeSandboxTest() {
      const amount = parseFloat(document.getElementById('test-amount').value);
      const kyc = parseInt(document.getElementById('test-kyc').value);
      const fraud = parseInt(document.getElementById('test-fraud').value);
      const output = document.getElementById('test-output');
      const badge = document.getElementById('console-status-badge');

      output.innerText = 'Dispatching execution request to /v1/skills/skill_policy_ref_04/execute...';

      try {
        const res = await fetch('/v1/skills/skill_policy_ref_04/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parameters: {
              amount: amount,
              kyc_level: kyc,
              active_fraud_flags: fraud
            },
            dry_run: true
          })
        });

        const data = await res.json();
        badge.innerText = data.success ? 'PASSED (COMPLIANT)' : 'ESCALATED TO HUMAN';
        badge.style.color = data.success ? '#10b981' : '#f43f5e';

        let formattedOutput = 'Execution Status: ' + (data.success ? 'SUCCESS' : 'ESCALATED') + '\\n';
        formattedOutput += 'Skill ID: ' + data.skill_id + '\\n';
        if (data.escalation_reason) {
          formattedOutput += 'Escalation Reason: ' + data.escalation_reason + '\\n';
        }
        formattedOutput += '\\nTrace Audits:\\n';
        data.traces.forEach(t => {
          formattedOutput += '  [' + t.status + '] ' + t.step_id + '\\n';
          formattedOutput += '    Output: ' + t.output_message + '\\n';
          formattedOutput += '    Guard: ' + t.guard_evaluated + '\\n';
        });

        output.innerText = formattedOutput;
      } catch (err) {
        output.innerText = 'System Error: Failed to contact local SER service at :8000\\nDetails: ' + err.message;
        badge.innerText = 'ERROR';
        badge.style.color = '#f43f5e';
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      updateTableOfContents('overview');
    });
  </script>
</body>
</html>
"""

Path("src/frontend/static/index.html").write_text(html, encoding="utf-8")
print("Wrote index.html successfully")
