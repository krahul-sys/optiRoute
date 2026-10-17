import type { ViewMode } from "../App";

export interface EvalRow {
  label: string;
  value: string;
}

interface Props {
  view: ViewMode;
  daa: EvalRow[];
  rdbms: EvalRow[];
}

export default function EvaluationPanel({ view, daa, rdbms }: Props) {
  const daaActive = view === "DAA";
  return (
    <div className="space-y-3">
      <section
        className={`card transition-all ${
          daaActive ? "ring-2 ring-cyan-500/50" : "opacity-60"
        }`}
      >
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <span className="badge bg-cyan-500/20 text-cyan-300">DAA</span>
          Algorithm Execution Log
        </h3>
        <dl className="space-y-1 font-mono text-[11px]">
          {daa.length === 0 && <p className="text-slate-500">Run an operation to trace the C++ engine.</p>}
          {daa.map((row) => (
            <div key={row.label} className="flex justify-between gap-2">
              <dt className="text-slate-400">{row.label}</dt>
              <dd className="truncate text-slate-200">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className={`card transition-all ${
          !daaActive ? "ring-2 ring-violet-500/50" : "opacity-60"
        }`}
      >
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-300">
          <span className="badge bg-violet-500/20 text-violet-300">RDBMS</span>
          Oracle Statements
        </h3>
        <dl className="space-y-1 font-mono text-[11px]">
          {rdbms.length === 0 && <p className="text-slate-500">No query captured yet.</p>}
          {rdbms.map((row) => (
            <div key={row.label} className="flex justify-between gap-2">
              <dt className="text-slate-400">{row.label}</dt>
              <dd className="truncate text-slate-200">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
