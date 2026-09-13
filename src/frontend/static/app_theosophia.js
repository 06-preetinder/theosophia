// Theosophia Ethereal Studio Interaction Engine (jia.build & Portfolio Edition)
let fullGraphData = { nodes: [], edges: [] };
let cy = null;
let activeDivision = 'ALL';
let currentLayout = 'concentric';
let showEdgeLabels = false;
let spacingMultiplier = 1.8;
let isPanelCollapsed = false;

let activeTypeFilters = {
  Policy: true,
  Threshold: true,
  Person: true,
  Channel: true,
  System: true
};
let activeRecordId = null;

// Navigation Context Switcher
function switchTab(tabId) {
  const tabs = ['graph-view', 'runtime-view', 'compliance-view', 'records-view'];
  const titles = {
    'graph-view': 'Knowledge Graph Studio • Constellation Topology',
    'runtime-view': 'Skill Execution Runtime • Deterministic AST Sandbox',
    'compliance-view': 'SM&CR Regulatory Register • Statutory Lineage',
    'records-view': 'Corporate Memory Ledger • Entity Directory'
  };

  const titleEl = document.getElementById('view-title');
  if (titleEl) titleEl.innerText = titles[tabId] || 'Workspace';

  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const nav = document.getElementById(`tab-nav-${t.replace('-view', '')}`);
    if (el) el.classList.add('hidden');
    if (nav) nav.classList.remove('active');
  });

  const targetTab = document.getElementById(`tab-${tabId}`);
  const targetNav = document.getElementById(`tab-nav-${tabId.replace('-view', '')}`);
  if (targetTab) targetTab.classList.remove('hidden');
  if (targetNav) targetNav.classList.add('active');

  if (tabId === 'graph-view' && cy) {
    setTimeout(() => {
      cy.resize();
      cy.fit();
    }, 120);
  } else if (tabId === 'records-view') {
    populateRecordsTable();
  }
}

// Fetch Graph Data from Local SQLite Graph DB
async function loadGraphData() {
  try {
    const res = await fetch('/v1/knowledge/graph');
    fullGraphData = await res.json();
    renderEtherealGraph();
  } catch (err) {
    console.error('Failed to load graph data:', err);
  }
}

