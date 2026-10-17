import type {
  EngineResult,
  Health,
  Package,
  Role,
  Route,
  Warehouse,
} from "./types";

const BASE = "/api";

let activeRole: Role = "ADMIN";
export function setRole(role: Role) {
  activeRole = role;
}
export function getRole(): Role {
  return activeRole;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-Role": activeRole,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = data?.detail ?? res.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

export const api = {
  // system
  health: () => request<Health>("/health"),

  // graph / logistics
  graphSummary: () => request<{ warehouses: Warehouse[]; routes: Route[] }>("/graph/summary"),
  createWarehouse: (b: Partial<Warehouse>) => post<{ warehouse_id: number }>("/graph/warehouses", b),
  createRoute: (b: Partial<Route>) => post<{ route_id: number }>("/graph/routes", b),
  deleteWarehouse: (id: number) => del<{ deleted: number }>(`/graph/warehouses/${id}`),
  optimizeRoute: (source_id: number, target_id: number) =>
    post<EngineResult>("/graph/optimize", { source_id, target_id }),
  mst: () => post<EngineResult>("/graph/mst"),

  // packages / dispatch
  packages: () => request<Package[]>("/packages"),
  createPackage: (b: Partial<Package>) => post<{ package_id: number }>("/packages", b),
  updateStatus: (id: number, status: string) =>
    patch<{ status: string }>(`/packages/${id}/status`, { status }),
  buildHeap: () => post<EngineResult>("/packages/heap"),
  optimizeLoading: (capacity: number) =>
    post<EngineResult>(`/packages/optimize?capacity=${capacity}`),

  // indexing / avl
  indexEntries: () => request<{ count: number; entries: Package[] }>("/index/entries"),
  buildAvl: () => post<EngineResult>("/index/avl"),

  // admin / dcl-tcl
  roles: () => request<{ roles: any[]; grants: string[] }>("/admin/roles"),
  logs: (limit = 30) => request<{ count: number; logs: any[] }>(`/admin/logs?limit=${limit}`),
  tclSandbox: () => post<{ outcome: string; steps: string[]; error?: string }>("/admin/tcl-sandbox"),

  // reports
  sortRows: (algorithm: string) => post<EngineResult>("/reports/sort", { algorithm }),
  huffman: (text: string) => post<EngineResult>("/reports/huffman", { text }),
  reportSummary: () => request<{ rows: any[]; view: string }>("/reports/summary"),
};
