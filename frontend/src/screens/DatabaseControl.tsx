import { useEffect, useState } from "react";
import type { ViewMode } from "../App";
import EvaluationPanel, { EvalRow } from "../components/EvaluationPanel";
import { api } from "../lib/api";
import type { Role } from "../lib/types";

interface Props {
  view: ViewMode;
  role: Role;
  onRoleChange: (r: Role) => void;
}

export default function DatabaseControl({ view, role, onRoleChange }: Props) {
  const [roles, setRoles] = useState<any[]>([]);
  const [grants, setGrants] = useState<string[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [tcl, setTcl] = useState<{ outcome: string; steps: string[]; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      const data = await api.logs(30);
      setLogs(data.logs);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    api
      .roles()
      .then((d) => {
        setRoles(d.roles);
        setGrants(d.grants);
      })
      .catch((e) => setError((e as Error).message));
    loadLogs();
  }, []);

  const runTcl = async () => {
    try {
      setTcl(await api.tclSandbox());
      await loadLogs();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const driverRestricted = role !== "ADMIN";

  const daa: EvalRow[] = tcl
    ? [{ label: "outcome", value: tcl.outcome }]
    : [];

  const rdbms: EvalRow[] = [
    { label: "active role", value: role },
    { label: "pipeline", value: "BEGIN TRANSACTION / ROLLBACK" },
    { label: "trigger", value: "trg_package_status_audit" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-violet-300">1. Security Simulator (DCL)</h3>
            <select
              className="input"
              value={role}
              onChange={(e) => onRoleChange(e.target.value as Role)}
            >
              {["ADMIN", "DRIVER", "VIEWER"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ul className="mt-3 space-y-1 text-[11px] text-slate-400">
              {grants.map((g) => (
                <li key={g} className="font-mono">
                  {g}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              Structural config:{" "}
              <span className={driverRestricted ? "text-rose-400" : "text-emerald-400"}>
                {driverRestricted ? "GREYED OUT" : "ENABLED"}
              </span>
            </p>
          </div>

          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-cyan-300">2. PL/SQL Trigger Tracker</h3>
            <div className="max-h-[220px] space-y-1 overflow-y-auto font-mono text-[10px]">
              {logs.length === 0 && <p className="text-slate-500">No trigger events yet.</p>}
              {logs.map((l) => (
                <div key={l.log_id} className="rounded border border-base-600/40 bg-base-900/60 px-2 py-1">
                  <span className="text-cyan-300">[ORACLE TRIGGER]</span> {l.action} on{" "}
                  {l.package_code ?? "?"}
                  <div className="truncate text-slate-500">{String(l.payload ?? "")}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-amber-300">
              3. Transaction Control Sandbox (TCL)
            </h3>
            <button onClick={runTcl} className="btn-ghost w-full">
              Simulate Network Disconnection during Batch Order
            </button>
            {tcl && (
              <div className="mt-3 space-y-1 font-mono text-[11px]">
                {tcl.steps.map((s, i) => (
                  <div
                    key={i}
                    className={
                      s.includes("ROLLBACK") || s.includes("FAILURE")
                        ? "text-rose-400"
                        : s.includes("COMMIT")
                        ? "text-emerald-400"
                        : "text-slate-300"
                    }
                  >
                    {s}
                  </div>
                ))}
                {tcl.error && <div className="text-rose-400">{tcl.error}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Role Privilege Matrix</h3>
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="py-1">Role</th>
                <th>Session</th>
                <th>Select Warehouses</th>
                <th>Modify Packages</th>
                <th>Modify Schema</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.role} className="border-t border-base-600/40">
                  <td className="py-1 font-mono">{r.role}</td>
                  <td>{r.session ? "Y" : "-"}</td>
                  <td>{r.select_warehouses ? "Y" : "-"}</td>
                  <td>{r.modify_packages ? "Y" : "-"}</td>
                  <td>{r.modify_schema ? "Y" : "-"}</td>
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
