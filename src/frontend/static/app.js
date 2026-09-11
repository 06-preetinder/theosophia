// Theosophia Enterprise App Logic
let fullGraphData = { nodes: [], edges: [] };
let cy = null;
let activeWorkspace = 'ALL';
let activeFilters = {
  Policy: true,
  Threshold: true,
  Person: true,
  Channel: true,
  System: true
};
let selectedNodeId = null;

// Tab Switching
function switchTab(tabId) {
  const tabs = ['graph-explorer', 'skill-runtime', 'audit-provenance'];
  const titles = {
    'graph-explorer': 'Interactive Enterprise Graph Navigator',
    'skill-runtime': 'Autonomous Skill Execution Runtime',
    'audit-provenance': 'Fintech SM&CR Policy & Audit Register'
  };

  document.getElementById('current-view-name').innerText = titles[tabId] || 'Workspace';

  document.getElementById('tab-btn-graph').className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all text-left";
  document.getElementById('tab-btn-runtime').className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all text-left";
  document.getElementById('tab-btn-audit').className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all text-left";

  document.getElementById('tab-content-graph').classList.add('hidden');
  document.getElementById('tab-content-runtime').classList.add('hidden');
  document.getElementById('tab-content-audit').classList.add('hidden');

  if (tabId === 'graph-explorer') {
    document.getElementById('tab-btn-graph').className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/15 text-white border border-indigo-500/30 transition-all text-left font-semibold";
    document.getElementById('tab-content-graph').classList.remove('hidden');
    if (cy) {
      setTimeout(() => cy.resize().fit(), 100);
    }
  } else if (tabId === 'skill-runtime') {
    document.getElementById('tab-btn-runtime').className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/15 text-white border border-indigo-500/30 transition-all text-left font-semibold";
    document.getElementById('tab-content-runtime').classList.remove('hidden');
  } else if (tabId === 'audit-provenance') {
    document.getElementById('tab-btn-audit').className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/15 text-white border border-indigo-500/30 transition-all text-left font-semibold";
    document.getElementById('tab-content-audit').classList.remove('hidden');
  }
}

// Fetch Full Graph From API
async function loadGraphData() {
  try {
    const res = await fetch('/v1/knowledge/graph');
    fullGraphData = await res.json();
    renderFilteredGraph();
  } catch (err) {
    console.error('Failed to load graph:', err);
  }
}

// Render Cytoscape with Smooth Dribbble Palette
function renderFilteredGraph() {
  const container = document.getElementById('cy');
  if (!container) return;

  // Filter nodes based on active division and type toggles
  const visibleNodes = fullGraphData.nodes.filter(n => {
    const typeAllowed = activeFilters[n.label] !== false;
    let deptAllowed = true;
    if (activeWorkspace !== 'ALL') {
      const dept = (n.properties && n.properties.department) || '';
      deptAllowed = dept.toLowerCase().includes(activeWorkspace.toLowerCase());
    }
    return typeAllowed && deptAllowed;
  });

  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

  const visibleEdges = fullGraphData.edges.filter(e => {
    return visibleNodeIds.has(e.source_id) && visibleNodeIds.has(e.target_id);
  });

  document.getElementById('node-count-badge').innerText = `${visibleNodes.length} Nodes • ${visibleEdges.length} Edges`;

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

  // Cytoscape Instance with Dribbble Dark Fintech Theme
  cy = cytoscape({
    container: container,
    elements: cyElements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(name)',
          'color': '#cbd5e1',
          'font-size': '10px',
          'font-family': 'Plus Jakarta Sans, sans-serif',
          'font-weight': 600,
          'text-valign': 'bottom',
          'text-margin-y': 6,
          'text-background-opacity': 0.8,
          'text-background-color': '#080c14',
          'text-background-padding': '3px',
          'text-background-shape': 'roundrectangle',
          'background-color': function(ele) {
            const lbl = (ele.data('label') || '').toLowerCase();
            if (lbl === 'policy') return '#a855f7'; // Purple
            if (lbl === 'threshold') return '#10b981'; // Emerald
            if (lbl === 'person') return '#06b6d4'; // Cyan
            if (lbl === 'channel') return '#f43f5e'; // Rose
            if (lbl === 'system') return '#f59e0b'; // Amber
            return '#6366f1'; // Indigo
          },
          'width': 32,
          'height': 32,
          'border-width': 2,
          'border-color': '#ffffff',
          'border-opacity': 0.25,
          'transition-property': 'background-color, border-width, width, height',
          'transition-duration': '0.2s'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#6366f1',
          'border-width': 4,
          'border-opacity': 1.0,
          'width': 38,
          'height': 38
        }
      },
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'color': '#64748b',
          'font-size': '8px',
          'font-family': 'JetBrains Mono, monospace',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#475569',
          'line-color': '#1e293b',
          'width': 1.5,
          'arrow-scale': 0.8,
          'text-rotation': 'autorotate',
          'text-margin-y': -6
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#6366f1',
          'target-arrow-color': '#6366f1',
          'width': 2.5
        }
      }
    ],
    layout: {
      name: 'cose',
      idealEdgeLength: 100,
      nodeOverlap: 20,
      refresh: 20,
      fit: true,
      padding: 40,
      randomize: false,
      componentSpacing: 100,
      nodeRepulsion: 400000,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0
    }
  });

  // Tap handler to open inspector drawer
  cy.on('tap', 'node', function(evt) {
    const node = evt.target;
    openDrawer(node);
  });

  cy.on('tap', function(evt) {
    if (evt.target === cy) {
      closeDrawer();
    }
  });
}

