CREATE POLICY profile_audit_read ON "PlatformAuditLog" FOR SELECT TO alvorada_runtime
USING ((SELECT current_setting('app.profile_write',true))='true'
 AND "actorId"=(SELECT current_setting('app.user_id',true))
 AND action IN ('Atualizar perfil','Alterar própria senha','Encerrar outras sessões')
 AND "targetStoreId" IS NULL);
