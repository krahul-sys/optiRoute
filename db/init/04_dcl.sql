-- =====================================================================
-- OptiRoute & CoreDB  ::  04 DCL  (roles & privileges)
-- The middleware enforces these roles at the HTTP gate (X-User-Role);
-- Oracle enforces them at the object level for direct connections.
-- =====================================================================
SET DEFINE OFF;

-- Init scripts execute in the CDB root; switch into the application PDB.
ALTER SESSION SET CONTAINER = XEPDB1;

-- ------------------------------------------------------------- driver_role
BEGIN
  EXECUTE IMMEDIATE 'DROP ROLE driver_role';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
CREATE ROLE driver_role;
GRANT CREATE SESSION     TO driver_role;
GRANT SELECT ON OPTIROUTE.warehouses      TO driver_role;
GRANT SELECT ON OPTIROUTE.transit_routes  TO driver_role;
GRANT SELECT ON OPTIROUTE.v_active_shipments TO driver_role;
GRANT SELECT, UPDATE ON OPTIROUTE.packages TO driver_role;

-- -------------------------------------------------------------- admin_role
BEGIN
  EXECUTE IMMEDIATE 'DROP ROLE admin_role';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
CREATE ROLE admin_role;
GRANT CREATE SESSION TO admin_role;
GRANT ALL ON OPTIROUTE.warehouses       TO admin_role;
GRANT ALL ON OPTIROUTE.transit_routes   TO admin_role;
GRANT ALL ON OPTIROUTE.packages         TO admin_role;
GRANT ALL ON OPTIROUTE.operational_logs TO admin_role;
GRANT SELECT ON OPTIROUTE.v_warehouse_summary TO admin_role;
GRANT SELECT ON OPTIROUTE.v_route_adjacency   TO admin_role;

-- Grant the middleware's application account both roles.
GRANT driver_role TO OPTIROUTE;
GRANT admin_role  TO OPTIROUTE;

PROMPT [04_dcl] roles and privileges configured.
