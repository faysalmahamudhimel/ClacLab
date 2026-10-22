const graphCanvas = document.getElementById('graphCanvas');
const edgeLayer = document.getElementById('graphEdges');
const nodeLayer = document.getElementById('graphNodes');
const graphFeedback = document.getElementById('graphFeedback');
const directedToggle = document.getElementById('directedGraph');
const weightedToggle = document.getElementById('weightedGraph');
const algorithmSelect = document.getElementById('graphAlgorithm');
const graphPlay = document.getElementById('graphPlay');
const graphPause = document.getElementById('graphPause');
const graphStep = document.getElementById('graphStep');
const graphReset = document.getElementById('graphReset');
const graphSpeed = document.getElementById('graphSpeed');

let nodes = [];
let edges = [];
let nextNodeId = 1;
let nextEdgeId = 1;
let editMode = 'select';
let selectedNodeId = null;
let selectedEdgeId = null;
let connectFrom = null;
let connectTo = null;
let dragState = null;
let frames = [];
let frameIndex = 0;
let playing = false;
let editorLocked = false;
let playbackTimer = null;
let clockTimer = null;
let startedAt = 0;
let elapsedBeforePlay = 0;
let viewState = { visited: [], traversalEdges: [] };

const algorithmInfo = {
  bfs: {
    title: 'Breadth-First Search',
    explanation: 'BFS visits the start node, then explores its neighbors level by level. This run covers only the nodes reachable from the selected start node; disconnected components remain unvisited.',
    structure: 'Queue', time: 'O(V + E)', space: 'O(V)',
    code: `void bfs(const vector<vector<int>>& graph, int start) {
    vector<bool> visited(graph.size(), false);
    queue<int> q;
    visited[start] = true;
    q.push(start);
    while (!q.empty()) {
        int node = q.front(); q.pop();
        for (int next : graph[node]) {
            if (!visited[next]) {
                visited[next] = true;
                q.push(next);
            }
        }
    }
}`
  },
  dfs: {
    title: 'Depth-First Search',
    explanation: 'DFS follows one neighbor as deeply as possible, then backtracks. This run uses a recursion-style call stack and visits only the nodes reachable from the selected start node.',
    structure: 'Recursion stack', time: 'O(V + E)', space: 'O(V)',
    code: `void dfs(const vector<vector<int>>& graph,
         vector<bool>& visited, int node) {
    visited[node] = true;
    for (int next : graph[node]) {
        if (!visited[next])
            dfs(graph, visited, next);
    }
}`
  },
  dijkstra: {
    title: 'Dijkstra’s Shortest Path',
    explanation: 'Dijkstra repeatedly settles the unvisited node with the smallest known distance, then relaxes its outgoing edges. This implementation scans all nodes for each minimum, so its time complexity is O(V² + E). Edge weights must be non-negative.',
    structure: 'Distance array + minimum scan', time: 'O(V² + E)', space: 'O(V + E)',
    code: `void dijkstra(const vector<vector<pair<int,double>>>& graph,
              int source, vector<double>& dist) {
    int n = graph.size();
    vector<bool> used(n, false);
    dist.assign(n, numeric_limits<double>::infinity());
    dist[source] = 0;
    for (int i = 0; i < n; ++i) {
        int node = -1;
        for (int v = 0; v < n; ++v)
            if (!used[v] && (node == -1 || dist[v] < dist[node]))
                node = v;
        if (node == -1 || isinf(dist[node])) break;
        used[node] = true;
        for (auto [next, weight] : graph[node])
            if (!used[next] && dist[node] + weight < dist[next])
                dist[next] = dist[node] + weight;
    }
}`
  }
};

