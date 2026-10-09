BEGIN;
CREATE TABLE "OfflineReceipt" (
 "id" TEXT PRIMARY KEY, "storeId" TEXT NOT NULL REFERENCES "Store"(id) ON DELETE RESTRICT,
 "userId" TEXT NOT NULL REFERENCES "User"(uid) ON DELETE RESTRICT, "kind" TEXT NOT NULL,
 "inputHash" TEXT NOT NULL, "result" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "OfflineReceipt_storeId_userId_createdAt_idx" ON "OfflineReceipt"("storeId","userId","createdAt");
ALTER TABLE "OfflineReceipt" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "OfflineReceipt" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON "OfflineReceipt" TO alvorada_runtime;
CREATE POLICY offline_receipt_access ON "OfflineReceipt" FOR ALL TO alvorada_runtime
 USING ("storeId"=(SELECT current_setting('app.store_id',true)) AND "userId"=(SELECT current_setting('app.user_id',true)))
 WITH CHECK ("storeId"=(SELECT current_setting('app.store_id',true)) AND "userId"=(SELECT current_setting('app.user_id',true)));
COMMIT;
