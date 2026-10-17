import { useEffect, useState } from "react";
import Sidebar, { TabId } from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import LogisticsMap from "./screens/LogisticsMap";
import SmartDispatch from "./screens/SmartDispatch";
import CoreIndexInspector from "./screens/CoreIndexInspector";
import DatabaseControl from "./screens/DatabaseControl";
import SystemReports from "./screens/SystemReports";
import { getRole, setRole } from "./lib/api";
import type { Role } from "./lib/types";

export type ViewMode = "DAA" | "RDBMS";

export default function App() {
  const [tab, setTab] = useState<TabId>("logistics");
  const [view, setView] = useState<ViewMode>("DAA");
  const [role, setRoleState] = useState<Role>(getRole());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setRole(role);
  }, [role]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-base-900">
      <Sidebar
        tab={tab}
        onSelect={setTab}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          view={view}
          onViewChange={setView}
          role={role}
          onRoleChange={setRoleState}
        />
        <main className="flex-1 overflow-y-auto p-5">
          {tab === "logistics" && <LogisticsMap view={view} />}
          {tab === "dispatch" && <SmartDispatch view={view} />}
          {tab === "index" && <CoreIndexInspector view={view} />}
          {tab === "database" && <DatabaseControl view={view} role={role} onRoleChange={setRoleState} />}
          {tab === "reports" && <SystemReports view={view} />}
        </main>
      </div>
    </div>
  );
}
