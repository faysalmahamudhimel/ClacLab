(function () {
  function labelOf(graph, id) {
    return graph.nodes.find((node) => node.id === id)?.label || String(id);
  }

  function buildAdjacency(graph) {
    const adjacency = new Map(graph.nodes.map((node) => [node.id, []]));
    graph.edges.forEach((edge) => {
      const weight = graph.weighted ? edge.weight : 1;
      adjacency.get(edge.from).push({ nodeId: edge.to, edgeId: edge.id, weight });
      if (!graph.directed) adjacency.get(edge.to).push({ nodeId: edge.from, edgeId: edge.id, weight });
    });
    return adjacency;
  }

  function createTraversalSteps(graph, algorithm, startId) {
    if (!graph.nodes.length) throw new Error('Add at least one node before starting a traversal.');
    if (!graph.nodes.some((node) => node.id === startId)) throw new Error('Choose a valid start node.');
    const adjacency = buildAdjacency(graph);
    const frames = [];
    const visited = new Set();
    const order = [];
    const traversalEdges = [];
    function record(action, data = {}) {
      frames.push({ action, visited: [...visited], order: [...order], traversalEdges: [...traversalEdges], ...data });
    }

    if (algorithm === 'bfs') {
      const queue = [startId];
      const discovered = new Set([startId]);
      record('enqueue', { queue: [...queue], activeNode: null, activeEdge: null, explanation: `Add start node ${labelOf(graph, startId)} to the queue.` });
      while (queue.length) {
        const current = queue.shift();
        visited.add(current);
        order.push(current);
        record('visit', { queue: [...queue], activeNode: current, activeEdge: null, explanation: `Remove ${labelOf(graph, current)} from the queue and visit it.` });
        for (const neighbor of adjacency.get(current)) {
          record('inspect', { queue: [...queue], activeNode: current, activeEdge: neighbor.edgeId, explanation: `Inspect edge ${labelOf(graph, current)} → ${labelOf(graph, neighbor.nodeId)}.` });
          if (!discovered.has(neighbor.nodeId)) {
            discovered.add(neighbor.nodeId);
            queue.push(neighbor.nodeId);
            traversalEdges.push(neighbor.edgeId);
            record('enqueue', { queue: [...queue], activeNode: current, activeEdge: neighbor.edgeId, explanation: `Discover ${labelOf(graph, neighbor.nodeId)} and add it to the queue.` });
          }
        }
      }
      record('complete', { queue: [], activeNode: null, activeEdge: null, done: true, explanation: `BFS finished. It visited the ${order.length} node${order.length === 1 ? '' : 's'} reachable from ${labelOf(graph, startId)}.` });
      return frames;
    }

    const stack = [{ nodeId: startId, nextNeighbor: 0 }];
    visited.add(startId);
    order.push(startId);
    record('visit', { stack: [startId], activeNode: startId, activeEdge: null, explanation: `Visit ${labelOf(graph, startId)} and push it onto the DFS call stack.` });
    while (stack.length) {
      const top = stack[stack.length - 1];
      const neighbors = adjacency.get(top.nodeId);
      if (top.nextNeighbor >= neighbors.length) {
        const finished = stack.pop();
        record('backtrack', { stack: stack.map((entry) => entry.nodeId), activeNode: stack.length ? stack[stack.length - 1].nodeId : null, activeEdge: null, explanation: `Finish ${labelOf(graph, finished.nodeId)} and backtrack.` });
        continue;
      }
      const neighbor = neighbors[top.nextNeighbor];
      top.nextNeighbor += 1;
      record('inspect', { stack: stack.map((entry) => entry.nodeId), activeNode: top.nodeId, activeEdge: neighbor.edgeId, explanation: `Inspect ${labelOf(graph, neighbor.nodeId)} from ${labelOf(graph, top.nodeId)}.` });
      if (!visited.has(neighbor.nodeId)) {
        visited.add(neighbor.nodeId);
        order.push(neighbor.nodeId);
        traversalEdges.push(neighbor.edgeId);
        stack.push({ nodeId: neighbor.nodeId, nextNeighbor: 0 });
        record('visit', { stack: stack.map((entry) => entry.nodeId), activeNode: neighbor.nodeId, activeEdge: neighbor.edgeId, explanation: `Visit ${labelOf(graph, neighbor.nodeId)} and continue deeper.` });
      }
    }
    record('complete', { stack: [], activeNode: null, activeEdge: null, done: true, explanation: `DFS finished. It visited the ${order.length} node${order.length === 1 ? '' : 's'} reachable from ${labelOf(graph, startId)}.` });
    return frames;
  }

  function createDijkstraSteps(graph, sourceId, destinationId) {
    if (!graph.nodes.length) throw new Error('Add at least one node before running Dijkstra.');
    if (!graph.nodes.some((node) => node.id === sourceId) || !graph.nodes.some((node) => node.id === destinationId)) throw new Error('Choose valid source and destination nodes.');
    if (graph.weighted && graph.edges.some((edge) => !Number.isFinite(edge.weight) || edge.weight < 0)) throw new Error('Dijkstra requires non-negative edge weights. Fix or remove negative weights first.');

    const adjacency = buildAdjacency(graph);
    const distances = new Map(graph.nodes.map((node) => [node.id, Infinity]));
    const previous = new Map(graph.nodes.map((node) => [node.id, null]));
    const previousEdge = new Map();
    const settled = new Set();
    const frames = [];
    distances.set(sourceId, 0);

    function makeDistanceTable() {
      return graph.nodes.map((node) => ({
        nodeId: node.id,
        distance: distances.get(node.id),
        previous: previous.get(node.id),
        state: settled.has(node.id) ? 'Visited' : 'Unvisited'
      }));
    }
    function record(action, currentNode = null, activeEdge = null, explanation = '') {
      frames.push({ action, currentNode, activeEdge, distances: makeDistanceTable(), settled: [...settled], explanation });
    }

    record('start', null, null, `Set the distance to ${labelOf(graph, sourceId)} to 0; all other distances start at infinity.`);
    while (settled.size < graph.nodes.length) {
      let current = null;
      let minimumDistance = Infinity;
      for (const node of graph.nodes) {
        const candidate = distances.get(node.id);
        if (!settled.has(node.id) && candidate < minimumDistance) {
          current = node.id;
          minimumDistance = candidate;
        }
      }
      if (current === null) break;
      settled.add(current);
      record('settle', current, null, `Select ${labelOf(graph, current)} with the smallest tentative distance (${minimumDistance}).`);
      if (current === destinationId) break;

      for (const neighbor of adjacency.get(current)) {
        if (settled.has(neighbor.nodeId)) {
          record('inspect', current, neighbor.edgeId, `Skip ${labelOf(graph, neighbor.nodeId)} because it is already settled.`);
          continue;
        }
        const candidate = distances.get(current) + neighbor.weight;
        if (candidate < distances.get(neighbor.nodeId)) {
          distances.set(neighbor.nodeId, candidate);
          previous.set(neighbor.nodeId, current);
          previousEdge.set(neighbor.nodeId, neighbor.edgeId);
          record('relax', current, neighbor.edgeId, `Update ${labelOf(graph, neighbor.nodeId)}: ${minimumDistance} + ${neighbor.weight} = ${candidate}.`);
        } else {
          record('inspect', current, neighbor.edgeId, `Keep the current distance to ${labelOf(graph, neighbor.nodeId)} (${distances.get(neighbor.nodeId)}).`);
        }
      }
    }

    const reachable = Number.isFinite(distances.get(destinationId));
    const pathNodes = [];
    const pathEdges = [];
    if (reachable) {
      let current = destinationId;
      pathNodes.push(current);
      while (current !== sourceId) {
        const edgeId = previousEdge.get(current);
        current = previous.get(current);
        if (current === null || !edgeId) break;
        pathNodes.push(current);
        pathEdges.push(edgeId);
      }
      pathNodes.reverse();
      pathEdges.reverse();
    }
    record('complete', null, null, reachable
      ? `Shortest path ${pathNodes.map((id) => labelOf(graph, id)).join(' → ')} has total cost ${distances.get(destinationId)}.`
      : `No path exists from ${labelOf(graph, sourceId)} to ${labelOf(graph, destinationId)}.`);
    Object.assign(frames[frames.length - 1], {
      done: true,
      sourceId,
      destinationId,
      reachable,
      pathNodes,
      pathEdges,
      totalCost: reachable ? distances.get(destinationId) : Infinity
    });
    return frames;
  }

  window.GraphAlgorithms = { buildAdjacency, createTraversalSteps, createDijkstraSteps };
})();
