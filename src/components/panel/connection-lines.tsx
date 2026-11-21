import { ELEMENT_COLORS } from "../../types/index.ts";
import type { ElementColor } from "../../types/index.ts";
import type { PanelState } from "../../lib/optimizer/types.ts";

interface Connection {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  element: ElementColor;
  type: "component" | "link"; // component = same piece (thick), link = ★↔★ different pieces (bright thin)
}

export function ConnectionLines({
  panelState,
  cellSize,
  gap,
  padding,
}: {
  panelState: PanelState;
  cellSize: number;
  gap: number;
  padding: number;
}) {
  const connections = findConnections(panelState);
  if (connections.length === 0) return null;

  const rows = panelState.length;
  const cols = panelState[0]?.length ?? 0;
  const stride = cellSize + gap;
  const width = padding * 2 + cols * cellSize + (cols - 1) * gap;
  const height = padding * 2 + rows * cellSize + (rows - 1) * gap;

  const center = (r: number, c: number) => ({
    x: padding + c * stride + cellSize / 2,
    y: padding + r * stride + cellSize / 2,
  });

  const componentLines = connections.filter((c) => c.type === "component");
  const linkLines = connections.filter((c) => c.type === "link");

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${width} ${height}`}
      style={{ zIndex: 0 }}
    >
      {/* Component shape lines: thick, muted (same piece) */}
      {componentLines.map((conn, i) => {
        const a = center(conn.r1, conn.c1);
        const b = center(conn.r2, conn.c2);
        return (
          <line
            key={`c${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={ELEMENT_COLORS[conn.element]}
            strokeWidth={cellSize * 0.2}
            strokeLinecap="round"
            opacity={0.25}
          />
        );
      })}
      {/* Link lines: thin, bright (★↔★ same element, different components) */}
      {linkLines.map((conn, i) => {
        const a = center(conn.r1, conn.c1);
        const b = center(conn.r2, conn.c2);
        return (
          <line
            key={`l${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={ELEMENT_COLORS[conn.element]}
            strokeWidth={cellSize * 0.06}
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

function findConnections(panelState: PanelState): Connection[] {
  const connections: Connection[] = [];
  const rows = panelState.length;
  const cols = panelState[0]?.length ?? 0;
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]; // right, down, down-right, down-left

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = panelState[r][c];
      if (!cell.occupied || !cell.element) continue;

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const neighbor = panelState[nr][nc];
        if (!neighbor.occupied || !neighbor.element) continue;

        const isDiagonal = dr !== 0 && dc !== 0;

        // Same component piece → thick component line
        if (cell.componentIndex != null && cell.componentIndex === neighbor.componentIndex) {
          // For diagonal: only draw if the two cells aren't already
          // connected orthogonally (i.e., they share no common orthogonal neighbor
          // in the same component)
          if (isDiagonal) {
            const mid1 = panelState[r]?.[nc]; // same row as cell, same col as neighbor
            const mid2 = panelState[nr]?.[c]; // same row as neighbor, same col as cell
            const bridged1 = mid1?.occupied && mid1.componentIndex === cell.componentIndex;
            const bridged2 = mid2?.occupied && mid2.componentIndex === cell.componentIndex;
            if (bridged1 || bridged2) continue; // already connected via orthogonal path
          }
          connections.push({
            r1: r,
            c1: c,
            r2: nr,
            c2: nc,
            element: cell.element,
            type: "component",
          });
        }

        // ★↔★ same element, DIFFERENT components → link line (horizontal & vertical only)
        if (
          !isDiagonal &&
          cell.isLink &&
          neighbor.isLink &&
          cell.element === neighbor.element &&
          cell.componentIndex !== neighbor.componentIndex
        ) {
          connections.push({
            r1: r,
            c1: c,
            r2: nr,
            c2: nc,
            element: cell.element,
            type: "link",
          });
        }
      }
    }
  }
  return connections;
}
