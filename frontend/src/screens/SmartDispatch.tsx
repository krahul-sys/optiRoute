import { useEffect, useState } from "react";
import type { ViewMode } from "../App";
import EvaluationPanel, { EvalRow } from "../components/EvaluationPanel";
import { api } from "../lib/api";
import type { EngineResult, Package } from "../lib/types";

interface Props {
  view: ViewMode;
}

interface HeapNode {
  id: number;
  priority: number;
  index: number;
}

export default function SmartDispatch({ view }: Props) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [heap, setHeap] = useState<EngineResult | null>(null);
  const [knap, setKnap] = useState<EngineResult | null>(null);
  const [capacity, setCapacity] = useState(500);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    code: "",
    weight_kg: 50,
    declared_value: 1000,
    priority: 3,
  });

  const load = async () => {
    try {
      setPackages(await api.packages());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createPackage({
        code: form.code || `PKG-${Date.now() % 100000}`,
        weight_kg: Number(form.weight_kg),
        declared_value: Number(form.declared_value),
        priority: Number(form.priority),
      });
      setForm({ code: "", weight_kg: 50, declared_value: 1000, priority: 3 });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const buildHeap = async () => {
    setBusy(true);
    try {
      setHeap(await api.buildHeap());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const optimize = async () => {
    setBusy(true);
    try {
      setKnap(await api.optimizeLoading(Number(capacity)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const selectedIds = new Set<number>((knap?.selectedIds as number[]) ?? []);
  const heapNodes = (heap?.heap as HeapNode[]) ?? [];

  const daa: EvalRow[] = [];
  if (heap)
    daa.push(
      { label: "heap size", value: String(heap.size) },
      { label: "execution", value: `${Number(heap.executionMs).toFixed(3)} ms` },
      { label: "top priority", value: String(heapNodes[0]?.id ?? "-") }
    );
  if (knap)
    daa.push(
      { label: "knapsack value", value: String(knap.totalValue) },
      { label: "knapsack weight", value: String(knap.totalWeight) },
      { label: "execution", value: `${Number(knap.executionMs).toFixed(3)} ms` }
    );

  const rdbms: EvalRow[] = [];
  if (heap?.sql) rdbms.push({ label: "query", value: heap.sql });
  if (knap?.sql) rdbms.push({ label: "query", value: knap.sql });

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={addPackage} className="card grid grid-cols-2 gap-3 md:grid-cols-5">
          <input
            className="input col-span-2"
            placeholder="Package code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="Weight kg"
            value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })}
          />
          <input
            className="input"
            type="number"
            placeholder="Value"
            value={form.declared_value}
            onChange={(e) => setForm({ ...form, declared_value: Number(e.target.value) })}
          />
          <select
            className="input"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>
                Priority {p}
              </option>
            ))}
          </select>
          <button className="btn-primary col-span-2 md:col-span-5" disabled={busy}>
            Add Package (INSERT)
          </button>
        </form>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">Incoming Packages</h3>
            <div className="max-h-[320px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-1">Code</th>
                    <th>Weight</th>
                    <th>Value</th>
                    <th>Pri</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((p) => (
                    <tr
                      key={p.package_id}
                      className={`border-t border-base-600/40 ${
                        selectedIds.has(p.package_id) ? "bg-emerald-500/10 text-emerald-200" : ""
                      }`}
                    >
                      <td className="py-1 font-mono">{p.code}</td>
                      <td>{p.weight_kg}</td>
                      <td>{p.declared_value}</td>
                      <td>{p.priority}</td>
                      <td>
                        <span className="badge bg-base-700 text-slate-300">{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Priority Heap (Max-Heap)</h3>
              <button onClick={buildHeap} disabled={busy} className="btn-ghost text-xs">
                Build Heap
              </button>
            </div>
            {heapNodes.length === 0 ? (
              <p className="text-xs text-slate-500">Build the heap to visualize bubbling.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {heapNodes.map((n, i) => (
                  <div
                    key={`${n.id}-${i}`}
                    className={`flex h-12 w-12 flex-col items-center justify-center rounded-full border text-[10px] ${
                      i === 0
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                        : "border-base-600 bg-base-700/60 text-slate-300"
                    }`}
                    title={`index ${i}`}
                  >
                    <span className="font-mono">{n.id}</span>
                    <span className="text-slate-500">p{n.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-200">Intelligent Loading Dock</h3>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              Truck capacity (kg)
              <input
                className="input w-24"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </label>
            <button onClick={optimize} disabled={busy} className="btn-primary">
              Optimize Loading (0/1 Knapsack)
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-lg border border-dashed border-base-600 p-3 text-xs text-slate-400">
              {knap ? (
                <>
                  <div className="font-mono text-emerald-300">
                    Selected: {(knap.selectedIds as number[]).join(", ") || "none"}
                  </div>
                  <div className="mt-1">
                    Total value{" "}
                    <span className="font-mono text-cyan-300">{String(knap.totalValue)}</span> ·
                    weight <span className="font-mono">{String(knap.totalWeight)} kg</span>
                  </div>
                </>
              ) : (
                "Run the optimizer to pack the truck."
              )}
            </div>
          </div>
        </div>
      </div>

      <EvaluationPanel view={view} daa={daa} rdbms={rdbms} />
    </div>
  );
}