const samples = {
  bfs: {
    directed: false, weighted: false, algorithm: 'bfs',
    nodes: [['A', 160, 260], ['B', 355, 115], ['C', 355, 405], ['D', 575, 70], ['E', 575, 160], ['F', 575, 355], ['G', 575, 450]],
    edges: [['A', 'B', 1], ['A', 'C', 1], ['B', 'D', 1], ['B', 'E', 1], ['C', 'F', 1], ['C', 'G', 1]]
  },
  disconnected: {
    directed: false, weighted: false, algorithm: 'bfs',
    nodes: [['A', 150, 170], ['B', 350, 170], ['C', 550, 170], ['D', 250, 390], ['E', 480, 390]],
    edges: [['A', 'B', 1], ['B', 'C', 1], ['D', 'E', 1]]
  },
  directed: {
    directed: true, weighted: false, algorithm: 'dfs',
    nodes: [['A', 170, 260], ['B', 370, 125], ['C', 370, 395], ['D', 610, 260]],
    edges: [['A', 'B', 1], ['A', 'C', 1], ['B', 'D', 1], ['C', 'D', 1]]
  },
  dijkstra: {
    directed: false, weighted: true, algorithm: 'dijkstra',
    nodes: [['A', 130, 260], ['B', 330, 95], ['C', 330, 425], ['D', 545, 125], ['E', 545, 390], ['F', 760, 260]],
    edges: [['A', 'B', 4], ['A', 'C', 2], ['C', 'B', 1], ['B', 'D', 5], ['C', 'D', 8], ['C', 'E', 10], ['D', 'E', 2], ['D', 'F', 6], ['E', 'F', 3]]
  }
};

function escapeText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function labelOf(id) {
  return nodes.find((node) => node.id === id)?.label || String(id);
}

function setFeedback(message, isError = false) {
  graphFeedback.textContent = message;
  graphFeedback.classList.toggle('is-error', isError);
}

function nextAutoLabel() {
  let candidateIndex = 0;
  let candidate;
  do {
    candidate = String.fromCharCode(65 + (candidateIndex % 26)) + (candidateIndex >= 26 ? Math.floor(candidateIndex / 26) : '');
    candidateIndex += 1;
  } while (nodes.some((node) => node.label.toLowerCase() === candidate.toLowerCase()));
  return candidate;
}

function defaultPosition() {
  const index = nodes.length;
  const angle = -Math.PI / 2 + index * 2.399963229728653;
  const radius = 100 + (index % 3) * 26;
  return { x: Math.max(55, Math.min(845, 450 + Math.cos(angle) * radius)), y: Math.max(55, Math.min(465, 260 + Math.sin(angle) * radius)) };
}

function resetAlgorithmRun(message = 'Graph changed. Choose an algorithm and start a run.') {
  stopPlayback();
  frames = [];
  frameIndex = 0;
  elapsedBeforePlay = 0;
  editorLocked = false;
  viewState = { visited: [], traversalEdges: [] };
  document.getElementById('algorithmStatus').textContent = nodes.length ? 'Ready to run.' : 'Build a graph and choose an algorithm.';
  document.getElementById('worklistContents').innerHTML = '<span class="graph-muted">Waiting for a run</span>';
  document.getElementById('traversalOrder').innerHTML = '<span class="graph-muted">No nodes visited yet</span>';
  document.getElementById('distanceRows').innerHTML = '';
  document.getElementById('pathResult').textContent = '';
  document.getElementById('distanceCard').hidden = algorithmSelect.value !== 'dijkstra';
  document.getElementById('graphElapsed').textContent = '0.00 s';
  renderGraph();
  updateControls();
  setFeedback(message);
}

function updateNodeOptions() {
  const options = nodes.map((node) => `<option value="${node.id}">${escapeText(node.label)}</option>`).join('');
  ['startNode', 'sourceNode', 'destinationNode'].forEach((id) => {
    const select = document.getElementById(id);
    const oldValue = select.value;
    select.innerHTML = options || '<option value="">Add nodes first</option>';
    if (nodes.some((node) => node.id === oldValue)) select.value = oldValue;
  });
  if (nodes.length > 1 && document.getElementById('destinationNode').value === document.getElementById('sourceNode').value) {
    document.getElementById('destinationNode').selectedIndex = 1;
  }
}

