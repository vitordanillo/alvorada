ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
GRANT UPDATE("mustChangePassword") ON "User" TO alvorada_runtime;
ALTER TABLE "CashRegisterSession" ADD COLUMN "closingByPaymentMethod" JSONB;
CREATE TABLE "InvoiceAttachment" (id TEXT PRIMARY KEY,"invoiceId" TEXT NOT NULL REFERENCES "Invoice"(id) ON DELETE RESTRICT,"filename" TEXT NOT NULL,"mimeType" TEXT NOT NULL,size INTEGER NOT NULL CHECK(size BETWEEN 1 AND 5000000),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"uploadedBy" TEXT NOT NULL);
CREATE INDEX "InvoiceAttachment_invoiceId_idx" ON "InvoiceAttachment"("invoiceId");
ALTER TABLE "InvoiceAttachment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "InvoiceAttachment" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON "InvoiceAttachment" TO alvorada_runtime;
CREATE POLICY platform_only ON "InvoiceAttachment" FOR ALL TO alvorada_runtime USING ((SELECT current_setting('app.platform_admin',true))='true') WITH CHECK ((SELECT current_setting('app.platform_admin',true))='true');
CREATE INDEX "PlatformAuditLog_targetStoreId_date_idx" ON "PlatformAuditLog"("targetStoreId",date DESC);
CREATE INDEX "CashTransaction_storeId_customerId_date_idx" ON "CashTransaction"("storeId","customerId",date);
CREATE OR REPLACE FUNCTION guard_profile_update() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF current_setting('app.profile_write',true)='true' THEN
  IF OLD.uid IS DISTINCT FROM current_setting('app.user_id',true) OR (to_jsonb(NEW)-ARRAY['name','avatarUrl','passwordHash','sessionVersion','updatedAt','mustChangePassword']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['name','avatarUrl','passwordHash','sessionVersion','updatedAt','mustChangePassword']) THEN RAISE EXCEPTION 'Profile cannot change protected account fields' USING ERRCODE='42501';END IF;
  IF NEW."sessionVersion" NOT IN (OLD."sessionVersion",OLD."sessionVersion"+1) OR (NEW."passwordHash" IS DISTINCT FROM OLD."passwordHash" AND NEW."sessionVersion"<>OLD."sessionVersion"+1) OR (NEW."mustChangePassword" IS DISTINCT FROM OLD."mustChangePassword" AND (NEW."mustChangePassword" OR NEW."passwordHash" IS NOT DISTINCT FROM OLD."passwordHash")) THEN RAISE EXCEPTION 'Invalid profile session version' USING ERRCODE='42501';END IF;
 END IF;RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION guard_profile_update() FROM PUBLIC,anon,authenticated;