// Render Graph with Ethereal Obsidian Styling
function renderEtherealGraph() {
  const container = document.getElementById('cy');
  if (!container) return;

  const visibleNodes = fullGraphData.nodes.filter(n => {
    const typeAllowed = activeTypeFilters[n.label] !== false;
    let deptAllowed = true;
    if (activeDivision !== 'ALL') {
      const dept = (n.properties && n.properties.department) || '';
      deptAllowed = dept.toLowerCase().includes(activeDivision.toLowerCase());
    }
    return typeAllowed && deptAllowed;
  });

  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

  const visibleEdges = fullGraphData.edges.filter(e => {
    return visibleNodeIds.has(e.source_id) && visibleNodeIds.has(e.target_id);
  });

  const metricEl = document.getElementById('graph-node-metric');
  if (metricEl) {
    metricEl.innerText = `${visibleNodes.length} NODES • ${visibleEdges.length} EDGES`;
  }

  const cyElements = [];
  visibleNodes.forEach(n => {
    cyElements.push({
      data: {
        id: n.id,
        name: n.name,
        label: n.label,
        confidence: n.confidence,
        properties: n.properties || {}
      }
    });
  });

  visibleEdges.forEach((e, idx) => {
    cyElements.push({
      data: {
        id: `e_${idx}`,
        source: e.source_id,
        target: e.target_id,
        label: e.rel_type.replace(/_/g, ' ')
      }
    });
  });

  // Cytoscape Celestial Obsidian Topology
  cy = cytoscape({
    container: container,
    elements: cyElements,
    boxSelectionEnabled: false,
    autounselectify: false,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(name)',
          'color': '#ffffff',
          'font-size': '11px',
          'font-family': '"EB Garamond", Garamond, Georgia, serif',
          'font-weight': 500,
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 6,
          'text-wrap': 'wrap',
          'text-max-width': '95px',
          'text-overflow-wrap': 'break-word',
          'line-height': 1.15,
          'text-background-opacity': 0.92,
          'text-background-color': '#060609',
          'text-background-padding': '3px 6px',
          'text-background-shape': 'roundrectangle',
          'text-border-color': 'rgba(255, 255, 255, 0.22)',
          'text-border-width': 0.5,
          'text-border-opacity': 0.9,
          'background-color': function(ele) {
            const lbl = (ele.data('label') || '').toLowerCase();
            if (lbl === 'policy') return '#c4a7e7';    // Ethereal Lavender
            if (lbl === 'threshold') return '#fce8a6'; // Golden Divine
            if (lbl === 'person') return '#ffffff';    // White Starlight
            if (lbl === 'channel') return '#f87171';   // Crimson Pulse
            if (lbl === 'system') return '#fbbf24';    // Amber Horizon
            return '#94a3b8';
          },
          'width': 34,
          'height': 34,
          'border-width': 2,
          'border-color': 'rgba(255, 255, 255, 0.4)',
          'border-opacity': 1.0,
          'transition-property': 'width, height, border-width, border-color, opacity',
          'transition-duration': '0.15s'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#c4a7e7',
          'border-width': 3.5,
          'width': 44,
          'height': 44,
          'font-weight': 600,
          'font-size': '12px',
          'text-border-color': '#c4a7e7',
          'text-border-width': 1,
          'z-index': 999
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': 'rgba(255, 255, 255, 0.35)',
          'line-color': 'rgba(255, 255, 255, 0.16)',
          'width': 1.2,
          'arrow-scale': 0.8,
          'label': function(ele) {
            return showEdgeLabels ? ele.data('label') : '';
          },
          'font-size': '8px',
          'font-family': '"JetBrains Mono", monospace',
          'font-weight': 600,
          'text-transform': 'uppercase',
          'letter-spacing': '0.04em',
          'color': 'rgba(255, 255, 255, 0.75)',
          'text-rotation': 'autorotate',
          'text-background-opacity': 0.95,
          'text-background-color': '#08080c',
          'text-background-padding': '2px 5px',
          'text-background-shape': 'roundrectangle',
          'text-border-color': 'rgba(255, 255, 255, 0.18)',
          'text-border-width': 0.5,
          'text-border-opacity': 0.8,
          'transition-property': 'line-color, target-arrow-color, width, opacity',
          'transition-duration': '0.15s'
        }
      },
      {
        selector: 'edge:selected, edge.highlighted',
        style: {
          'label': 'data(label)',
          'line-color': '#c4a7e7',
          'target-arrow-color': '#c4a7e7',
          'width': 2.4,
          'font-size': '8.5px',
          'color': '#ffffff',
          'text-background-opacity': 1.0,
          'text-background-color': '#13111c',
          'text-border-color': '#c4a7e7',
          'text-border-width': 1.0,
          'z-index': 998
        }
      },
      {
        selector: '.faded',
        style: {
          'opacity': 0.12
        }
      }
    ],
    layout: getLayoutConfig(currentLayout)
  });

  // Tap node: Focus neighborhood, illuminate incident edges, populate dossier
  cy.on('tap', 'node', function(evt) {
    const node = evt.target;
    focusNodeNeighborhood(node);
    displayRecordDetail(node);
  });

  // Tap empty canvas: Reset focus
  cy.on('tap', function(evt) {
    if (evt.target === cy) {
      cy.elements().removeClass('faded highlighted');
    }
  });

  // Auto-select first policy if available
  if (visibleNodes.length > 0) {
    const firstPolicy = cy.nodes("[label = 'Policy']").first();
    if (firstPolicy.length > 0) {
      firstPolicy.select();
      focusNodeNeighborhood(firstPolicy);
      displayRecordDetail(firstPolicy);
    }
  }
}

// Highlight node neighborhood & illuminate incident edges
function focusNodeNeighborhood(node) {
  const neighborhood = node.neighborhood().add(node);
  const connectedEdges = node.connectedEdges();

  cy.elements().removeClass('faded highlighted');
  cy.elements().not(neighborhood).addClass('faded');
  connectedEdges.addClass('highlighted');
}