function edgeCoordinates(edge) {
  const from = nodes.find((node) => node.id === edge.from);
  const to = nodes.find((node) => node.id === edge.to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const radius = 29;
  const sx = from.x + dx / length * radius;
  const sy = from.y + dy / length * radius;
  const ex = to.x - dx / length * radius;
  const ey = to.y - dy / length * radius;
  return { sx, sy, ex, ey, mx: (sx + ex) / 2, my: (sy + ey) / 2 };
}

function renderGraph() {
  const visited = new Set(viewState.visited || []);
  const traversalEdges = new Set(viewState.traversalEdges || []);
  const pathNodes = new Set(viewState.pathNodes || []);
  const pathEdges = new Set(viewState.pathEdges || []);
  const directed = directedToggle.checked;
  const weighted = weightedToggle.checked;
  edgeLayer.innerHTML = edges.map((edge) => {
    const point = edgeCoordinates(edge);
    const classes = ['graph-edge'];
    if (traversalEdges.has(edge.id)) classes.push('is-traversed');
    if (pathEdges.has(edge.id)) classes.push('is-shortest');
    if (viewState.activeEdge === edge.id) classes.push('is-active');
    if (selectedEdgeId === edge.id) classes.push('is-selected');
    const marker = directed ? ' marker-end="url(#graphArrow)"' : '';
    const edgePath = `<path class="${classes.join(' ')}" data-edge-id="${edge.id}" d="M ${point.sx} ${point.sy} L ${point.ex} ${point.ey}"${marker} tabindex="0" role="button" aria-label="Edge ${escapeText(labelOf(edge.from))} to ${escapeText(labelOf(edge.to))}${weighted ? `, weight ${edge.weight}` : ''}" />`;
    if (!weighted) return edgePath;
    return `${edgePath}<g class="graph-edge-weight" aria-hidden="true"><rect x="${point.mx - 17}" y="${point.my - 13}" width="34" height="24" rx="8" /><text x="${point.mx}" y="${point.my + 4}">${escapeText(edge.weight)}</text></g>`;
  }).join('');

  nodeLayer.innerHTML = nodes.map((node) => {
    const classes = ['graph-node'];
    if (visited.has(node.id)) classes.push('is-visited');
    if (viewState.activeNode === node.id) classes.push('is-active');
    if (pathNodes.has(node.id)) classes.push('is-shortest');
    if (selectedNodeId === node.id) classes.push('is-selected');
    if (connectFrom === node.id || connectTo === node.id) classes.push('is-connect-selected');
    return `<g class="${classes.join(' ')}" data-node-id="${node.id}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-label="Node ${escapeText(node.label)}"><circle r="27" /><text class="graph-node-label" y="5">${escapeText(node.label)}</text></g>`;
  }).join('');
  document.getElementById('graphEmptyHint').hidden = nodes.length > 0;
  document.getElementById('graphCount').textContent = `${nodes.length} ${nodes.length === 1 ? 'node' : 'nodes'} · ${edges.length} ${edges.length === 1 ? 'edge' : 'edges'}`;
  updateNodeOptions();
  updateControls();
}

function updateControls() {
  const editButtons = document.querySelectorAll('.graph-mode, #deleteSelection, #clearGraph, #loadSample, #connectSelection');
  editButtons.forEach((button) => { button.disabled = editorLocked || button.id === 'deleteSelection' && !selectedNodeId && !selectedEdgeId || button.id === 'connectSelection' && (!connectFrom || !connectTo); });
  document.getElementById('addNodeForm').querySelector('button').disabled = editorLocked;
  document.getElementById('nodeLabel').disabled = editorLocked;
  document.getElementById('edgeWeight').disabled = editorLocked || !weightedToggle.checked;
  document.getElementById('sampleGraph').disabled = editorLocked;
  directedToggle.disabled = editorLocked;
  weightedToggle.disabled = editorLocked;
  algorithmSelect.disabled = editorLocked && frames.length > 0;
  ['startNode', 'sourceNode', 'destinationNode'].forEach((id) => { document.getElementById(id).disabled = editorLocked || nodes.length === 0; });
  const done = frames.length > 0 && frameIndex >= frames.length;
  graphPlay.disabled = playing || done || !nodes.length;
  graphPause.disabled = !playing;
  graphStep.disabled = playing || done || !nodes.length;
  graphReset.disabled = !frames.length && !playing;
  document.getElementById('connectSelection').textContent = connectFrom && connectTo ? `Connect ${labelOf(connectFrom)} → ${labelOf(connectTo)}` : 'Connect selected pair';
}

function addNode(label, position) {
  if (nodes.length >= 24) return setFeedback('A graph can contain up to 24 nodes in this visualizer.', true);
  const normalized = (label || '').trim() || nextAutoLabel();
  if (nodes.some((node) => node.label.toLowerCase() === normalized.toLowerCase())) return setFeedback(`The label “${normalized}” is already in use. Choose a unique label.`, true);
  if (normalized.length > 12) return setFeedback('Node labels can contain up to 12 characters.', true);
  resetAlgorithmRun();
  const point = position || defaultPosition();
  const node = { id: `n${nextNodeId++}`, label: normalized, x: point.x, y: point.y };
  nodes.push(node);
  document.getElementById('nodeLabel').value = '';
  renderGraph();
  setFeedback(`Added node ${normalized}.`);
  return node;
}

function addEdge(from, to) {
  if (!from || !to || from === to) return setFeedback('Choose two different nodes to connect.', true);
  const weightText = document.getElementById('edgeWeight').value.trim();
  const weight = Number(weightText);
  if (!weightText || !Number.isFinite(weight)) return setFeedback('Enter a valid finite edge weight.', true);
  const duplicate = edges.some((edge) => directedToggle.checked
    ? edge.from === from && edge.to === to
    : edge.from === from && edge.to === to || edge.from === to && edge.to === from);
  if (duplicate) return setFeedback('That connection already exists.', true);
  resetAlgorithmRun();
  edges.push({ id: `e${nextEdgeId++}`, from, to, weight });
  connectFrom = null;
  connectTo = null;
  selectedNodeId = null;
  renderGraph();
  setFeedback(`Connected ${labelOf(from)} to ${labelOf(to)}${weightedToggle.checked ? ` with weight ${weight}` : ''}.`);
}

function chooseConnectNode(nodeId) {
  if (!connectFrom) {
    connectFrom = nodeId;
    selectedNodeId = nodeId;
    renderGraph();
    setFeedback(`Selected ${labelOf(nodeId)}. Choose a different second node.`);
    return;
  }
  if (nodeId === connectFrom) return setFeedback('Self-connections are not supported. Choose a different node.', true);
  connectTo = nodeId;
  selectedNodeId = nodeId;
  renderGraph();
  setFeedback(`Ready to connect ${labelOf(connectFrom)} to ${labelOf(connectTo)}. Set the weight and confirm.`);
}

function updateAlgorithmInfo() {
  const key = algorithmSelect.value;
  const info = algorithmInfo[key];
  document.getElementById('graphInfoTitle').textContent = info.title;
  document.getElementById('algorithmExplanation').textContent = info.explanation;
  document.getElementById('graphComplexities').innerHTML = [
    ['Data structure', info.structure], ['Time', info.time], ['Auxiliary space', info.space]
  ].map(([name, value]) => `<div class="graph-complexity"><span>${name}</span><strong>${escapeText(value)}</strong></div>`).join('');
  document.getElementById('graphCppCode').textContent = info.code;
  const dijkstra = key === 'dijkstra';
  document.getElementById('traversalFields').hidden = dijkstra;
  document.getElementById('pathFields').hidden = !dijkstra;
  document.getElementById('distanceCard').hidden = !dijkstra;
  document.getElementById('worklistTitle').textContent = key === 'bfs' ? 'Queue' : key === 'dfs' ? 'Call stack' : 'Settled nodes';
  document.getElementById('progressTitle').textContent = key === 'dijkstra' ? 'Shortest path' : 'Traversal order';
  resetAlgorithmRun(`Ready to run ${info.title}.`);
}

function currentGraph() {
  return {
    nodes: nodes.map((node) => ({ ...node })),
    edges: edges.map((edge) => ({ ...edge })),
    directed: directedToggle.checked,
    weighted: weightedToggle.checked
  };
}

function prepareRun() {
  if (frames.length) return true;
  if (!nodes.length) return setFeedback('Add at least one node before running an algorithm.', true), false;
  try {
    const graph = currentGraph();
    if (algorithmSelect.value === 'dijkstra') {
      frames = window.GraphAlgorithms.createDijkstraSteps(graph, document.getElementById('sourceNode').value, document.getElementById('destinationNode').value);
    } else {
      frames = window.GraphAlgorithms.createTraversalSteps(graph, algorithmSelect.value, document.getElementById('startNode').value);
    }
    editorLocked = true;
    updateControls();
    setFeedback('Graph editing is locked for this run. Reset the algorithm to edit the graph.');
    return true;
  } catch (error) {
    setFeedback(error.message, true);
    document.getElementById('algorithmStatus').textContent = error.message;
    return false;
  }
}

function renderWorklist(frame) {
  const algorithm = algorithmSelect.value;
  let ids;
  if (algorithm === 'bfs') ids = frame.queue || [];
  else if (algorithm === 'dfs') ids = frame.stack || [];
  else ids = frame.settled || [];
  document.getElementById('worklistContents').innerHTML = ids.length
    ? ids.map((id) => `<span class="graph-chip">${escapeText(labelOf(id))}</span>`).join('')
    : '<span class="graph-muted">Empty</span>';

  if (algorithm === 'dijkstra') {
    const path = frame.pathNodes || [];
    document.getElementById('traversalOrder').innerHTML = path.length
      ? path.map((id) => `<span class="graph-chip is-path-chip">${escapeText(labelOf(id))}</span>`).join('<span class="graph-path-arrow">→</span>')
      : '<span class="graph-muted">Shortest path appears at completion</span>';
    document.getElementById('distanceRows').innerHTML = (frame.distances || []).map((entry) => {
      const distance = Number.isFinite(entry.distance) ? entry.distance : '∞';
      return `<tr class="${entry.nodeId === frame.currentNode ? 'is-current' : ''}"><th scope="row">${escapeText(labelOf(entry.nodeId))}</th><td>${distance}</td><td>${entry.previous ? escapeText(labelOf(entry.previous)) : '—'}</td></tr>`;
    }).join('');
    const pathResult = document.getElementById('pathResult');
    pathResult.textContent = frame.done
      ? frame.reachable ? `Path cost: ${frame.totalCost}` : 'Destination is unreachable from this source.'
      : '';
    pathResult.className = `graph-path-result${frame.done && !frame.reachable ? ' is-error' : ''}`;
  } else {
    document.getElementById('traversalOrder').innerHTML = (frame.order || []).length
      ? frame.order.map((id, index) => `<span class="graph-order-item"><i>${index + 1}</i>${escapeText(labelOf(id))}</span>`).join('')
      : '<span class="graph-muted">No nodes visited yet</span>';
  }
}

function applyFrame(frame) {
  viewState = {
    visited: frame.visited || frame.settled || [],
    traversalEdges: frame.traversalEdges || [],
    activeNode: frame.activeNode || frame.currentNode || null,
    activeEdge: frame.activeEdge || null,
    pathNodes: frame.pathNodes || [],
    pathEdges: frame.pathEdges || []
  };
  renderGraph();
  renderWorklist(frame);
  document.getElementById('algorithmStatus').textContent = frame.explanation;
  if (frame.done && algorithmSelect.value !== 'dijkstra') {
    const visitedCount = frame.order.length;
    const disconnectedCount = nodes.length - visitedCount;
    document.getElementById('algorithmStatus').textContent = `${frame.explanation}${disconnectedCount ? ` ${disconnectedCount} disconnected node${disconnectedCount === 1 ? ' remains' : 's remain'} unvisited.` : ' All graph nodes were reachable.'}`;
  }
  if (frame.done && algorithmSelect.value === 'dijkstra') {
    document.getElementById('algorithmStatus').textContent = frame.explanation;
  }
  updateElapsed();
}

function stepOnce() {
  if (!prepareRun() || frameIndex >= frames.length) return;
  const frame = frames[frameIndex++];
  applyFrame(frame);
  updateControls();
}

function playbackDelay() {
  return Math.round(900 - (Number(graphSpeed.value) - 1) * 7.5);
}

function playNext() {
  if (!playing) return;
  if (frameIndex >= frames.length) {
    stopPlayback();
    updateControls();
    return;
  }
  stepOnce();
  if (!playing) return;
  if (frameIndex >= frames.length) {
    stopPlayback();
    updateControls();
    return;
  }
  playbackTimer = setTimeout(playNext, playbackDelay());
}

function play() {
  if (playing || frames.length && frameIndex >= frames.length || !prepareRun()) return;
  playing = true;
  startedAt = performance.now();
  clockTimer = setInterval(updateElapsed, 80);
  updateControls();
  playNext();
}

function stopPlayback() {
  if (playbackTimer) clearTimeout(playbackTimer);
  if (clockTimer) clearInterval(clockTimer);
  playbackTimer = null;
  clockTimer = null;
  if (playing) elapsedBeforePlay += performance.now() - startedAt;
  playing = false;
  updateElapsed();
}

function pause() {
  stopPlayback();
  if (frames.length && frameIndex < frames.length) document.getElementById('algorithmStatus').textContent += ' Paused; press Play to resume.';
  updateControls();
}

function updateElapsed() {
  const elapsed = elapsedBeforePlay + (playing ? performance.now() - startedAt : 0);
  document.getElementById('graphElapsed').textContent = `${(elapsed / 1000).toFixed(2)} s`;
}

function loadSample(key) {
  if (!key || !samples[key]) return setFeedback('Choose a sample graph first.', true);
  resetAlgorithmRun('Loading sample graph…');
  const sample = samples[key];
  nodes = sample.nodes.map(([label, x, y], index) => ({ id: `n${index + 1}`, label, x, y }));
  edges = sample.edges.map(([fromLabel, toLabel, weight], index) => ({
    id: `e${index + 1}`,
    from: nodes.find((node) => node.label === fromLabel).id,
    to: nodes.find((node) => node.label === toLabel).id,
    weight
  }));
  nextNodeId = nodes.length + 1;
  nextEdgeId = edges.length + 1;
  directedToggle.checked = sample.directed;
  weightedToggle.checked = sample.weighted;
  algorithmSelect.value = sample.algorithm;
  selectedNodeId = null;
  selectedEdgeId = null;
  connectFrom = null;
  connectTo = null;
  updateAlgorithmInfo();
  document.getElementById('startNode').value = nodes[0].id;
  document.getElementById('sourceNode').value = nodes[0].id;
  document.getElementById('destinationNode').value = nodes[nodes.length - 1].id;
  renderGraph();
  setFeedback(`Loaded ${document.getElementById('sampleGraph').selectedOptions[0].textContent}.`);
}

function deleteSelection() {
  if (editorLocked) return;
  if (!selectedNodeId && !selectedEdgeId) return setFeedback('Select a node or edge to delete.', true);
  resetAlgorithmRun();
  if (selectedNodeId) {
    const removedId = selectedNodeId;
    nodes = nodes.filter((node) => node.id !== removedId);
    edges = edges.filter((edge) => edge.from !== removedId && edge.to !== removedId);
  } else edges = edges.filter((edge) => edge.id !== selectedEdgeId);
  selectedNodeId = null;
  selectedEdgeId = null;
  connectFrom = null;
  connectTo = null;
  renderGraph();
  setFeedback('Deleted the selected graph item.');
}

function clearGraph() {
  if (editorLocked) return;
  resetAlgorithmRun('Graph cleared. Add nodes to begin.');
  nodes = [];
  edges = [];
  nextNodeId = 1;
  nextEdgeId = 1;
  selectedNodeId = null;
  selectedEdgeId = null;
  connectFrom = null;
  connectTo = null;
  renderGraph();
  setFeedback('Graph cleared. Add nodes to begin.');
}

function graphPoint(event) {
  const bounds = graphCanvas.getBoundingClientRect();
  return {
    x: Math.max(40, Math.min(860, (event.clientX - bounds.left) / bounds.width * 900)),
    y: Math.max(40, Math.min(480, (event.clientY - bounds.top) / bounds.height * 520))
  };
}

graphCanvas.addEventListener('pointerdown', (event) => {
  if (editorLocked || event.button !== 0) return;
  const nodeTarget = event.target.closest?.('[data-node-id]');
  const edgeTarget = event.target.closest?.('[data-edge-id]');
  if (nodeTarget) {
    const id = nodeTarget.dataset.nodeId;
    if (editMode === 'connect') { event.preventDefault(); chooseConnectNode(id); return; }
    if (editMode !== 'select') return;
    selectedNodeId = id;
    selectedEdgeId = null;
    const node = nodes.find((entry) => entry.id === id);
    const point = graphPoint(event);
    dragState = { id, pointerId: event.pointerId, dx: node.x - point.x, dy: node.y - point.y, moved: false };
    try { graphCanvas.setPointerCapture(event.pointerId); } catch (_) { /* Pointer capture is optional on older browsers. */ }
    updateControls();
    return;
  }
  if (edgeTarget && editMode === 'select') {
    selectedEdgeId = edgeTarget.dataset.edgeId;
    selectedNodeId = null;
    renderGraph();
    return;
  }
  if (editMode === 'add') {
    const point = graphPoint(event);
    addNode(document.getElementById('nodeLabel').value, point);
    return;
  }
  if (editMode === 'select') {
    selectedNodeId = null;
    selectedEdgeId = null;
    renderGraph();
  }
});

graphCanvas.addEventListener('pointermove', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId || editorLocked) return;
  const point = graphPoint(event);
  const node = nodes.find((entry) => entry.id === dragState.id);
  if (!node) return;
  const x = Math.max(42, Math.min(858, point.x + dragState.dx));
  const y = Math.max(42, Math.min(478, point.y + dragState.dy));
  if (Math.abs(x - node.x) > 1 || Math.abs(y - node.y) > 1) dragState.moved = true;
  node.x = x;
  node.y = y;
  renderGraph();
});

