BEGIN;
CREATE TABLE "PlatformMaintenance" (
 "id" TEXT PRIMARY KEY DEFAULT 'global', "enabled" BOOLEAN NOT NULL DEFAULT false,
 "message" TEXT NOT NULL DEFAULT 'Estamos realizando melhorias. Aguarde a liberação do sistema.',
 "expectedReturn" TIMESTAMP(3), "revision" INTEGER NOT NULL DEFAULT 0,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PlatformMaintenance_singleton" CHECK ("id"='global')
);
CREATE TABLE "PlatformMessage" (
 "id" TEXT PRIMARY KEY, "kind" TEXT NOT NULL, "title" VARCHAR(120) NOT NULL,
 "body" TEXT NOT NULL, "version" VARCHAR(40) NOT NULL DEFAULT '',
 "publishedAt" TIMESTAMP(3), "archived" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PlatformMessage_kind" CHECK ("kind" IN ('notice','patchnotes'))
);
CREATE INDEX "PlatformMessage_publishedAt_idx" ON "PlatformMessage"("publishedAt");
INSERT INTO "PlatformMaintenance" ("id") VALUES ('global');
ALTER TABLE "PlatformMaintenance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformMaintenance" FORCE ROW LEVEL SECURITY;
ALTER TABLE "PlatformMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformMessage" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON "PlatformMaintenance","PlatformMessage" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON "PlatformMaintenance","PlatformMessage" TO alvorada_runtime;
CREATE POLICY maintenance_read ON "PlatformMaintenance" FOR SELECT TO alvorada_runtime USING (true);
CREATE POLICY maintenance_admin ON "PlatformMaintenance" FOR ALL TO alvorada_runtime
 USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true')
 WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
CREATE POLICY messages_published ON "PlatformMessage" FOR SELECT TO alvorada_runtime
 USING ("publishedAt" IS NOT NULL AND NOT "archived" AND coalesce((select current_setting('app.user_id',true)),'')<>'');
CREATE POLICY messages_admin ON "PlatformMessage" FOR ALL TO alvorada_runtime
 USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true')
 WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
COMMIT;