// Open Node Details Drawer
function openDrawer(node) {
  selectedNodeId = node.data('id');
  const drawer = document.getElementById('graph-drawer');
  drawer.classList.remove('hidden');

  document.getElementById('drawer-title').innerText = node.data('name');
  document.getElementById('drawer-type-badge').innerText = node.data('label');
  
  const conf = node.data('confidence') || 1.0;
  document.getElementById('drawer-confidence-text').innerText = conf.toFixed(2);
  document.getElementById('drawer-confidence-bar').style.width = `${Math.round(conf * 100)}%`;

  // Connected edges
  const connectedEdges = node.connectedEdges();
  const relContainer = document.getElementById('drawer-relations');
  relContainer.innerHTML = '';
  
  if (connectedEdges.length === 0) {
    relContainer.innerHTML = '<span class="text-slate-500">No direct edges</span>';
  } else {
    connectedEdges.forEach(e => {
      const isOut = e.data('source') === node.data('id');
      const otherId = isOut ? e.data('target') : e.data('source');
      const otherNode = cy.getElementById(otherId);
      const otherName = otherNode.length > 0 ? otherNode.data('name') : otherId;

      const item = document.createElement('div');
      item.className = 'p-1.5 rounded bg-black/40 border border-white/5 flex justify-between items-center text-slate-300';
      item.innerHTML = `
        <span class="text-indigo-400 font-bold">${isOut ? '→' : '←'} ${e.data('label')}</span>
        <span class="truncate max-w-[140px] text-slate-200">${otherName}</span>
      `;
      relContainer.appendChild(item);
    });
  }

  // Metadata
  const props = node.data('properties') || {};
  const metaContainer = document.getElementById('drawer-metadata');
  if (Object.keys(props).length === 0) {
    metaContainer.innerText = 'No extra properties attached.';
  } else {
    metaContainer.innerHTML = Object.entries(props).map(([k, v]) => `<div><span class="text-slate-500">${k}:</span> ${v}</div>`).join('');
  }
}

function closeDrawer() {
  document.getElementById('graph-drawer').classList.add('hidden');
  selectedNodeId = null;
}

// Workspace change handler
function onWorkspaceChange(val) {
  activeWorkspace = val;
  renderFilteredGraph();
}

// Filter button toggle
function toggleTypeFilter(typeName) {
  activeFilters[typeName] = !activeFilters[typeName];
  const btn = document.getElementById(`btn-filter-${typeName.toLowerCase()}`);
  if (btn) {
    if (activeFilters[typeName]) {
      btn.style.opacity = '1.0';
      btn.style.borderColor = '';
    } else {
      btn.style.opacity = '0.35';
    }
  }
  renderFilteredGraph();
}

// Hop depth change handler
function onDepthChange(val) {
  renderFilteredGraph();
}