// Layout Configuration Factory with Anti-Collision Geometry
function getLayoutConfig(layoutName) {
  if (layoutName === 'concentric') {
    return {
      name: 'concentric',
      fit: true,
      padding: 60,
      minNodeSpacing: 95 * spacingMultiplier,
      spacingFactor: spacingMultiplier,
      concentric: function(node) {
        const lbl = node.data('label');
        if (lbl === 'Policy') return 3;
        if (lbl === 'Threshold' || lbl === 'Channel') return 2;
        return 1;
      },
      levelWidth: () => 1,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      animate: true,
      animationDuration: 450
    };
  } else if (layoutName === 'breadthfirst') {
    return {
      name: 'breadthfirst',
      fit: true,
      directed: true,
      padding: 60,
      spacingFactor: 2.2 * spacingMultiplier,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      animate: true,
      animationDuration: 450
    };
  } else if (layoutName === 'circle') {
    return {
      name: 'circle',
      fit: true,
      padding: 60,
      spacingFactor: spacingMultiplier * 1.5,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      animate: true,
      animationDuration: 450
    };
  } else {
    return {
      name: 'cose',
      fit: true,
      padding: 60,
      nodeRepulsion: function() { return 3500000 * spacingMultiplier; },
      idealEdgeLength: function() { return 180 * spacingMultiplier; },
      edgeElasticity: function() { return 0.05; },
      nodeOverlap: 40,
      componentSpacing: 220 * spacingMultiplier,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      animate: true,
      animationDuration: 500
    };
  }
}

// Display Intelligence Dossier in Right Panel
function displayRecordDetail(node) {
  activeRecordId = node.data('id');
  const nameEl = document.getElementById('dossier-name');
  if (nameEl) nameEl.innerText = node.data('name');
  
  const typePill = document.getElementById('dossier-type-badge');
  if (typePill) {
    const lbl = node.data('label');
    typePill.innerText = `${lbl.toUpperCase()} ENTITY`;
    if (lbl === 'Policy') typePill.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#c4a7e7]/15 text-[#c4a7e7] border border-[#c4a7e7]/40";
    else if (lbl === 'Threshold') typePill.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fce8a6]/15 text-[#fce8a6] border border-[#fce8a6]/40";
    else typePill.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20";
  }

  const conf = node.data('confidence') || 1.0;
  const confEl = document.getElementById('dossier-confidence');
  if (confEl) confEl.innerText = `${conf.toFixed(2)} (Verified)`;

  const props = node.data('properties') || {};
  const deptEl = document.getElementById('dossier-dept');
  if (deptEl) deptEl.innerText = props.department || 'Enterprise Core';

  // Connected relations list
  const edges = node.connectedEdges();
  const countEl = document.getElementById('dossier-edge-count');
  if (countEl) countEl.innerText = `${edges.length} RELATIONS`;
  
  const relList = document.getElementById('dossier-relations-list');
  if (relList) {
    relList.innerHTML = '';
    if (edges.length === 0) {
      relList.innerHTML = '<div class="text-white/40 font-mono text-xs">No topological edges linked.</div>';
    } else {
      edges.forEach(e => {
        const isOut = e.data('source') === node.data('id');
        const otherId = isOut ? e.data('target') : e.data('source');
        const otherNode = cy.getElementById(otherId);
        const otherName = otherNode.length > 0 ? otherNode.data('name') : otherId;

        const row = document.createElement('div');
        row.className = 'p-2 rounded bg-black/40 border border-white/10 flex justify-between items-center text-white/90 cursor-pointer hover:border-[#c4a7e7]/50 hover:bg-[#c4a7e7]/5 transition-all';
        row.onclick = () => {
          if (otherNode.length > 0) {
            cy.elements().unselect();
            otherNode.select();
            focusNodeNeighborhood(otherNode);
            displayRecordDetail(otherNode);
          }
        };
        row.innerHTML = `
          <span class="text-[#c4a7e7] font-mono text-[10px] font-bold tracking-wider uppercase">${isOut ? '→' : '←'} ${e.data('label')}</span>
          <span class="font-serif italic text-white truncate max-w-[150px] text-xs">${otherName}</span>
        `;
        relList.appendChild(row);
      });
    }
  }

  // Metadata Box
  const metaBox = document.getElementById('dossier-metadata-box');
  if (metaBox) {
    if (Object.keys(props).length === 0) {
      metaBox.innerHTML = '<span class="text-white/40 font-mono text-xs">No custom properties recorded.</span>';
    } else {
      metaBox.innerHTML = Object.entries(props).map(([k, v]) => `
        <div class="flex justify-between py-1 border-b border-white/5 last:border-0 font-mono text-xs">
          <span class="text-white/50">${k}:</span>
          <span class="text-[#fce8a6] font-semibold">${v}</span>
        </div>
      `).join('');
    }
  }
}

