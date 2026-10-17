-- =====================================================================
-- OptiRoute & CoreDB  ::  05 Seed  (demo dataset)
-- Identity columns are left to generate their own keys; foreign keys are
-- resolved by name so the sequence stays consistent for later app inserts.
-- =====================================================================
ALTER SESSION SET CONTAINER = XEPDB1;
ALTER SESSION SET CURRENT_SCHEMA = OPTIROUTE;
SET DEFINE OFF;

INSERT INTO warehouses (name, x_coord, y_coord, capacity_kg) VALUES ('North Hub',    120,  60, 5000);
INSERT INTO warehouses (name, x_coord, y_coord, capacity_kg) VALUES ('East Depot',   420, 140, 3500);
INSERT INTO warehouses (name, x_coord, y_coord, capacity_kg) VALUES ('South Yard',   260, 380, 4200);
INSERT INTO warehouses (name, x_coord, y_coord, capacity_kg) VALUES ('West Dock',     70, 300, 2800);
INSERT INTO warehouses (name, x_coord, y_coord, capacity_kg) VALUES ('Central Port', 250, 210, 6000);

INSERT INTO transit_routes (source_id, dest_id, distance_km)
  SELECT s.warehouse_id, d.warehouse_id, 34.5 FROM warehouses s, warehouses d
   WHERE s.name = 'North Hub' AND d.name = 'East Depot';
INSERT INTO transit_routes (source_id, dest_id, distance_km)
  SELECT s.warehouse_id, d.warehouse_id, 28.0 FROM warehouses s, warehouses d
   WHERE s.name = 'North Hub' AND d.name = 'West Dock';
INSERT INTO transit_routes (source_id, dest_id, distance_km)
  SELECT s.warehouse_id, d.warehouse_id, 41.2 FROM warehouses s, warehouses d
   WHERE s.name = 'East Depot' AND d.name = 'Central Port';
INSERT INTO transit_routes (source_id, dest_id, distance_km)
  SELECT s.warehouse_id, d.warehouse_id, 25.7 FROM warehouses s, warehouses d
   WHERE s.name = 'West Dock' AND d.name = 'Central Port';
INSERT INTO transit_routes (source_id, dest_id, distance_km)
  SELECT s.warehouse_id, d.warehouse_id, 30.9 FROM warehouses s, warehouses d
   WHERE s.name = 'Central Port' AND d.name = 'South Yard';
INSERT INTO transit_routes (source_id, dest_id, distance_km)
  SELECT s.warehouse_id, d.warehouse_id, 22.3 FROM warehouses s, warehouses d
   WHERE s.name = 'East Depot' AND d.name = 'South Yard';
INSERT INTO transit_routes (source_id, dest_id, distance_km)
  SELECT s.warehouse_id, d.warehouse_id, 19.8 FROM warehouses s, warehouses d
   WHERE s.name = 'North Hub' AND d.name = 'Central Port';
INSERT INTO transit_routes (source_id, dest_id, distance_km)
  SELECT s.warehouse_id, d.warehouse_id, 36.1 FROM warehouses s, warehouses d
   WHERE s.name = 'West Dock' AND d.name = 'South Yard';

INSERT INTO packages (code, description, weight_kg, declared_value, priority, status, warehouse_id)
  SELECT 'PKG-1001', 'Industrial bearings', 120,  4800, 5, 'PENDING',    warehouse_id FROM warehouses WHERE name = 'North Hub';
INSERT INTO packages (code, description, weight_kg, declared_value, priority, status, warehouse_id)
  SELECT 'PKG-1002', 'Server rack modules',  180,  9200, 4, 'PENDING',    warehouse_id FROM warehouses WHERE name = 'East Depot';
INSERT INTO packages (code, description, weight_kg, declared_value, priority, status, warehouse_id)
  SELECT 'PKG-1003', 'Cold-chain vaccines',   40, 12000, 5, 'PROCESSING', warehouse_id FROM warehouses WHERE name = 'Central Port';
INSERT INTO packages (code, description, weight_kg, declared_value, priority, status, warehouse_id)
  SELECT 'PKG-1004', 'Consumer electronics', 210,  6400, 3, 'PENDING',    warehouse_id FROM warehouses WHERE name = 'South Yard';
INSERT INTO packages (code, description, weight_kg, declared_value, priority, status, warehouse_id)
  SELECT 'PKG-1005', 'Paper supplies',         90,   800, 1, 'PENDING',    warehouse_id FROM warehouses WHERE name = 'West Dock';
INSERT INTO packages (code, description, weight_kg, declared_value, priority, status, warehouse_id)
  SELECT 'PKG-1006', 'Automotive spares',    160,  7300, 4, 'PENDING',    warehouse_id FROM warehouses WHERE name = 'North Hub';
INSERT INTO packages (code, description, weight_kg, declared_value, priority, status, warehouse_id)
  SELECT 'PKG-1007', 'Medical instruments',   70, 15500, 5, 'PENDING',    warehouse_id FROM warehouses WHERE name = 'Central Port';
INSERT INTO packages (code, description, weight_kg, declared_value, priority, status, warehouse_id)
  SELECT 'PKG-1008', 'Office furniture',     320,  3100, 2, 'PENDING',    warehouse_id FROM warehouses WHERE name = 'South Yard';

COMMIT;

PROMPT [05_seed] demo dataset loaded.
