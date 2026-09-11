// Theosophia Institutional Banking & Canva Studio Interface Logic
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

// Tab Switcher
function switchTab(tabId) {
  const titles = {
    'graph-explorer': 'Knowledge Topology Navigator',
    'skill-runtime': 'Autonomous Skill Execution Runtime',
    'audit-provenance': 'Fintech SM&CR Governance Register'
  };

  document.getElementById('current-view-name').innerText = titles[tabId] || 'Workspace';

  document.getElementById('tab-btn-graph').className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all text-left";
  document.getElementById('tab-btn-runtime').className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all text-left";
  document.getElementById('tab-btn-audit').className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all text-left";

  document.getElementById('tab-content-graph').classList.add('hidden');
  document.getElementById('tab-content-runtime').classList.add('hidden');
  document.getElementById('tab-content-audit').classList.add('hidden');

  if (tabId === 'graph-explorer') {
    document.getElementById('tab-btn-graph').className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/10 text-white font-semibold shadow-sm transition-all text-left";
    document.getElementById('tab-content-graph').classList.remove('hidden');
    if (cy) {
      setTimeout(() => cy.resize().fit(), 100);
    }
  } else if (tabId === 'skill-runtime') {
    document.getElementById('tab-btn-runtime').className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/10 text-white font-semibold shadow-sm transition-all text-left";
    document.getElementById('tab-content-runtime').classList.remove('hidden');
  } else if (tabId === 'audit-provenance') {
    document.getElementById('tab-btn-audit').className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/10 text-white font-semibold shadow-sm transition-all text-left";
    document.getElementById('tab-content-audit').classList.remove('hidden');
  }
}

// Load Graph Data From Backend
async function loadGraphData() {
  try {
    const res = await fetch('/v1/knowledge/graph');
    fullGraphData = await res.json();
    renderFilteredGraph();
  } catch (err) {
    console.error('Failed to load graph data:', err);
  }
}

// Render Graph with Institutional Banking Color Tokens
function renderFilteredGraph() {
  const container = document.getElementById('cy');
  if (!container) return;

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

  // Cytoscape with crisp institutional typography & shadows
  cy = cytoscape({
    container: container,
    elements: cyElements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(name)',
          'color': '#0f172a',
          'font-size': '11px',
          'font-family': 'Plus Jakarta Sans, sans-serif',
          'font-weight': 700,
          'text-valign': 'bottom',
          'text-margin-y': 7,
          'text-background-opacity': 0.9,
          'text-background-color': '#ffffff',
          'text-background-padding': '4px',
          'text-background-shape': 'roundrectangle',
          'background-color': function(ele) {
            const lbl = (ele.data('label') || '').toLowerCase();
            if (lbl === 'policy') return '#002244'; // J.P. Morgan Navy
            if (lbl === 'threshold') return '#059669'; // Emerald Limit
            if (lbl === 'person') return '#0284c7'; // Principal Blue
            if (lbl === 'channel') return '#cc0000'; // Bain Red Escalation
            if (lbl === 'system') return '#c5a059'; // Goldman Sachs Gold
            return '#475569';
          },
          'width': 34,
          'height': 34,
          'border-width': 3,
          'border-color': '#ffffff',
          'border-opacity': 1.0,
          'shadow-blur': 8,
          'shadow-color': 'rgba(0, 34, 68, 0.15)',
          'shadow-offset-y': 3,
          'transition-property': 'width, height, border-width, border-color',
          'transition-duration': '0.15s'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#c5a059', // Goldman Gold Accent on Select
          'border-width': 4,
          'width': 42,
          'height': 42
        }
      },
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'color': '#64748b',
          'font-size': '9px',
          'font-family': 'JetBrains Mono, monospace',
          'font-weight': 600,
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#94a3b8',
          'line-color': '#cbd5e1',
          'width': 1.8,
          'arrow-scale': 0.8,
          'text-rotation': 'autorotate',
          'text-margin-y': -7
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#002244',
          'target-arrow-color': '#002244',
          'width': 2.8
        }
      }
    ],
    layout: {
      name: 'cose',
      idealEdgeLength: 110,
      nodeOverlap: 25,
      refresh: 20,
      fit: true,
      padding: 50,
      randomize: false,
      componentSpacing: 110,
      nodeRepulsion: 500000,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 70,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0
    }
  });

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