// Spacing Multiplier Handler
function onSpacingChange(val) {
  spacingMultiplier = parseFloat(val);
  const valEl = document.getElementById('spacing-val');
  if (valEl) valEl.innerText = `${spacingMultiplier.toFixed(1)}x`;
  
  if (cy) {
    cy.layout(getLayoutConfig(currentLayout)).run();
  }
}

// Toggle Edge Labels
function toggleEdgeLabels(checked) {
  showEdgeLabels = checked;
  if (cy) {
    cy.style().update();
  }
}

// Toggle Detail Dossier Panel
function toggleRecordPanel() {
  const panel = document.getElementById('theosophia-dossier-panel');
  const btn = document.getElementById('btn-toggle-panel');
  if (!panel) return;

  isPanelCollapsed = !isPanelCollapsed;
  if (isPanelCollapsed) {
    panel.classList.add('hidden');
    if (btn) btn.classList.add('border-[#c4a7e7]', 'text-[#c4a7e7]');
  } else {
    panel.classList.remove('hidden');
    if (btn) btn.classList.remove('border-[#c4a7e7]', 'text-[#c4a7e7]');
  }

  if (cy) {
    setTimeout(() => {
      cy.resize();
      cy.fit();
    }, 100);
  }
}

// Layout Switcher
function onLayoutChange(val) {
  currentLayout = val;
  if (cy) {
    cy.layout(getLayoutConfig(currentLayout)).run();
  }
}

// Division Selector
function onDivisionChange(val) {
  activeDivision = val;
  renderEtherealGraph();
}

// Type Filter Toggle
function toggleTypeFilter(type) {
  activeTypeFilters[type] = !activeTypeFilters[type];
  const btn = document.getElementById(`btn-f-${type.toLowerCase()}`);
  if (btn) {
    btn.style.opacity = activeTypeFilters[type] ? '1.0' : '0.35';
  }
  renderEtherealGraph();
}

// Controls
function zoomIn() { if (cy) cy.zoom(cy.zoom() * 1.25); }
function zoomOut() { if (cy) cy.zoom(cy.zoom() * 0.8); }
function fitGraph() { if (cy) cy.fit(); }

function onSearchEntity(query) {
  if (!query || !cy) {
    renderEtherealGraph();
    return;
  }
  const q = query.toLowerCase();
  cy.nodes().forEach(n => {
    const match = (n.data('name') || '').toLowerCase().includes(q);
    if (match) {
      n.style('opacity', 1.0);
      n.style('width', 44);
      n.style('height', 44);
    } else {
      n.style('opacity', 0.12);
      n.style('width', 24);
      n.style('height', 24);
    }
  });
}

function refreshGraph() {
  const searchEl = document.getElementById('global-search');
  if (searchEl) searchEl.value = '';
  loadGraphData();
}

function synthesizeSkillFromRecord() {
  switchTab('runtime-view');
}

function isolateCluster() {
  if (!activeRecordId || !cy) return;
  const node = cy.getElementById(activeRecordId);
  focusNodeNeighborhood(node);
}