graphCanvas.addEventListener('pointerup', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  const moved = dragState.moved;
  dragState = null;
  renderGraph();
  if (moved) setFeedback(`Moved node ${labelOf(selectedNodeId)}.`);
});
graphCanvas.addEventListener('pointercancel', () => { dragState = null; renderGraph(); });

document.querySelectorAll('.graph-mode').forEach((button) => {
  button.addEventListener('click', () => {
    if (editorLocked) return;
    editMode = button.dataset.mode;
    connectFrom = null;
    connectTo = null;
    document.querySelectorAll('.graph-mode').forEach((modeButton) => {
      const active = modeButton === button;
      modeButton.classList.toggle('is-active', active);
      modeButton.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('canvasHint').textContent = editMode === 'add'
      ? 'Click an empty area to place a node. A unique label is generated if the label field is empty.'
      : editMode === 'connect'
        ? 'Select two nodes, set an optional weight, then confirm the connection.'
        : 'Select a node to drag it or choose an item to delete.';
    renderGraph();
  });
});

document.getElementById('addNodeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  addNode(document.getElementById('nodeLabel').value, defaultPosition());
});
document.getElementById('addEdgeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!connectFrom || !connectTo) return setFeedback('Select two different nodes in Connect mode first.', true);
  addEdge(connectFrom, connectTo);
});
document.getElementById('deleteSelection').addEventListener('click', deleteSelection);
document.getElementById('clearGraph').addEventListener('click', clearGraph);
document.getElementById('loadSample').addEventListener('click', () => loadSample(document.getElementById('sampleGraph').value));
document.getElementById('connectSelection').addEventListener('click', () => {
  if (!connectFrom || !connectTo) return setFeedback('Select two different nodes in Connect mode first.', true);
  addEdge(connectFrom, connectTo);
});
directedToggle.addEventListener('change', () => { resetAlgorithmRun('Graph direction updated.'); renderGraph(); });
weightedToggle.addEventListener('change', () => { resetAlgorithmRun('Edge weighting updated.'); renderGraph(); });
algorithmSelect.addEventListener('change', updateAlgorithmInfo);
document.getElementById('graphReset').addEventListener('click', () => resetAlgorithmRun('Run reset. The graph is ready to edit.'));
document.getElementById('graphStep').addEventListener('click', stepOnce);
graphPlay.addEventListener('click', play);
graphPause.addEventListener('click', pause);
graphSpeed.addEventListener('input', () => { document.getElementById('graphSpeedValue').value = `${graphSpeed.value}%`; });
document.addEventListener('keydown', (event) => {
  if (!['Delete', 'Backspace'].includes(event.key) || editorLocked) return;
  const tag = document.activeElement?.tagName;
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
  deleteSelection();
});

function initialize() {
  updateAlgorithmInfo();
  updateNodeOptions();
  renderGraph();
  updateControls();
}

initialize();
