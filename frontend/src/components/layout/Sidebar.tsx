export type TabId = "logistics" | "dispatch" | "index" | "database" | "reports";

interface Props {
  tab: TabId;
  onSelect: (tab: TabId) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const ITEMS: { id: TabId; label: string; hint: string }[] = [
  { id: "logistics", label: "Logistics Map", hint: "Dijkstra / MST" },
  { id: "dispatch", label: "Smart Dispatch", hint: "Heap / Knapsack" },
  { id: "index", label: "Core Index Inspector", hint: "AVL Tree" },
  { id: "database", label: "Database Control", hint: "DCL / TCL / PL-SQL" },
  { id: "reports", label: "System Reports", hint: "Huffman / Sorting" },
];

export default function Sidebar({ tab, onSelect, collapsed, onToggle }: Props) {
  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-base-600/60 bg-base-800/80 transition-all ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 shadow-glow" />
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-100">OptiRoute</div>
            <div className="text-[11px] text-slate-400">CoreDB Command Center</div>
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-2">
        {ITEMS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40"
                  : "text-slate-300 hover:bg-base-700/60"
              }`}
              title={item.label}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  active ? "bg-cyan-400 shadow-glow" : "bg-slate-600"
                }`}
              />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate">{item.label}</span>
                  <span className="block truncate text-[11px] text-slate-500">{item.hint}</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="m-2 rounded-lg border border-base-600 px-3 py-2 text-xs text-slate-400 hover:bg-base-700/60"
      >
        {collapsed ? ">>" : "<< Collapse"}
      </button>
    </aside>
  );
}
