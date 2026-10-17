import { useCallback, useEffect, useMemo, useState } from "react";
import type { ViewMode } from "../App";
import EvaluationPanel, { EvalRow } from "../components/EvaluationPanel";
import { api } from "../lib/api";
import type { EngineResult, Route, Warehouse } from "../lib/types";

interface Props {
  view: ViewMode;
}

export default function LogisticsMap({ view }: Props) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [source, setSource] = useState<number | "">("");
  const [target, setTarget] = useState<number | "">("");
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.graphSummary();
      setWarehouses(data.warehouses);
      setRoutes(data.routes);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(
    () => Object.fromEntries(warehouses.map((w) => [w.warehouse_id, w])),
    [warehouses]
  );

  const addWarehouse = async (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 520);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 460);
    const name = window.prompt("New warehouse name:");
    if (!name) return;
    try {
      await api.createWarehouse({ name, x_coord: x, y_coord: y, capacity_kg: 1000 });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onNodeClick = async (id: number) => {
    const next = [...selected, id];
    if (next.length < 2) {
      setSelected(next);
      return;
    }
    const [a, b] = next.slice(0, 2);
    setSelected([]);
    if (a === b) return;
    const km = window.prompt(`Distance (km) between warehouse ${a} and ${b}:`, "25");
    if (!km) return;
    try {
      await api.createRoute({ source_id: a, dest_id: b, distance_km: Number(km) });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const runDijkstra = async () => {
    if (source === "" || target === "") return;
    setBusy(true);
    try {
      const res = await api.optimizeRoute(Number(source), Number(target));
      setResult(res);
      setPath((res.path as number[]) ?? []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runMst = async () => {
    setBusy(true);
    try {
      const res = await api.mst();
      setResult(res);
      setPath([]);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const daa: EvalRow[] = result
    ? [
        { label: "algorithm", value: String(result.algo) },
        { label: "complexity", value: String(result.complexity ?? "") },
        { label: "execution", value: `${Number(result.executionMs).toFixed(3)} ms` },
        ...(result.distance != null ? [{ label: "distance", value: String(result.distance) }] : []),
        ...(result.totalWeight != null
          ? [{ label: "mst total", value: String(result.totalWeight) }]
          : []),
        ...(result.pathNames
          ? [{ label: "path", value: (result.pathNames as string[]).join(" -> ") }]
          : []),
      ]
    : [];

  const rdbms: EvalRow[] = result?.sql
    ? [
        { label: "query", value: String(result.sql) },
        { label: "rows", value: `${routes.length} routes / ${warehouses.length} nodes` },
      ]
    : [];

  const edgeKey = (a: number, b: number) =>
    [a, b].sort((x, y) => x - y).join("-");
  const pathEdges = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) pathEdges.add(edgeKey(path[i], path[i + 1]));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value ? Number(e.target.value) : "")}
            className="input max-w-[180px]"
          >
            <option value="">Start warehouse</option>
            {warehouses.map((w) => (
              <option key={w.warehouse_id} value={w.warehouse_id}>
                {w.name}
              </option>
            ))}
          </select>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value ? Number(e.target.value) : "")}
            className="input max-w-[180px]"
          >
            <option value="">Destination</option>
            {warehouses.map((w) => (
              <option key={w.warehouse_id} value={w.warehouse_id}>
                {w.name}
              </option>
            ))}
          </select>
          <button onClick={runDijkstra} disabled={busy} className="btn-primary">
            Run Dijkstra Route
          </button>
          <button onClick={runMst} disabled={busy} className="btn-ghost">
            Build MST Backbone
          </button>
          <span className="text-xs text-slate-500">
            Click canvas to add a warehouse · click two nodes to link them
          </span>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        <svg
          viewBox="0 0 520 460"
          className="h-[460px] w-full cursor-crosshair rounded-lg border border-base-600/60 bg-base-900"
          onClick={addWarehouse}
        >
          {routes.map((r) => {
            const a = byId[r.source_id];
            const b = byId[r.dest_id];
            if (!a || !b) return null;
            const onPath = pathEdges.has(edgeKey(r.source_id, r.dest_id));
            return (
              <g key={r.route_id}>
                <line
                  x1={a.x_coord}
                  y1={a.y_coord}
                  x2={b.x_coord}
                  y2={b.y_coord}
                  stroke={onPath ? "#22d3ee" : "#334155"}
                  strokeWidth={onPath ? 3 : 1.5}
                  className={onPath ? "animate-pulse" : ""}
                />
                <text
                  x={(a.x_coord + b.x_coord) / 2}
                  y={(a.y_coord + b.y_coord) / 2 - 4}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {r.distance_km}km
                </text>
              </g>
            );
          })}

          {warehouses.map((w) => {
            const active = selected.includes(w.warehouse_id) || path.includes(w.warehouse_id);
            return (
              <g
                key={w.warehouse_id}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(w.warehouse_id);
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={w.x_coord}
                  cy={w.y_coord}
                  r={12}
                  fill={active ? "#22d3ee" : "#1e2b4d"}
                  stroke={active ? "#a5f3fc" : "#475569"}
                  strokeWidth={2}
                />
                <text
                  x={w.x_coord}
                  y={w.y_coord - 18}
                  fill="#cbd5e1"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {w.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="space-y-4">
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Network</h3>
          <p className="text-xs text-slate-400">
            {warehouses.length} warehouses · {routes.length} transit routes
          </p>
        </div>
        <EvaluationPanel view={view} daa={daa} rdbms={rdbms} />
      </div>
    </div>
  );
}
