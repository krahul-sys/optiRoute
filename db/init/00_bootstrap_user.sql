-- =====================================================================
-- OptiRoute & CoreDB  ::  00 Bootstrap  (application schema owner)
-- The container runs these scripts as SYS *before* any app user exists,
-- so we create the OPTIROUTE owner here, then grant it the privileges it
-- needs. Subsequent scripts switch into this schema via CURRENT_SCHEMA.
-- =====================================================================
SET DEFINE OFF;
SET SERVEROUTPUT ON;

-- Init scripts execute in the CDB root; switch into the application PDB.
ALTER SESSION SET CONTAINER = XEPDB1;

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM all_users WHERE username = 'OPTIROUTE';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE USER OPTIROUTE IDENTIFIED BY "optiroute"';
    DBMS_OUTPUT.PUT_LINE('[00_bootstrap] created user OPTIROUTE');
  ELSE
    DBMS_OUTPUT.PUT_LINE('[00_bootstrap] user OPTIROUTE already present');
  END IF;
END;
/

GRANT CONNECT, RESOURCE TO OPTIROUTE;
GRANT CREATE TABLE, CREATE VIEW, CREATE TRIGGER, CREATE PROCEDURE, CREATE SEQUENCE TO OPTIROUTE;
GRANT UNLIMITED TABLESPACE TO OPTIROUTE;

PROMPT [00_bootstrap] application schema owner ready.