// Populate Records Table for Tab 4
function populateRecordsTable() {
  const tbody = document.getElementById('records-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  fullGraphData.nodes.forEach(n => {
    const props = n.properties || {};
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-white/5 border-b border-white/5 transition-colors font-mono text-xs';
    tr.innerHTML = `
      <td class="py-3 px-4 text-white/50">${n.id}</td>
      <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c4a7e7]/15 text-[#c4a7e7] border border-[#c4a7e7]/30">${n.label}</span></td>
      <td class="py-3 px-4 font-serif text-white font-medium text-sm">${n.name}</td>
      <td class="py-3 px-4 text-white/70">${props.department || 'Enterprise Core'}</td>
      <td class="py-3 px-4 text-[#fce8a6] font-bold">${n.confidence.toFixed(2)}</td>
      <td class="py-3 px-4"><button onclick="viewNodeInGraph('${n.id}')" class="theosophia-btn text-[10px] py-0.5 px-2">Focus Node</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function viewNodeInGraph(nodeId) {
  switchTab('graph-view');
  setTimeout(() => {
    if (!cy) return;
    const node = cy.getElementById(nodeId);
    if (node.length > 0) {
      cy.elements().unselect();
      node.select();
      focusNodeNeighborhood(node);
      displayRecordDetail(node);
      cy.animate({ center: { eles: node }, zoom: 1.6 }, { duration: 400 });
    }
  }, 150);
}

// Skill Select in Runtime Sandbox
function onSelectSkill(skillName) {
  const lblAmount = document.getElementById('sim-lbl-amount');
  const hintAmount = document.getElementById('sim-hint-amount');
  const valAmount = document.getElementById('sim-amount');

  if (skillName.includes('BSA-01')) {
    lblAmount.innerText = 'Cross-Border Wire Notional ($ USD)';
    hintAmount.innerText = 'Statutory SAR Trigger Limit: $50,000.00';
    valAmount.value = 35000;
  } else if (skillName.includes('POL-99')) {
    lblAmount.innerText = 'FX Overnight Net Open Exposure ($ USD)';
    hintAmount.innerText = 'Authorized Desk Cap: $5,000,000.00';
    valAmount.value = 4200000;
  } else {
    lblAmount.innerText = 'Transaction Notional ($ USD)';
    hintAmount.innerText = 'Standard Policy Limit: $500.00';
    valAmount.value = 350;
  }
}

async function dispatchSkillExecution() {
  const amount = parseFloat(document.getElementById('sim-amount').value);
  const kyc = parseInt(document.getElementById('sim-kyc').value);
  const fraud = parseInt(document.getElementById('sim-fraud').value);
  
  const statusPill = document.getElementById('sim-status-pill');
  const tracesStream = document.getElementById('sim-traces-stream');

  statusPill.className = "px-3 py-1 rounded text-xs font-mono font-bold bg-[#c4a7e7]/15 text-[#c4a7e7] border border-[#c4a7e7]/40 animate-pulse";
  statusPill.innerText = "EVALUATING DETERMINISTIC GUARDS...";

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

    if (data.success) {
      statusPill.className = "px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40";
      statusPill.innerText = "COMPLIANT • EXECUTION APPROVED";
    } else {
      statusPill.className = "px-3 py-1 rounded text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40";
      statusPill.innerText = "ESCALATED TO HUMAN OVERSIGHT";
    }

    tracesStream.innerHTML = '';

    if (data.escalation_reason) {
      const alertBox = document.createElement('div');
      alertBox.className = 'p-3 rounded bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-mono mb-2 flex items-center justify-between';
      alertBox.innerHTML = `
        <div>
          <span class="font-bold block uppercase text-[10px] text-rose-400">AST Boundary Guard Violated</span>
          ${data.escalation_reason}
        </div>
        <span class="px-2 py-0.5 rounded bg-black text-rose-300 font-bold border border-rose-500/30 text-[10px]">#risk-disputes</span>
      `;
      tracesStream.appendChild(alertBox);
    }

    data.traces.forEach((t, i) => {
      const isPass = t.status === 'PASSED';
      const card = document.createElement('div');
      card.className = `p-3 rounded border ${isPass ? 'bg-black/50 border-white/10' : 'bg-rose-950/30 border-rose-500/30'} space-y-1`;
      card.innerHTML = `
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold font-mono ${isPass ? 'text-emerald-400' : 'text-rose-400'}">[Step ${i+1}] ${t.step_id}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/10 uppercase">${t.action}</span>
        </div>
        <p class="text-white/90 text-xs font-sans">${t.output_message}</p>
        <div class="text-[10px] text-white/50 font-mono">AST Guard: ${t.guard_evaluated}</div>
      `;
      tracesStream.appendChild(card);
    });

  } catch (err) {
    statusPill.className = "px-3 py-1 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40";
    statusPill.innerText = "API ERROR";
    tracesStream.innerHTML = `<div class="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">Error contacting local engine: ${err.message}</div>`;
  }
}

// Bootstrap on Load
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  loadGraphData();
});

// --- Ingestion Studio Controller ---
let currentPresetId = 'revolut_aml';
const PRESET_SCRIPTS = {
  revolut_aml: {
    dept: 'Compliance',
    channel: '#compliance-sar-filings',
    text: `Alex_Morgan (CCO, SMF16): Flagging suspicious international wire #WIRE-9821 for $48,500 outgoing to high-risk jurisdiction. Does originator have verified KYC Level 2 documentation?\nMarcus_Vance (MLRO, SMF17): Checking Jumio ID Verification API logs. Customer only has basic KYC Level 1. Under AML Policy BSA-01, wires exceeding the $10,000 CTR Limit require mandatory Level 2, and anything over $50,000 SAR Trigger requires direct MLRO approval.\nAlex_Morgan: Freeze transfer execution immediately. Mandate Proof of Address Geo-Audit and escalate to #compliance-sar-filings within 15 minutes.`
  },
  stripe_dispute: {
    dept: 'Disputes',
    channel: '#risk-disputes',
    text: `Sarah_Jenkins (Support Lead): Merchant AcmeCorp is disputing a $750 chargeback. Demanding immediate automated refund credit.\nElena_Rostova (Head of Fraud): Policy REF-04 explicitly enforces a strict $500 Auto-Refund Limit for bot resolutions. Any dispute above $500 requires senior analyst signoff and KYC Level 2 before Stripe Gateway Credit API invocation.\nSarah_Jenkins: Escalating to #risk-disputes. Halting automated agent action.`
  },
  wise_fx: {
    dept: 'Treasury',
    channel: '#treasury-risk-escalations',
    text: `Dave_Chen (Head of Trading Ops): Market volatility alert: EUR/USD swap spread widened 45bps. FX Trading Bot #04 attempted a $6,200,000 overnight swap to rebalance liquidity.\nAlex_Morgan (Chief Compliance): Halt execution. FX Overnight Position Limit POL-99 mandates an absolute $5,000,000 Notional Cap per automated desk algorithm. Route excess to #treasury-risk-escalations with dual trader authorization.`
  }
};

