// Theosophia Salesforce Lightning Studio Logic
let fullGraphData = { nodes: [], edges: [] };
let cy = null;
let activeDivision = 'ALL';
let currentLayout = 'concentric';
let activeTypeFilters = {
  Policy: true,
  Threshold: true,
  Person: true,
  Channel: true,
  System: true
};
let activeRecordId = null;

// Context Tab Switcher
function switchTab(tabId) {
  const tabs = ['graph-view', 'runtime-view', 'compliance-view', 'records-view'];
  const titles = {
    'graph-view': 'Global Financial Knowledge Graph Studio',
    'runtime-view': 'Process Flow Automation & Skill Execution Runtime',
    'compliance-view': 'SM&CR Statutory Regulatory Compliance Register',
    'records-view': 'Standard Knowledge Policy Objects & Records'
  };

  document.getElementById('slds-header-title').innerText = titles[tabId] || 'Workspace';

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
    }, 100);
  } else if (tabId === 'records-view') {
    populateRecordsTable();
  }
}

// Load Graph Data From API
async function loadGraphData() {
  try {
    const res = await fetch('/v1/knowledge/graph');
    fullGraphData = await res.json();
    renderSalesforceGraph();
  } catch (err) {
    console.error('Failed to load graph data:', err);
  }
}

// Render Graph with Clean Salesforce Aesthetics and Predictable Geometry
function renderSalesforceGraph() {
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

  document.getElementById('slds-node-metric').innerText = `${visibleNodes.length} Nodes • ${visibleEdges.length} Edges`;

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

  // Cytoscape with Salesforce Lightning Clean Crisp Theme
  cy = cytoscape({
    container: container,
    elements: cyElements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(name)',
          'color': '#080707',
          'font-size': '11px',
          'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          'font-weight': 600,
          'text-valign': 'bottom',
          'text-margin-y': 6,
          'text-background-opacity': 0.95,
          'text-background-color': '#ffffff',
          'text-background-padding': '3px',
          'text-background-shape': 'roundrectangle',
          'background-color': function(ele) {
            const lbl = (ele.data('label') || '').toLowerCase();
            if (lbl === 'policy') return '#0176d3';    // Salesforce Action Blue
            if (lbl === 'threshold') return '#2e844a'; // Salesforce Success Green
            if (lbl === 'person') return '#00a1e0';    // Sky Blue Principal
            if (lbl === 'channel') return '#ea001e';   // Salesforce Danger Red
            if (lbl === 'system') return '#fe9339';    // Warning Orange System
            return '#706e6b';
          },
          'width': 30,
          'height': 30,
          'border-width': 2,
          'border-color': '#ffffff',
          'border-opacity': 1.0,
          'transition-property': 'width, height, border-width, border-color',
          'transition-duration': '0.12s'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#001639',
          'border-width': 4,
          'width': 38,
          'height': 38
        }
      },
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'color': '#706e6b',
          'font-size': '9px',
          'font-family': 'monospace',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#b0adab',
          'line-color': '#dddbda',
          'width': 1.8,
          'arrow-scale': 0.8,
          'text-rotation': 'autorotate',
          'text-margin-y': -6
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#0176d3',
          'target-arrow-color': '#0176d3',
          'width': 3.0
        }
      }
    ],
    layout: getLayoutConfig(currentLayout)
  });

  // Select node and update right-side detail card
  cy.on('tap', 'node', function(evt) {
    const node = evt.target;
    displayRecordDetail(node);
  });

  // Auto-select first policy if none selected
  if (visibleNodes.length > 0) {
    const firstPolicy = cy.nodes("[label = 'Policy']").first();
    if (firstPolicy.length > 0) {
      firstPolicy.select();
      displayRecordDetail(firstPolicy);
    }
  }
}

