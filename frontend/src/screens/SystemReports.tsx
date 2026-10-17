import { useEffect, useState } from "react";
import type { ViewMode } from "../App";
import EvaluationPanel, { EvalRow } from "../components/EvaluationPanel";
import { api } from "../lib/api";
import type { EngineResult } from "../lib/types";

interface Props {
  view: ViewMode;
}

export default function SystemReports({ view }: Props) {
  const [sortResult, setSortResult] = useState<EngineResult | null>(null);
  const [huffman, setHuffman] = useState<EngineResult | null>(null);
  const [summary, setSummary] = useState<any[]>([]);
  const [text, setText] = useState(
    "OPTIR0UTE operat10nal 10g entry 001 :: wareh0use n0rth dispatched batch 12 OPTIR0UTE"
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .reportSummary()
      .then((d) => setSummary(d.rows))
      .catch((e) => setError((e as Error).message));
  }, []);

  const runSort = async (algorithm: string) => {
    setBusy(true);
    try {
      setSortResult(await api.sortRows(algorithm));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runHuffman = async () => {
    setBusy(true);
    try {
      setHuffman(await api.huffman(text));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    window.open("/api/reports/summary/export", "_blank");
  };

  const rows = (sortResult?.rows as any[]) ?? [];
  const codes = (huffman?.codes as any[]) ?? [];

  const daa: EvalRow[] = [];
  if (sortResult)
    daa.push(
      { label: "algorithm", value: String(sortResult.algo) },
      { label: "comparisons", value: String(sortResult.comparisons) },
      { label: "execution", value: `${Number(sortResult.executionMs).toFixed(3)} ms` }
    );
  if (huffman)
    daa.push(
      { label: "raw bytes", value: String(huffman.rawBytes) },
      { label: "compressed", value: String(huffman.compressedBytes) },
      { label: "bandwidth saved", value: `${huffman.bandwidthSavedPercent}%` }
    );

  const rdbms: EvalRow[] = sortResult?.sql
    ? [{ label: "query", value: String(sortResult.sql) }, { label: "view", value: "v_warehouse_summary" }]
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="card">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Analytics Sorting (D&amp;C)</h3>
            <button onClick={() => runSort("quicksort")} disabled={busy} className="btn-ghost text-xs">
              Quick Sort
            </button>
            <button onClick={() => runSort("mergesort")} disabled={busy} className="btn-ghost text-xs">
              Merge Sort
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(rows.length ? rows : summary).map((r, i) => {
              const value = Number(r.value ?? r.total_declared_value ?? 0);
              return (
                <div
                  key={i}
                  className="relative w-8 rounded-t bg-gradient-to-t from-cyan-500/30 to-cyan-400/80"
                  style={{ height: `${Math.max(8, Math.min(120, value / 200))}px` }}
                  title={`${r.id ?? r.warehouse_id}: ${value}`}
                >
                  <span className="absolute -bottom-4 left-0 text-[9px] text-slate-500">
                    {r.id ?? r.warehouse_id}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">
            Log Archiver (Huffman Compression)
          </h3>
          <textarea
            className="input h-24 font-mono text-xs"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-3">
            <button onClick={runHuffman} disabled={busy} className="btn-primary">
              Compress Logs
            </button>
            {huffman && (
              <span className="text-xs text-slate-400">
                Raw {String(huffman.rawBytes)} B → Compressed {String(huffman.compressedBytes)} B
                <span className="ml-2 text-emerald-300">
                  saved {String(huffman.bandwidthSavedPercent)}%
                </span>
              </span>
            )}
          </div>
          {codes.length > 0 && (
            <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto font-mono text-[10px]">
              {codes.map((c, i) => (
                <span key={i} className="rounded border border-base-600 bg-base-900/60 px-2 py-1">
                  <span className="text-cyan-300">{JSON.stringify(c.char)}</span>
                  <span className="ml-1 text-slate-400">{c.code}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Multi-table View Export (v_warehouse_summary)
            </h3>
            <button onClick={download} className="btn-ghost text-xs">
              Export RDBMS Summary
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="py-1">Warehouse</th>
                <th>Capacity</th>
                <th>Routes</th>
                <th>Packages</th>
                <th>Declared Value</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r) => (
                <tr key={r.warehouse_id} className="border-t border-base-600/40">
                  <td className="py-1">{r.name}</td>
                  <td>{r.capacity_kg}</td>
                  <td>{r.route_count}</td>
                  <td>{r.package_count}</td>
                  <td>{r.total_declared_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EvaluationPanel view={view} daa={daa} rdbms={rdbms} />
    </div>
  );
}
