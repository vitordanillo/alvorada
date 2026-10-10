-- Explicit backup reads for the private schema owner. Runtime policies and FORCE RLS stay enabled.
BEGIN;
CREATE POLICY maintenance_backup_owner ON alvorada."PlatformMaintenance"
FOR SELECT TO alvorada_app
USING (COALESCE(current_setting('app.platform_admin',true),'false')='true');
CREATE POLICY messages_backup_owner ON alvorada."PlatformMessage"
FOR SELECT TO alvorada_app
USING (COALESCE(current_setting('app.platform_admin',true),'false')='true');
COMMIT;