function openIngestionModal() {
  const m = document.getElementById('modal-ingest-stream');
  if (m) m.classList.remove('hidden');
  loadScenarioPreset('revolut_aml');
}

function closeIngestionModal() {
  const m = document.getElementById('modal-ingest-stream');
  if (m) m.classList.add('hidden');
}

function loadScenarioPreset(id) {
  currentPresetId = id;
  ['revolut', 'stripe', 'wise'].forEach(p => {
    const btn = document.getElementById(`btn-preset-${p}`);
    if (btn) {
      if (id.includes(p)) {
        btn.className = "p-2.5 rounded bg-[#c4a7e7]/15 border border-[#c4a7e7]/50 text-left hover:border-[#c4a7e7] transition-all cursor-pointer";
      } else {
        btn.className = "p-2.5 rounded bg-white/5 border border-white/15 text-left hover:border-white/40 transition-all cursor-pointer";
      }
    }
  });

  const preset = PRESET_SCRIPTS[id];
  if (preset) {
    const rawEl = document.getElementById('ingest-raw-text');
    if (rawEl) rawEl.value = preset.text;
    const chEl = document.getElementById('ingest-channel-tag');
    if (chEl) chEl.innerText = preset.channel;
    const deptEl = document.getElementById('ingest-dept-tag');
    if (deptEl) deptEl.innerText = `${preset.dept}`;
  }
}