// Entity search bar filter
function onSearchEntity(query) {
  if (!query || !cy) {
    renderFilteredGraph();
    return;
  }
  const q = query.toLowerCase();
  cy.nodes().forEach(n => {
    const name = (n.data('name') || '').toLowerCase();
    if (name.includes(q)) {
      n.style('opacity', 1.0);
      n.style('width', 40);
      n.style('height', 40);
    } else {
      n.style('opacity', 0.15);
      n.style('width', 20);
      n.style('height', 20);
    }
  });
}

function refreshGraph() {
  document.getElementById('graph-search-input').value = '';
  loadGraphData();
}

function compileFromSelectedNode() {
  if (!selectedNodeId) return;
  const node = cy.getElementById(selectedNodeId);
  const name = node.data('name');
  switchTab('skill-runtime');
  const sel = document.getElementById('runtime-skill-select');
  if (sel) {
    sel.value = 'Policy REF-04'; // Default to compiled refund policy
  }
}

// Skill Runtime Selection & Dispatch
function onSelectSkill(skillName) {
  const lblAmount = document.getElementById('lbl-param-amount');
  const hintAmount = document.getElementById('hint-param-amount');
  const valAmount = document.getElementById('runtime-amount');

  if (skillName.includes('BSA-01')) {
    lblAmount.innerText = 'Cross-Border Wire Amount ($ USD)';
    hintAmount.innerText = 'Statutory SAR trigger: $50,000.00';
    valAmount.value = 35000;
  } else if (skillName.includes('POL-99')) {
    lblAmount.innerText = 'FX Overnight Net Open Exposure ($ USD)';
    hintAmount.innerText = 'Approved desk limit: $5,000,000.00';
    valAmount.value = 4200000;
  } else {
    lblAmount.innerText = 'Transaction Value ($ USD)';
    hintAmount.innerText = 'Statutory guard limit: $500.00';
    valAmount.value = 350;
  }
}

async function dispatchSkillExecution() {
  const skillName = document.getElementById('runtime-skill-select').value;
  const amount = parseFloat(document.getElementById('runtime-amount').value);
  const kyc = parseInt(document.getElementById('runtime-kyc').value);
  const fraud = parseInt(document.getElementById('runtime-fraud').value);
  
  const statusPill = document.getElementById('runtime-status-pill');
  const tracesStream = document.getElementById('runtime-traces-stream');

  statusPill.className = "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-400 animate-pulse";
  statusPill.innerText = "EVALUATING AST GUARDS...";

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
      statusPill.className = "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
      statusPill.innerText = "EXECUTED (COMPLIANT)";
    } else {
      statusPill.className = "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40";
      statusPill.innerText = "ESCALATED TO HUMAN REVIEW";
    }

    tracesStream.innerHTML = '';

    if (data.escalation_reason) {
      const alertBox = document.createElement('div');
      alertBox.className = 'p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-mono mb-2 flex items-center justify-between';
      alertBox.innerHTML = `
        <div>
          <span class="font-bold block uppercase text-[10px] text-rose-400">Boundary Condition Tripped</span>
          ${data.escalation_reason}
        </div>
        <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/30">#risk-disputes</span>
      `;
      tracesStream.appendChild(alertBox);
    }

    data.traces.forEach((t, i) => {
      const isPass = t.status === 'PASSED';
      const card = document.createElement('div');
      card.className = `p-3.5 rounded-xl border ${isPass ? 'bg-black/40 border-emerald-500/25' : 'bg-rose-950/20 border-rose-500/30'} space-y-1`;
      card.innerHTML = `
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold font-mono ${isPass ? 'text-emerald-400' : 'text-rose-400'}">[Step ${i+1}] ${t.step_id}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 uppercase">${t.action}</span>
        </div>
        <p class="text-slate-300 text-xs font-sans">${t.output_message}</p>
        <div class="text-[10px] text-slate-500 font-mono pt-1">AST Guard: ${t.guard_evaluated}</div>
      `;
      tracesStream.appendChild(card);
    });

  } catch (err) {
    statusPill.className = "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400";
    statusPill.innerText = "API ERROR";
    tracesStream.innerHTML = `<div class="p-3 bg-rose-950/30 text-rose-300 text-xs font-mono">Error communicating with local server: ${err.message}</div>`;
  }
}

// Initial bootstrap
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  loadGraphData();
});