// Layout Configuration Factory (Provides clean, non-messy layouts)
function getLayoutConfig(layoutName) {
  if (layoutName === 'concentric') {
    return {
      name: 'concentric',
      fit: true,
      padding: 40,
      concentric: function(node) {
        const lbl = node.data('label');
        if (lbl === 'Policy') return 3;
        if (lbl === 'Threshold' || lbl === 'Channel') return 2;
        return 1;
      },
      levelWidth: () => 1
    };
  } else if (layoutName === 'breadthfirst') {
    return {
      name: 'breadthfirst',
      fit: true,
      directed: true,
      padding: 40,
      spacingFactor: 1.2
    };
  } else if (layoutName === 'circle') {
    return {
      name: 'circle',
      fit: true,
      padding: 40
    };
  } else {
    return {
      name: 'cose',
      fit: true,
      padding: 50,
      nodeRepulsion: 500000,
      idealEdgeLength: 120,
      componentSpacing: 120,
      animate: false
    };
  }
}

// Display Salesforce Record Detail
function displayRecordDetail(node) {
  activeRecordId = node.data('id');
  document.getElementById('rec-name').innerText = node.data('name');
  
  const typePill = document.getElementById('record-type-pill');
  typePill.innerText = `${node.data('label')} RECORD`;

  const conf = node.data('confidence') || 1.0;
  document.getElementById('rec-confidence').innerText = `${conf.toFixed(2)} (Verified)`;

  const props = node.data('properties') || {};
  document.getElementById('rec-dept').innerText = props.department || 'Enterprise Core';

  // Relations list
  const edges = node.connectedEdges();
  document.getElementById('rec-edge-count').innerText = edges.length;
  const relList = document.getElementById('rec-relations-list');
  relList.innerHTML = '';

  if (edges.length === 0) {
    relList.innerHTML = '<div class="text-slate-400">No active relations linked.</div>';
  } else {
    edges.forEach(e => {
      const isOut = e.data('source') === node.data('id');
      const otherId = isOut ? e.data('target') : e.data('source');
      const otherNode = cy.getElementById(otherId);
      const otherName = otherNode.length > 0 ? otherNode.data('name') : otherId;

      const row = document.createElement('div');
      row.className = 'p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center text-slate-800';
      row.innerHTML = `
        <span class="text-[#0176d3] font-bold text-[11px]">${isOut ? '→' : '←'} ${e.data('label')}</span>
        <span class="font-semibold text-slate-900 truncate max-w-[140px] text-[11px]">${otherName}</span>
      `;
      relList.appendChild(row);
    });
  }

  // Metadata Box
  const metaBox = document.getElementById('rec-metadata-box');
  if (Object.keys(props).length === 0) {
    metaBox.innerText = 'No standard custom fields defined.';
  } else {
    metaBox.innerHTML = Object.entries(props).map(([k, v]) => `
      <div class="flex justify-between py-0.5 border-b border-slate-100 last:border-0">
        <span class="text-slate-500">${k}:</span>
        <span class="font-bold text-slate-900">${v}</span>
      </div>
    `).join('');
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
  renderSalesforceGraph();
}

// Type Filter Toggle
function toggleTypeFilter(type) {
  activeTypeFilters[type] = !activeTypeFilters[type];
  const btn = document.getElementById(`btn-f-${type.toLowerCase()}`);
  if (btn) {
    if (activeTypeFilters[type]) {
      btn.style.opacity = '1.0';
    } else {
      btn.style.opacity = '0.35';
    }
  }
  renderSalesforceGraph();
}

// Controls
function zoomIn() { if (cy) cy.zoom(cy.zoom() * 1.25); }
function zoomOut() { if (cy) cy.zoom(cy.zoom() * 0.8); }
function fitGraph() { if (cy) cy.fit(); }

function onSearchEntity(query) {
  if (!query || !cy) {
    renderSalesforceGraph();
    return;
  }
  const q = query.toLowerCase();
  cy.nodes().forEach(n => {
    const match = (n.data('name') || '').toLowerCase().includes(q);
    if (match) {
      n.style('opacity', 1.0);
      n.style('width', 40);
      n.style('height', 40);
    } else {
      n.style('opacity', 0.15);
      n.style('width', 22);
      n.style('height', 22);
    }
  });
}

function refreshGraph() {
  document.getElementById('slds-global-search').value = '';
  loadGraphData();
}

function synthesizeSkillFromRecord() {
  switchTab('runtime-view');
}

function isolateCluster() {
  if (!activeRecordId || !cy) return;
  const node = cy.getElementById(activeRecordId);
  const neighborhood = node.neighborhood().add(node);
  cy.elements().forEach(el => {
    if (neighborhood.contains(el)) {
      el.style('opacity', 1.0);
    } else {
      el.style('opacity', 0.08);
    }
  });
}

// Populate Records Table for Tab 4
function populateRecordsTable() {
  const tbody = document.getElementById('slds-records-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  fullGraphData.nodes.forEach(n => {
    const props = n.properties || {};
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="py-2.5 px-3 text-slate-500 font-mono text-xs">${n.id}</td>
      <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">${n.label}</span></td>
      <td class="py-2.5 px-3 font-bold text-slate-900">${n.name}</td>
      <td class="py-2.5 px-3 text-slate-600">${props.department || 'Enterprise Core'}</td>
      <td class="py-2.5 px-3 text-emerald-700 font-bold">${n.confidence.toFixed(2)}</td>
      <td class="py-2.5 px-3"><button onclick="viewNodeInGraph('${n.id}')" class="slds-button text-[11px] py-0.5 px-2">Focus</button></td>
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
      displayRecordDetail(node);
      cy.animate({ center: { eles: node }, zoom: 1.8 }, { duration: 400 });
    }
  }, 150);
}