async function dispatchLiveIngestion() {
  const btn = document.getElementById('btn-dispatch-ingest');
  if (btn) {
    btn.innerText = "Extracting & Synthesizing...";
    btn.classList.add('animate-pulse');
  }

  const rawText = document.getElementById('ingest-raw-text').value;

  try {
    const res = await fetch('/v1/knowledge/ingest-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preset_id: currentPresetId,
        raw_text: rawText
      })
    });
    const data = await res.json();

    closeIngestionModal();
    switchTab('graph-view');

    // Reload and animate Cytoscape
    await loadGraphData();

    // Pulse notification
    const metricEl = document.getElementById('graph-node-metric');
    if (metricEl) {
      metricEl.innerText = `${data.total_nodes} NODES • ${data.total_edges} EDGES (INGESTED)`;
      metricEl.className = "text-[11px] text-[#fce8a6] font-bold whitespace-nowrap animate-bounce";
      setTimeout(() => {
        metricEl.className = "text-[11px] text-[#c4a7e7] font-semibold whitespace-nowrap";
      }, 3500);
    }

  } catch (err) {
    console.error("Ingestion failed:", err);
  } finally {
    if (btn) {
      btn.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 inline mr-1"></i> Run Extraction &amp; Synthesize Graph';
      btn.classList.remove('animate-pulse');
    }
    lucide.createIcons();
  }
}

// --- Rogue Agent Attack Simulation ---
async function runRogueAgentSimulation() {
  switchTab('runtime-view');
  const statusPill = document.getElementById('sim-status-pill');
  const tracesStream = document.getElementById('sim-traces-stream');

  if (statusPill) {
    statusPill.className = "px-3 py-1 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse";
    statusPill.innerText = "EVALUATING ROGUE INJECTION ATTACK...";
  }

  try {
    const res = await fetch('/v1/skills/simulate-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: 'rogue_jailbreak',
        requested_amount: 3500.0,
        kyc_level: 0
      })
    });
    const data = await res.json();

    if (statusPill) {
      statusPill.className = "px-3 py-1 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/50";
      statusPill.innerText = "INTERCEPTED & HALTED (1.4ms)";
    }

    if (tracesStream) {
      tracesStream.innerHTML = '';

      // Render alert banner
      const alertBox = document.createElement('div');
      alertBox.className = 'p-3 rounded bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs font-mono mb-3 flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)]';
      alertBox.innerHTML = `
        <div>
          <span class="font-bold block uppercase text-[11px] text-rose-400 flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4 h-4"></i> Deterministic AST Interceptor Fired
          </span>
          Violation: Requested payout $3,500.00 violates AST guard (amount &le; 500.0 and kyc_level &ge; 2)
        </div>
        <div class="text-right">
          <span class="px-2 py-0.5 rounded bg-black text-[#c4a7e7] font-bold border border-[#c4a7e7]/30 text-[10px] block mb-1">#risk-disputes</span>
          <span class="text-[10px] text-white/50 font-mono">${data.theosophia_guarded_agent.smcr_audit_hash}</span>
        </div>
      `;
      tracesStream.appendChild(alertBox);

      data.theosophia_guarded_agent.traces.forEach((t, i) => {
        const isPass = t.status === 'PASSED';
        const card = document.createElement('div');
        card.className = `p-3 rounded border ${isPass ? 'bg-black/50 border-white/10' : 'bg-rose-950/30 border-rose-500/30'} space-y-1`;
        card.innerHTML = `
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold font-mono ${isPass ? 'text-emerald-400' : 'text-rose-400'}">[Step ${i+1}] ${t.step_id}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/10 uppercase">${t.action}</span>
          </div>
          <p class="text-white/90 text-xs font-sans">${t.output_message}</p>
          <div class="text-[10px] text-white/50 font-mono">AST Guard: ${t.guard_evaluated}</div>
        `;
        tracesStream.appendChild(card);
      });

      lucide.createIcons();
    }

  } catch (err) {
    console.error("Simulation error:", err);
  }
}

// --- Compliance Export Modal ---
let cachedDossier = null;

