// Theosophia Salesforce Lightning Studio Logic
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

// Context Tab Switcher
function switchTab(tabId) {
  const tabs = ['graph-view', 'runtime-view', 'compliance-view', 'records-view'];
  const titles = {
    'graph-view': 'Global Financial Knowledge Graph Studio',
    'runtime-view': 'Process Flow Automation & Skill Execution Runtime',
    'compliance-view': 'SM&CR Statutory Regulatory Compliance Register',
    'records-view': 'Standard Knowledge Policy Objects & Records'
  };

  const titleEl = document.getElementById('slds-header-title');
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

// Render Graph with Clean Salesforce Aesthetics, Non-Overlapping Labels and Generous Spacing
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

  const metricEl = document.getElementById('slds-node-metric');
  if (metricEl) {
    metricEl.innerText = `${visibleNodes.length} Nodes • ${visibleEdges.length} Edges`;
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

  // Cytoscape with Anti-Congestion Label Wrapping & Dynamic Highlighting
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
          'color': '#0f172a',
          'font-size': '10px',
          'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          'font-weight': 600,
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 5,
          'text-wrap': 'wrap',
          'text-max-width': '95px',
          'text-overflow-wrap': 'break-word',
          'line-height': 1.15,
          'text-background-opacity': 0.96,
          'text-background-color': '#ffffff',
          'text-background-padding': '3px 5px',
          'text-background-shape': 'roundrectangle',
          'text-border-color': '#cbd5e1',
          'text-border-width': 1,
          'text-border-opacity': 0.85,
          'background-color': function(ele) {
            const lbl = (ele.data('label') || '').toLowerCase();
            if (lbl === 'policy') return '#0176d3';    // Salesforce Action Blue
            if (lbl === 'threshold') return '#2e844a'; // Success Green
            if (lbl === 'person') return '#00a1e0';    // Sky Blue Principal
            if (lbl === 'channel') return '#ea001e';   // Salesforce Danger Red
            if (lbl === 'system') return '#fe9339';    // Warning Orange System
            return '#706e6b';
          },
          'width': 34,
          'height': 34,
          'border-width': 2.5,
          'border-color': '#ffffff',
          'border-opacity': 1.0,
          'transition-property': 'width, height, border-width, border-color, opacity',
          'transition-duration': '0.15s'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#001639',
          'border-width': 3.5,
          'width': 42,
          'height': 42,
          'font-weight': 700,
          'font-size': '11px',
          'text-border-color': '#0176d3',
          'text-border-width': 1.5,
          'z-index': 999
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#94a3b8',
          'line-color': '#cbd5e1',
          'width': 1.5,
          'arrow-scale': 0.85,
          'label': function(ele) {
            return showEdgeLabels ? ele.data('label') : '';
          },
          'font-size': '8px',
          'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          'font-weight': 700,
          'text-transform': 'uppercase',
          'color': '#475569',
          'text-rotation': 'autorotate',
          'text-background-opacity': 0.95,
          'text-background-color': '#f8fafc',
          'text-background-padding': '2px 4px',
          'text-background-shape': 'roundrectangle',
          'text-border-color': '#cbd5e1',
          'text-border-width': 0.8,
          'text-border-opacity': 0.8,
          'transition-property': 'line-color, target-arrow-color, width, opacity',
          'transition-duration': '0.15s'
        }
      },
      {
        selector: 'edge:selected, edge.highlighted',
        style: {
          'label': 'data(label)',
          'line-color': '#0176d3',
          'target-arrow-color': '#0176d3',
          'width': 2.6,
          'font-size': '9px',
          'color': '#001639',
          'text-background-opacity': 1.0,
          'text-background-color': '#eff6ff',
          'text-border-color': '#0176d3',
          'text-border-width': 1.2,
          'z-index': 998
        }
      },
      {
        selector: '.faded',
        style: {
          'opacity': 0.2
        }
      }
    ],
    layout: getLayoutConfig(currentLayout)
  });

  // Tap node: Focus neighborhood, highlight edges, update details
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

// Highlight node neighborhood and reveal incident edge labels
function focusNodeNeighborhood(node) {
  const neighborhood = node.neighborhood().add(node);
  const connectedEdges = node.connectedEdges();

  cy.elements().removeClass('faded highlighted');
  
  // Fade everything outside neighborhood
  cy.elements().not(neighborhood).addClass('faded');
  
  // Highlight connected edges with visible badges
  connectedEdges.addClass('highlighted');
}

// Layout Configuration Factory with Spacing Multiplier & Collision Safeguards
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

// Display Salesforce Record Detail
function displayRecordDetail(node) {
  activeRecordId = node.data('id');
  const nameEl = document.getElementById('rec-name');
  if (nameEl) nameEl.innerText = node.data('name');
  
  const typePill = document.getElementById('record-type-pill');
  if (typePill) typePill.innerText = `${node.data('label')} RECORD`;

  const conf = node.data('confidence') || 1.0;
  const confEl = document.getElementById('rec-confidence');
  if (confEl) confEl.innerText = `${conf.toFixed(2)} (Verified)`;

  const props = node.data('properties') || {};
  const deptEl = document.getElementById('rec-dept');
  if (deptEl) deptEl.innerText = props.department || 'Enterprise Core';

  // Relations list
  const edges = node.connectedEdges();
  const countEl = document.getElementById('rec-edge-count');
  if (countEl) countEl.innerText = edges.length;
  
  const relList = document.getElementById('rec-relations-list');
  if (relList) {
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
        row.className = 'p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center text-slate-800 cursor-pointer hover:bg-blue-50/50';
        row.onclick = () => {
          if (otherNode.length > 0) {
            cy.elements().unselect();
            otherNode.select();
            focusNodeNeighborhood(otherNode);
            displayRecordDetail(otherNode);
          }
        };
        row.innerHTML = `
          <span class="text-[#0176d3] font-bold text-[11px]">${isOut ? '→' : '←'} ${e.data('label')}</span>
          <span class="font-semibold text-slate-900 truncate max-w-[140px] text-[11px]">${otherName}</span>
        `;
        relList.appendChild(row);
      });
    }
  }

  // Metadata Box
  const metaBox = document.getElementById('rec-metadata-box');
  if (metaBox) {
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

// Toggle Record Detail Panel (Full Width Graph)
function toggleRecordPanel() {
  const panel = document.getElementById('slds-record-panel');
  const btn = document.getElementById('btn-toggle-panel');
  if (!panel) return;

  isPanelCollapsed = !isPanelCollapsed;
  if (isPanelCollapsed) {
    panel.classList.add('hidden');
    if (btn) btn.classList.add('bg-blue-100', 'text-[#0176d3]');
  } else {
    panel.classList.remove('hidden');
    if (btn) btn.classList.remove('bg-blue-100', 'text-[#0176d3]');
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
  renderSalesforceGraph();
}

// Type Filter Toggle
function toggleTypeFilter(type) {
  activeTypeFilters[type] = !activeTypeFilters[type];
  const btn = document.getElementById(`btn-f-${type.toLowerCase()}`);
  if (btn) {
    btn.style.opacity = activeTypeFilters[type] ? '1.0' : '0.35';
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
      n.style('width', 42);
      n.style('height', 42);
    } else {
      n.style('opacity', 0.15);
      n.style('width', 24);
      n.style('height', 24);
    }
  });
}

function refreshGraph() {
  const searchEl = document.getElementById('slds-global-search');
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
      focusNodeNeighborhood(node);
      displayRecordDetail(node);
      cy.animate({ center: { eles: node }, zoom: 1.6 }, { duration: 400 });
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
