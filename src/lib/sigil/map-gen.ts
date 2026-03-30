// ── SIGIL: Procedural Map Generation ────────────────────────────────────────

import type { GameMap, MapNode, NodeType } from "./types";
import { mulberry32 } from "./data-runes";

let _nodeId = 0;
function nid() { return `node_${++_nodeId}`; }

/**
 * Generate a branching node map for one act.
 * Structure: 7 rows, 2-4 nodes per row, with forward connections.
 * Row 0 = start, Row 6 = boss.
 */
export function generateMap(act: number, seed: number): GameMap {
  const rng = mulberry32(seed);
  const rows: MapNode[][] = [];

  // Row 0: single starting combat node
  const startNode: MapNode = {
    id: nid(), row: 0, col: 1, type: "combat", connections: [], visited: false, current: true,
  };
  rows.push([startNode]);

  // Rows 1-5: procedurally generated
  for (let r = 1; r <= 5; r++) {
    const nodeCount = 2 + Math.floor(rng() * 2); // 2-3 nodes
    const rowNodes: MapNode[] = [];

    for (let c = 0; c < nodeCount; c++) {
      const type = pickNodeType(r, act, rng);
      rowNodes.push({
        id: nid(), row: r, col: c, type, connections: [], visited: false,
      });
    }
    rows.push(rowNodes);
  }

  // Row 6: boss node
  const bossNode: MapNode = {
    id: nid(), row: 6, col: 1, type: "boss", connections: [], visited: false,
  };
  rows.push([bossNode]);

  // Connect rows: each node connects to 1-2 nodes in the next row
  for (let r = 0; r < rows.length - 1; r++) {
    const currentRow = rows[r];
    const nextRow = rows[r + 1];

    for (const node of currentRow) {
      // Connect to at least 1, up to 2 nodes in next row
      const primary = Math.floor(rng() * nextRow.length);
      node.connections.push(nextRow[primary].id);

      if (nextRow.length > 1 && rng() > 0.4) {
        let secondary = (primary + 1) % nextRow.length;
        if (!node.connections.includes(nextRow[secondary].id)) {
          node.connections.push(nextRow[secondary].id);
        }
      }
    }

    // Ensure every next-row node has at least one incoming connection
    for (const nextNode of nextRow) {
      const hasIncoming = currentRow.some(n => n.connections.includes(nextNode.id));
      if (!hasIncoming) {
        const connector = currentRow[Math.floor(rng() * currentRow.length)];
        connector.connections.push(nextNode.id);
      }
    }
  }

  const allNodes = rows.flat();
  const rowIds = rows.map(row => row.map(n => n.id));

  return { nodes: allNodes, rows: rowIds };
}

function pickNodeType(row: number, act: number, rng: () => number): NodeType {
  const roll = rng();

  // Row 3 is always the elite row
  if (row === 3) return "elite";

  // Row 5 is rest before boss
  if (row === 5) {
    return roll < 0.6 ? "rest" : (roll < 0.8 ? "shop" : "event");
  }

  // Other rows: weighted distribution
  if (roll < 0.45) return "combat";
  if (roll < 0.60) return "event";
  if (roll < 0.75) return "shop";
  if (roll < 0.85) return "rest";
  if (roll < 0.92) return "treasure";
  return "elite";
}

export function getNodeById(map: GameMap, id: string): MapNode | undefined {
  return map.nodes.find(n => n.id === id);
}

export function getCurrentNode(map: GameMap): MapNode | undefined {
  return map.nodes.find(n => n.current);
}

export function getReachableNodes(map: GameMap): MapNode[] {
  const current = getCurrentNode(map);
  if (!current) return [];
  return current.connections
    .map(id => getNodeById(map, id))
    .filter((n): n is MapNode => n != null);
}

export function moveToNode(map: GameMap, nodeId: string): GameMap {
  const nodes = map.nodes.map(n => ({
    ...n,
    current: n.id === nodeId,
    visited: n.visited || n.current, // mark previous node as visited
  }));
  return { ...map, rows: map.rows, nodes };
}
