

CREATE POLICY identity_profile_update ON "User" FOR UPDATE TO alvorada_runtime
USING (uid=(SELECT current_setting('app.user_id',true)) AND (SELECT current_setting('app.profile_write',true))='true')
WITH CHECK (uid=(SELECT current_setting('app.user_id',true)) AND (SELECT current_setting('app.profile_write',true))='true');
GRANT UPDATE (name,"avatarUrl") ON "User" TO alvorada_runtime;

CREATE FUNCTION guard_profile_update() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  IF current_setting('app.profile_write',true)='true' THEN
    IF OLD.uid IS DISTINCT FROM current_setting('app.user_id',true)
       OR (to_jsonb(NEW)-ARRAY['name','avatarUrl','passwordHash','sessionVersion','updatedAt'])
          IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['name','avatarUrl','passwordHash','sessionVersion','updatedAt']) THEN
      RAISE EXCEPTION 'Profile cannot change protected account fields' USING ERRCODE='42501';
    END IF;
    IF NEW."sessionVersion" NOT IN (OLD."sessionVersion",OLD."sessionVersion"+1)
       OR (NEW."passwordHash" IS DISTINCT FROM OLD."passwordHash" AND NEW."sessionVersion"<>OLD."sessionVersion"+1) THEN
      RAISE EXCEPTION 'Invalid profile session version' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION guard_profile_update() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_profile_update BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION guard_profile_update();

CREATE POLICY profile_audit_insert ON "PlatformAuditLog" FOR INSERT TO alvorada_runtime
WITH CHECK ((SELECT current_setting('app.profile_write',true))='true'
 AND "actorId"=(SELECT current_setting('app.user_id',true))
 AND action IN ('Atualizar perfil','Alterar própria senha','Encerrar outras sessões')
 AND "targetStoreId" IS NULL);
