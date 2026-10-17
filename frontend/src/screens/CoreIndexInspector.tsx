import { useEffect, useState } from "react";
import type { ViewMode } from "../App";
import EvaluationPanel, { EvalRow } from "../components/EvaluationPanel";
import { api } from "../lib/api";
import type { EngineResult } from "../lib/types";

interface Props {
  view: ViewMode;
}

interface TreeNode {
  key: number;
  height: number;
  bf: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface Placed {
  key: number;
  height: number;
  bf: number;
  x: number;
  y: number;
}

function layout(root: TreeNode | null): { nodes: Placed[]; edges: [Placed, Placed][] } {
  const nodes: Placed[] = [];
  const edges: [Placed, Placed][] = [];
  let counter = 0;

  const walk = (n: TreeNode | null, depth: number): Placed | null => {
    if (!n) return null;
    const left = walk(n.left, depth + 1);
    const placed: Placed = {
      key: n.key,
      height: n.height,
      bf: n.bf,
      x: counter++ * 76,
      y: depth * 70,
    };
    const right = walk(n.right, depth + 1);
    nodes.push(placed);
    if (left) edges.push([placed, left]);
    if (right) edges.push([placed, right]);
    return placed;
  };

  walk(root, 0);
  return { nodes, edges };
}

export default function CoreIndexInspector({ view }: Props) {
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const build = async () => {
    setBusy(true);
    try {
      setResult(await api.buildAvl());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    build();
  }, []);

  const tree = (result?.tree as TreeNode | null) ?? null;
  const { nodes, edges } = layout(tree);
  const rotations = (result?.rotations as any[]) ?? [];
  const keyLabels = (result?.keyLabels as Record<string, string>) ?? {};
  const keyIds = (result?.keyIds as Record<string, number>) ?? {};
  const labelOf = (key: number) => keyLabels[String(key)] ?? String(key);
  const idOf = (key: number) => keyIds[String(key)] ?? key;
  const maxX = Math.max(40, ...nodes.map((n) => n.x + 40));

  const daa: EvalRow[] = result
    ? [
        { label: "algo", value: String(result.algo) },
        { label: "tree height", value: String(result.treeHeight) },
        { label: "rotations", value: String(rotations.length) },
        { label: "execution", value: `${Number(result.executionMs).toFixed(3)} ms` },
        { label: "complexity", value: String(result.complexity ?? "") },
      ]
    : [];

  const rdbms: EvalRow[] = result?.sql
    ? [{ label: "query", value: String(result.sql) }]
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="card">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Self-Balancing AVL Tree (orders indexed by creation time)
            </h3>
            <button onClick={build} disabled={busy} className="btn-ghost text-xs">
              Rebuild Index
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          {tree ? (
            <svg
              viewBox={`-40 -30 ${maxX + 100} ${(Math.max(...nodes.map((n) => n.y)) || 0) + 80}`}
              className="h-[420px] w-full rounded-lg border border-base-600/60 bg-base-900"
            >
              {edges.map(([a, b], i) => (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#334155"
                  strokeWidth={1.5}
                />
              ))}
              {nodes.map((n) => {
                const label = labelOf(n.key);
                return (
                  <g key={n.key}>
                    <title>{`${label} (package_id ${idOf(n.key)})`}</title>
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={24}
                      fill={Math.abs(n.bf) > 1 ? "#fb7185" : "#1e2b4d"}
                      stroke={Math.abs(n.bf) > 1 ? "#fecdd3" : "#22d3ee"}
                      strokeWidth={2}
                    />
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize={label.length > 7 ? 8 : label.length > 5 ? 10 : 12}
                    >
                      {label}
                    </text>
                    <text x={n.x} y={n.y + 38} textAnchor="middle" fill="#64748b" fontSize="9">
                      h{n.height} bf{n.bf}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <p className="text-xs text-slate-500">No entries to index yet. Add orders to see the tree.</p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Rotation Log</h3>
          {rotations.length === 0 ? (
            <p className="text-xs text-slate-500">Tree is balanced — no rotations required.</p>
          ) : (
            <ul className="space-y-1 font-mono text-[11px] text-amber-300">
              {rotations.map((r, i) => (
                <li key={i}>
                  [{i + 1}] {r.rotation} rotation at pivot {labelOf(r.pivot)} ({r.case})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <EvaluationPanel view={view} daa={daa} rdbms={rdbms} />
    </div>
  );
}
