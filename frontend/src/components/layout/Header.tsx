import { useEffect, useState } from "react";
import type { ViewMode } from "../../App";
import { api } from "../../lib/api";
import type { Health, Role } from "../../lib/types";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  role: Role;
  onRoleChange: (r: Role) => void;
}

const ROLES: Role[] = ["ADMIN", "DRIVER", "VIEWER"];

export default function Header({ view, onViewChange, role, onRoleChange }: Props) {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const h = await api.health();
        if (!stop) setHealth(h);
      } catch {
        /* backend warming up */
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const dbHealthy = health?.database.healthy;
  const engineMs = health?.engine.latencyMs ?? 0;

  return (
    <header className="sticky top-0 z-10 border-b border-base-600/60 bg-base-800/80 px-5 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">
            Enterprise Logistics &amp; Engineering Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Isolated computational layer (C++) + permanent storage layer (Oracle)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-base-600">
            <button
              onClick={() => onViewChange("DAA")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "DAA" ? "bg-cyan-500 text-base-900" : "bg-base-700/50 text-slate-300"
              }`}
            >
              View: DAA Engine
            </button>
            <button
              onClick={() => onViewChange("RDBMS")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "RDBMS" ? "bg-violet-500 text-base-900" : "bg-base-700/50 text-slate-300"
              }`}
            >
              View: Oracle RDBMS
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            Role
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as Role)}
              className="rounded-lg border border-base-600 bg-base-900/80 px-2 py-1.5 text-xs text-slate-100 outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              dbHealthy ? "bg-neon-green shadow-glow" : "bg-neon-rose"
            }`}
          />
          Oracle Pool {dbHealthy ? "Healthy" : "Degraded"}
          {health && ` (${health.database.busy}/${health.database.open} busy)`}
        </span>
        <span className="text-slate-600">|</span>
        <span>
          C++ Engine Latency:{" "}
          <span className="font-mono text-cyan-300">{engineMs.toFixed(3)} ms</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="font-mono">{health?.database.dsn ?? "oracle-db:1521/XEPDB1"}</span>
      </div>
    </header>
  );
}
