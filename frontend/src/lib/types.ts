export type Role = "ADMIN" | "DRIVER" | "VIEWER";

export interface Warehouse {
  warehouse_id: number;
  name: string;
  x_coord: number;
  y_coord: number;
  capacity_kg: number;
}

export interface Route {
  route_id: number;
  source_id: number;
  dest_id: number;
  distance_km: number;
}

export interface Package {
  package_id: number;
  code: string;
  description: string | null;
  weight_kg: number;
  declared_value: number;
  priority: number;
  status: string;
  warehouse_id: number | null;
}

export interface EngineResult {
  algo: string;
  executionMs: number;
  sql?: string;
  complexity?: string;
  [key: string]: unknown;
}

export interface Health {
  database: { dsn: string; open: number; busy: number; healthy: boolean };
  engine: { binary: string; latencyMs: number };
  status: string;
}