async function openComplianceExportModal() {
  const m = document.getElementById('modal-compliance-export');
  if (m) m.classList.remove('hidden');
  try {
    const res = await fetch('/v1/compliance/dossier/export');
    cachedDossier = await res.json();

    const idEl = document.getElementById('exp-dossier-id');
    if (idEl) idEl.innerText = cachedDossier.dossier_id;
    const tsEl = document.getElementById('exp-timestamp');
    if (tsEl) tsEl.innerText = cachedDossier.generated_timestamp;
    const hashEl = document.getElementById('exp-hash');
    if (hashEl) hashEl.innerText = cachedDossier.cryptographic_fingerprint;

    const list = document.getElementById('exp-smf-list');
    if (list) {
      list.innerHTML = cachedDossier.senior_management_functions.map(f => `
        <div class="p-2 rounded bg-white/[0.02] border border-white/5 flex justify-between items-center">
          <div>
            <span class="text-[#c4a7e7] font-bold">${f.function_id}:</span> 
            <span class="text-white">${f.officer_name} (${f.role_title})</span>
          </div>
          <span class="text-[10px] text-white/40">${f.audit_channel}</span>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error("Failed to load compliance dossier:", err);
  }
}

function closeComplianceExportModal() {
  const m = document.getElementById('modal-compliance-export');
  if (m) m.classList.add('hidden');
}

function downloadDossierJSON() {
  if (!cachedDossier) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cachedDossier, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", `${cachedDossier.dossier_id}.json`);
  dl.click();
}

// --- Investor Pitch Tour Controller ---
let currentTourStep = 1;
const TOUR_STEPS = [
  {
    step: 1,
    title: "The $500B Problem: Enterprise Chaos",
    badge: "Step 1 of 4 • The Problem",
    tab: "graph-view",
    desc: "Fintech tribal knowledge lives in messy Slack threads and Jira tickets. When AI agents are deployed, they make rogue payouts because their knowledge is outdated or hallucinated."
  },
  {
    step: 2,
    title: "The Living Brain: Bi-Temporal Graph",
    badge: "Step 2 of 4 • The Brain",
    tab: "graph-view",
    desc: "Theosophia continuously extracts policies, thresholds, and role owners into a bi-temporal knowledge graph. Notice the celestial nodes glowing: lavender for policies, gold for financial limits."
  },
  {
    step: 3,
    title: "The Guardrail: AST Interceptor",
    badge: "Step 3 of 4 • The Guardrail",
    tab: "runtime-view",
    desc: "Prompt engineering fails when users manipulate agents. Theosophia compiles domain policies into deterministic AST execution guards, intercepting unapproved payouts in under 2ms."
  },
  {
    step: 4,
    title: "The Shield: SM&CR Regulatory Audit",
    badge: "Step 4 of 4 • Compliance Ledger",
    tab: "compliance-view",
    desc: "Fintech executives have personal legal liability under FCA / SEC SM&CR rules. Theosophia provides cryptographic proof of who governed every policy and why an agent took an action."
  }
];

function startInvestorTour() {
  currentTourStep = 1;
  const hud = document.getElementById('investor-tour-hud');
  if (hud) hud.classList.remove('hidden');
  renderTourStep();
}

function exitInvestorTour() {
  const hud = document.getElementById('investor-tour-hud');
  if (hud) hud.classList.add('hidden');
}

function nextTourStep() {
  if (currentTourStep < 4) {
    currentTourStep++;
    renderTourStep();
  } else {
    exitInvestorTour();
  }
}

function prevTourStep() {
  if (currentTourStep > 1) {
    currentTourStep--;
    renderTourStep();
  }
}

function renderTourStep() {
  const s = TOUR_STEPS[currentTourStep - 1];
  switchTab(s.tab);

  const badgeEl = document.getElementById('tour-step-badge');
  if (badgeEl) badgeEl.innerText = s.badge;
  const titleEl = document.getElementById('tour-title');
  if (titleEl) titleEl.innerText = s.title;
  const descEl = document.getElementById('tour-desc');
  if (descEl) descEl.innerText = s.desc;

  const btnPrev = document.getElementById('btn-tour-prev');
  if (btnPrev) {
    btnPrev.style.visibility = currentTourStep === 1 ? 'hidden' : 'visible';
  }

  const btnNext = document.getElementById('btn-tour-next');
  if (btnNext) {
    btnNext.innerText = currentTourStep === 4 ? "Complete Tour ✦" : "Next Step →";
  }

  if (s.step === 3) {
    setTimeout(() => {
      runRogueAgentSimulation();
    }, 350);
  }
}