// Skill Select in Runtime
function onSelectSkill(skillName) {
  const lblAmount = document.getElementById('slds-lbl-amount');
  const hintAmount = document.getElementById('slds-hint-amount');
  const valAmount = document.getElementById('slds-amount');

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
  const amount = parseFloat(document.getElementById('slds-amount').value);
  const kyc = parseInt(document.getElementById('slds-kyc').value);
  const fraud = parseInt(document.getElementById('slds-fraud').value);
  
  const statusPill = document.getElementById('slds-status-pill');
  const tracesStream = document.getElementById('slds-traces-stream');

  statusPill.className = "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse";
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
      statusPill.className = "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
      statusPill.innerText = "SUCCESS (APPROVED & COMPLIANT)";
    } else {
      statusPill.className = "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-red-100 text-red-800 border border-red-300";
      statusPill.innerText = "ESCALATED TO HUMAN REVIEW";
    }

    tracesStream.innerHTML = '';

    if (data.escalation_reason) {
      const alertBox = document.createElement('div');
      alertBox.className = 'p-3 rounded bg-red-50 border border-red-200 text-red-900 text-xs font-mono mb-2 flex items-center justify-between';
      alertBox.innerHTML = `
        <div>
          <span class="font-bold block uppercase text-[10px] text-red-700">AST Boundary Guard Violated</span>
          ${data.escalation_reason}
        </div>
        <span class="px-2 py-0.5 rounded bg-white text-red-700 font-bold border border-red-200 text-[10px]">#risk-disputes</span>
      `;
      tracesStream.appendChild(alertBox);
    }

    data.traces.forEach((t, i) => {
      const isPass = t.status === 'PASSED';
      const card = document.createElement('div');
      card.className = `p-3 rounded border ${isPass ? 'bg-white border-slate-200' : 'bg-red-50/60 border-red-200'} space-y-1 shadow-sm`;
      card.innerHTML = `
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold font-mono ${isPass ? 'text-emerald-700' : 'text-red-700'}">[Step ${i+1}] ${t.step_id}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">${t.action}</span>
        </div>
        <p class="text-slate-800 text-xs font-semibold">${t.output_message}</p>
        <div class="text-[10px] text-slate-500 font-mono">AST Guard: ${t.guard_evaluated}</div>
      `;
      tracesStream.appendChild(card);
    });

  } catch (err) {
    statusPill.className = "px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-red-100 text-red-800";
    statusPill.innerText = "API ERROR";
    tracesStream.innerHTML = `<div class="p-3 bg-red-50 text-red-800 text-xs font-mono">Error contacting local service: ${err.message}</div>`;
  }
}

// Bootstrap on Load
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  loadGraphData();
});