// Drawer View Logic
function openDrawer(node) {
  selectedNodeId = node.data('id');
  const drawer = document.getElementById('graph-drawer');
  drawer.classList.remove('hidden');

  document.getElementById('drawer-title').innerText = node.data('name');
  document.getElementById('drawer-type-badge').innerText = node.data('label');
  
  const conf = node.data('confidence') || 1.0;
  document.getElementById('drawer-confidence-text').innerText = conf.toFixed(2);
  document.getElementById('drawer-confidence-bar').style.width = `${Math.round(conf * 100)}%`;

  const connectedEdges = node.connectedEdges();
  const relContainer = document.getElementById('drawer-relations');
  relContainer.innerHTML = '';
  
  if (connectedEdges.length === 0) {
    relContainer.innerHTML = '<span class="text-slate-400">No direct relationships</span>';
  } else {
    connectedEdges.forEach(e => {
      const isOut = e.data('source') === node.data('id');
      const otherId = isOut ? e.data('target') : e.data('source');
      const otherNode = cy.getElementById(otherId);
      const otherName = otherNode.length > 0 ? otherNode.data('name') : otherId;

      const item = document.createElement('div');
      item.className = 'p-2 rounded-lg bg-white border border-slate-200 flex justify-between items-center text-slate-700 shadow-sm';
      item.innerHTML = `
        <span class="text-[#005a9c] font-bold text-[11px]">${isOut ? '→' : '←'} ${e.data('label')}</span>
        <span class="truncate max-w-[130px] font-semibold text-slate-900 text-[11px]">${otherName}</span>
      `;
      relContainer.appendChild(item);
    });
  }

  const props = node.data('properties') || {};
  const metaContainer = document.getElementById('drawer-metadata');
  if (Object.keys(props).length === 0) {
    metaContainer.innerText = 'No attached division metadata.';
  } else {
    metaContainer.innerHTML = Object.entries(props).map(([k, v]) => `<div class="flex justify-between py-0.5"><span class="text-slate-500 font-medium">${k}:</span> <span class="font-bold text-slate-900">${v}</span></div>`).join('');
  }
}

function closeDrawer() {
  document.getElementById('graph-drawer').classList.add('hidden');
  selectedNodeId = null;
}

function onWorkspaceChange(val) {
  activeWorkspace = val;
  renderFilteredGraph();
}

function toggleTypeFilter(typeName) {
  activeFilters[typeName] = !activeFilters[typeName];
  const btn = document.getElementById(`btn-filter-${typeName.toLowerCase()}`);
  if (btn) {
    if (activeFilters[typeName]) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
  renderFilteredGraph();
}

function onDepthChange(val) {
  renderFilteredGraph();
}

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
      n.style('width', 44);
      n.style('height', 44);
    } else {
      n.style('opacity', 0.15);
      n.style('width', 24);
      n.style('height', 24);
    }
  });
}

function refreshGraph() {
  document.getElementById('graph-search-input').value = '';
  loadGraphData();
}

function compileFromSelectedNode() {
  if (!selectedNodeId) return;
  switchTab('skill-runtime');
}

function onSelectSkill(skillName) {
  const lblAmount = document.getElementById('lbl-param-amount');
  const hintAmount = document.getElementById('hint-param-amount');
  const valAmount = document.getElementById('runtime-amount');

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
    hintAmount.innerText = 'Statutory guard limit: $500.00';
    valAmount.value = 350;
  }
}

async function dispatchSkillExecution() {
  const amount = parseFloat(document.getElementById('runtime-amount').value);
  const kyc = parseInt(document.getElementById('runtime-kyc').value);
  const fraud = parseInt(document.getElementById('runtime-fraud').value);
  
  const statusPill = document.getElementById('runtime-status-pill');
  const tracesStream = document.getElementById('runtime-traces-stream');

  statusPill.className = "px-3 py-1 rounded-full text-[11px] font-mono font-extrabold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse";
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
      statusPill.className = "px-3 py-1 rounded-full text-[11px] font-mono font-extrabold bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]";
      statusPill.innerText = "APPROVED (COMPLIANT)";
    } else {
      statusPill.className = "px-3 py-1 rounded-full text-[11px] font-mono font-extrabold bg-red-50 text-[#cc0000] border border-red-200";
      statusPill.innerText = "ESCALATED TO HUMAN OFFICER";
    }

    tracesStream.innerHTML = '';

    if (data.escalation_reason) {
      const alertBox = document.createElement('div');
      alertBox.className = 'p-4 rounded-xl bg-red-50 border border-red-200 text-[#991b1b] text-xs font-mono mb-3 flex items-center justify-between shadow-sm';
      alertBox.innerHTML = `
        <div>
          <span class="font-extrabold block uppercase text-[10px] text-[#cc0000]">Statutory Boundary Exceeded</span>
          ${data.escalation_reason}
        </div>
        <span class="px-2.5 py-1 rounded-full bg-white text-[#cc0000] text-[10px] font-bold border border-red-200">#risk-disputes</span>
      `;
      tracesStream.appendChild(alertBox);
    }

    data.traces.forEach((t, i) => {
      const isPass = t.status === 'PASSED';
      const card = document.createElement('div');
      card.className = `p-4 rounded-xl border ${isPass ? 'bg-white border-slate-200' : 'bg-red-50/50 border-red-200'} shadow-sm space-y-1`;
      card.innerHTML = `
        <div class="flex justify-between items-center text-xs">
          <span class="font-extrabold font-mono ${isPass ? 'text-[#059669]' : 'text-[#cc0000]'}">[Step ${i+1}] ${t.step_id}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase">${t.action}</span>
        </div>
        <p class="text-slate-800 text-xs font-semibold pt-0.5">${t.output_message}</p>
        <div class="text-[10px] text-slate-500 font-mono pt-1">AST Guard: ${t.guard_evaluated}</div>
      `;
      tracesStream.appendChild(card);
    });

  } catch (err) {
    statusPill.className = "px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-red-50 text-red-700";
    statusPill.innerText = "API CONNECTION ERROR";
    tracesStream.innerHTML = `<div class="p-4 bg-red-50 text-red-700 text-xs font-mono rounded-xl border border-red-200">Failed to communicate with runtime: ${err.message}</div>`;
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  loadGraphData();
});
