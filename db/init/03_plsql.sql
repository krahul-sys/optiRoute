-- =====================================================================
-- OptiRoute & CoreDB  ::  03 PL/SQL  (triggers + stored procedures)
-- =====================================================================
ALTER SESSION SET CONTAINER = XEPDB1;
ALTER SESSION SET CURRENT_SCHEMA = OPTIROUTE;
SET DEFINE OFF;
SET SERVEROUTPUT ON;

-- ---------------------------------------------------------------------
-- Trigger: audit every package status transition into a CLOB payload.
-- Feeds the "PL/SQL Trigger Tracker" panel on the Database Control tab.
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_package_status_audit
AFTER UPDATE OF status ON packages
FOR EACH ROW
WHEN (OLD.status <> NEW.status)
DECLARE
  v_payload CLOB;
BEGIN
  v_payload := 'Package ' || :NEW.code ||
               ' status changed from ' || :OLD.status ||
               ' to ' || :NEW.status ||
               ' at ' || TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.FF3');
  INSERT INTO operational_logs (package_id, action, payload)
  VALUES (:NEW.package_id, 'STATUS_CHANGE', v_payload);
END;
/

-- ---------------------------------------------------------------------
-- Trigger: stamp new packages with an audit line on insert.
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_package_insert_audit
AFTER INSERT ON packages
FOR EACH ROW
DECLARE
  v_payload CLOB;
BEGIN
  v_payload := 'Package ' || :NEW.code || ' registered with priority ' ||
               :NEW.priority || ' and value ' || :NEW.declared_value;
  INSERT INTO operational_logs (package_id, action, payload)
  VALUES (:NEW.package_id, 'PACKAGE_CREATED', v_payload);
END;
/

-- ---------------------------------------------------------------------
-- Stored procedure: atomically mark a batch of packages as dispatched.
-- Used by the TCL sandbox; raises on missing rows so the caller can ROLLBACK.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_dispatch_package (
  p_package_id IN  NUMBER,
  p_affected   OUT NUMBER
) AS
BEGIN
  UPDATE packages
     SET status = 'DISPATCHED'
   WHERE package_id = p_package_id;

  p_affected := SQL%ROWCOUNT;

  IF p_affected = 0 THEN
    RAISE_APPLICATION_ERROR(-20001,
      'Dispatch aborted: package ' || p_package_id || ' does not exist');
  END IF;
END sp_dispatch_package;
/

PROMPT [03_plsql] triggers and stored procedures compiled.
