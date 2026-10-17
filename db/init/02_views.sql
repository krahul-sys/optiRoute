-- =====================================================================
-- OptiRoute & CoreDB  ::  02 Views  (multi-table DML report layers)
-- =====================================================================
ALTER SESSION SET CONTAINER = XEPDB1;
ALTER SESSION SET CURRENT_SCHEMA = OPTIROUTE;
SET DEFINE OFF;

-- Multi-table JOIN compiling warehouse KPIs for the analytics dashboard.
CREATE OR REPLACE VIEW v_warehouse_summary AS
SELECT w.warehouse_id,
       w.name,
       w.capacity_kg,
       COUNT(DISTINCT r.route_id)          AS route_count,
       COUNT(DISTINCT p.package_id)        AS package_count,
       NVL(SUM(p.declared_value), 0)       AS total_declared_value
FROM warehouses w
LEFT JOIN transit_routes r ON r.source_id = w.warehouse_id
LEFT JOIN packages       p ON p.warehouse_id = w.warehouse_id
GROUP BY w.warehouse_id, w.name, w.capacity_kg;

-- Live shipment feed used by the Smart Dispatch screen.
CREATE OR REPLACE VIEW v_active_shipments AS
SELECT p.package_id,
       p.code,
       p.description,
       p.status,
       p.priority,
       p.weight_kg,
       p.declared_value,
       w.name AS warehouse_name
FROM packages p
LEFT JOIN warehouses w ON w.warehouse_id = p.warehouse_id
WHERE p.status IN ('PENDING', 'PROCESSING');

-- Route adjacency resolved to human-readable warehouse names (Dijkstra input).
CREATE OR REPLACE VIEW v_route_adjacency AS
SELECT r.route_id,
       r.source_id,
       ws.name AS source_name,
       r.dest_id,
       wd.name AS dest_name,
       r.distance_km
FROM transit_routes r
JOIN warehouses ws ON ws.warehouse_id = r.source_id
JOIN warehouses wd ON wd.warehouse_id = r.dest_id;

PROMPT [02_views] report views created.
