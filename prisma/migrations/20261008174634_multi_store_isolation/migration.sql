BEGIN;
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_storeId_fkey";

-- DropForeignKey
ALTER TABLE "CashRegisterSession" DROP CONSTRAINT "CashRegisterSession_storeId_fkey";

-- DropForeignKey
ALTER TABLE "CashTransaction" DROP CONSTRAINT "CashTransaction_storeId_fkey";

-- DropForeignKey
ALTER TABLE "StockAdjustmentLog" DROP CONSTRAINT "StockAdjustmentLog_storeId_fkey";

-- DropForeignKey
ALTER TABLE "StockEntryLog" DROP CONSTRAINT "StockEntryLog_storeId_fkey";

-- DropForeignKey
ALTER TABLE "ProductChangeLog" DROP CONSTRAINT "ProductChangeLog_storeId_fkey";

-- DropForeignKey
ALTER TABLE "AccountsPayable" DROP CONSTRAINT "AccountsPayable_storeId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_storeId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_storeId_fkey";

-- DropIndex
DROP INDEX "Product_sku_key";

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Ativa';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN "storeId" TEXT;

-- AlterTable


-- AlterTable


-- AlterTable


-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "clientRequestId" TEXT,
ADD COLUMN     "storeSnapshot" JSONB;

-- AlterTable


-- AlterTable
ALTER TABLE "CashTransaction" ADD COLUMN     "storeSnapshot" JSONB;

-- AlterTable


-- AlterTable


-- AlterTable


-- AlterTable


-- AlterTable


-- AlterTable


-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreMembership" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreMembership_pkey" PRIMARY KEY ("userId","storeId")
);

-- CreateTable
CREATE TABLE "PlatformAuditLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "targetStoreId" TEXT,

    CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);


-- Preserve every existing store and record. Ambiguous orphan data stops the migration.
DO $migration$
DECLARE tenant text; tab text;
BEGIN
  IF (SELECT count(*) FROM "Store") = 1 THEN
    SELECT id INTO tenant FROM "Store" LIMIT 1;
    FOREACH tab IN ARRAY ARRAY['Product','Supplier','Customer','Sale','CashRegisterSession','CashTransaction','StockAdjustmentLog','StockEntryLog','ProductChangeLog','AccountsPayable','PurchaseOrder','AuditLog'] LOOP
      EXECUTE format('UPDATE %I SET "storeId"=$1 WHERE "storeId" IS NULL',tab) USING tenant;
    END LOOP;
    UPDATE "SystemConfig" SET "storeId"=tenant;
  ELSE
    UPDATE "SystemConfig" SET "storeId"=substring(key from 8) WHERE key LIKE 'config:%';
  END IF;
  IF EXISTS(SELECT 1 FROM "SystemConfig" WHERE "storeId" IS NULL) THEN RAISE EXCEPTION 'Configuration ownership is ambiguous'; END IF;
END $migration$;
UPDATE "Store" SET "organizationId"=gen_random_uuid()::text;
INSERT INTO "Organization"(id,name) SELECT "organizationId",name FROM "Store";
UPDATE "SystemConfig" SET key='products_counter:'||"storeId" WHERE key='products_counter';
INSERT INTO "SystemConfig"(key,value,"storeId")
SELECT 'products_counter:'||s.id,jsonb_build_object('lastSku',coalesce(max(CASE WHEN p.sku ~ '^[0-9]{1,9}$' THEN p.sku::integer END),0)),s.id
FROM "Store" s LEFT JOIN "Product" p ON p."storeId"=s.id GROUP BY s.id
ON CONFLICT(key) DO UPDATE SET value=jsonb_build_object('lastSku',greatest(coalesce(("SystemConfig".value->>'lastSku')::integer,0),(excluded.value->>'lastSku')::integer));
INSERT INTO "StoreMembership"("userId","storeId",role)
SELECT uid,"storeId",role FROM "User" WHERE "storeId" IS NOT NULL;
UPDATE "Sale" r SET "storeSnapshot"=jsonb_build_object('id',s.id,'name',s.name,'cnpj',coalesce(s.cnpj,''),'address',coalesce(s.address,''),'phone',coalesce(s.phone,'')) FROM "Store" s WHERE r."storeId"=s.id;
UPDATE "CashTransaction" r SET "storeSnapshot"=jsonb_build_object('id',s.id,'name',s.name,'cnpj',coalesce(s.cnpj,''),'address',coalesce(s.address,''),'phone',coalesce(s.phone,'')) FROM "Store" s WHERE r."storeId"=s.id;
ALTER TABLE "Store" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "SystemConfig" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "Sale" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "CashRegisterSession" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "CashTransaction" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "StockAdjustmentLog" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "StockEntryLog" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "ProductChangeLog" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "AccountsPayable" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "storeId" SET NOT NULL;
-- CreateIndex
CREATE INDEX "StoreMembership_storeId_role_idx" ON "StoreMembership"("storeId", "role");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_date_idx" ON "PlatformAuditLog"("date");

-- CreateIndex
CREATE INDEX "Store_organizationId_idx" ON "Store"("organizationId");

-- CreateIndex
CREATE INDEX "SystemConfig_storeId_idx" ON "SystemConfig"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_sku_key" ON "Product"("storeId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_id_key" ON "Product"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_storeId_id_key" ON "Supplier"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_storeId_id_key" ON "Customer"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_storeId_clientRequestId_key" ON "Sale"("storeId", "clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "CashRegisterSession_storeId_id_key" ON "CashRegisterSession"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_storeId_id_key" ON "PurchaseOrder"("storeId", "id");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashRegisterSession" ADD CONSTRAINT "CashRegisterSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustmentLog" ADD CONSTRAINT "StockAdjustmentLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntryLog" ADD CONSTRAINT "StockEntryLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductChangeLog" ADD CONSTRAINT "ProductChangeLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountsPayable" ADD CONSTRAINT "AccountsPayable_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_sessionId_tenant_fkey" FOREIGN KEY("storeId","sessionId") REFERENCES "CashRegisterSession"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "StockAdjustmentLog" ADD CONSTRAINT "StockAdjustmentLog_productId_tenant_fkey" FOREIGN KEY("storeId","productId") REFERENCES "Product"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "ProductChangeLog" ADD CONSTRAINT "ProductChangeLog_productId_tenant_fkey" FOREIGN KEY("storeId","productId") REFERENCES "Product"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "StockEntryLog" ADD CONSTRAINT "StockEntryLog_supplierId_tenant_fkey" FOREIGN KEY("storeId","supplierId") REFERENCES "Supplier"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "StockEntryLog" ADD CONSTRAINT "StockEntryLog_purchaseOrderId_tenant_fkey" FOREIGN KEY("storeId","purchaseOrderId") REFERENCES "PurchaseOrder"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "AccountsPayable" ADD CONSTRAINT "AccountsPayable_supplierId_tenant_fkey" FOREIGN KEY("storeId","supplierId") REFERENCES "Supplier"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "AccountsPayable" ADD CONSTRAINT "AccountsPayable_cashSessionId_tenant_fkey" FOREIGN KEY("storeId","cashSessionId") REFERENCES "CashRegisterSession"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_tenant_fkey" FOREIGN KEY("storeId","supplierId") REFERENCES "Supplier"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashRegisterSessionId_tenant_fkey" FOREIGN KEY("storeId","cashRegisterSessionId") REFERENCES "CashRegisterSession"("storeId",id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "Store" ADD CONSTRAINT "Store_status_check" CHECK(status IN ('Ativa','Suspensa'));
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_role_check" CHECK(role IN ('Administrador','Gerente','Operador de Caixa','Estoquista'));
-- Validate JSON product references and the legacy walk-in customer sentinel.
CREATE FUNCTION validate_tenant_references() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path FROM CURRENT AS $fn$
DECLARE item jsonb;
BEGIN
  IF TG_TABLE_NAME='Sale' THEN
    IF NEW."customerId"<>'default' AND NOT EXISTS(SELECT 1 FROM "Customer" WHERE id=NEW."customerId" AND "storeId"=NEW."storeId") THEN RAISE EXCEPTION 'Customer belongs to another store or does not exist'; END IF;
  END IF;
  IF TG_TABLE_NAME IN ('Sale','PurchaseOrder','StockEntryLog') THEN
    IF jsonb_typeof(NEW.items)<>'array' THEN RAISE EXCEPTION 'Items must be an array'; END IF;
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      IF NOT EXISTS(SELECT 1 FROM "Product" WHERE id=item->>'productId' AND "storeId"=NEW."storeId") THEN RAISE EXCEPTION 'Product belongs to another store or does not exist'; END IF;
    END LOOP;
  END IF;
  IF TG_TABLE_NAME='CashTransaction' AND NEW."customerId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "Customer" WHERE id=NEW."customerId" AND "storeId"=NEW."storeId") THEN RAISE EXCEPTION 'Customer belongs to another store or does not exist'; END IF;
  RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION validate_tenant_references() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION validate_tenant_references() TO alvorada_runtime;
CREATE TRIGGER sale_tenant_references BEFORE INSERT OR UPDATE OF items,"customerId","storeId" ON "Sale" FOR EACH ROW EXECUTE FUNCTION validate_tenant_references();
CREATE TRIGGER purchase_tenant_references BEFORE INSERT OR UPDATE OF items,"storeId" ON "PurchaseOrder" FOR EACH ROW EXECUTE FUNCTION validate_tenant_references();
CREATE TRIGGER stock_entry_tenant_references BEFORE INSERT OR UPDATE OF items,"storeId" ON "StockEntryLog" FOR EACH ROW EXECUTE FUNCTION validate_tenant_references();
CREATE TRIGGER cash_tenant_references BEFORE INSERT OR UPDATE OF "customerId","storeId" ON "CashTransaction" FOR EACH ROW EXECUTE FUNCTION validate_tenant_references();
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY; ALTER TABLE "Product" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Product" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="Product"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="Product"."storeId" AND s.status='Ativa'));
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY; ALTER TABLE "Supplier" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Supplier" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="Supplier"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="Supplier"."storeId" AND s.status='Ativa'));
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY; ALTER TABLE "Customer" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Customer" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="Customer"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="Customer"."storeId" AND s.status='Ativa'));
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY; ALTER TABLE "Sale" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "Sale" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="Sale"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="Sale"."storeId" AND s.status='Ativa'));
ALTER TABLE "CashRegisterSession" ENABLE ROW LEVEL SECURITY; ALTER TABLE "CashRegisterSession" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "CashRegisterSession" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="CashRegisterSession"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="CashRegisterSession"."storeId" AND s.status='Ativa'));
ALTER TABLE "CashTransaction" ENABLE ROW LEVEL SECURITY; ALTER TABLE "CashTransaction" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "CashTransaction" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="CashTransaction"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="CashTransaction"."storeId" AND s.status='Ativa'));
ALTER TABLE "StockAdjustmentLog" ENABLE ROW LEVEL SECURITY; ALTER TABLE "StockAdjustmentLog" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "StockAdjustmentLog" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="StockAdjustmentLog"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="StockAdjustmentLog"."storeId" AND s.status='Ativa'));
ALTER TABLE "StockEntryLog" ENABLE ROW LEVEL SECURITY; ALTER TABLE "StockEntryLog" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "StockEntryLog" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="StockEntryLog"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="StockEntryLog"."storeId" AND s.status='Ativa'));
ALTER TABLE "ProductChangeLog" ENABLE ROW LEVEL SECURITY; ALTER TABLE "ProductChangeLog" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "ProductChangeLog" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="ProductChangeLog"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="ProductChangeLog"."storeId" AND s.status='Ativa'));
ALTER TABLE "AccountsPayable" ENABLE ROW LEVEL SECURITY; ALTER TABLE "AccountsPayable" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "AccountsPayable" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="AccountsPayable"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="AccountsPayable"."storeId" AND s.status='Ativa'));
ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY; ALTER TABLE "PurchaseOrder" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "PurchaseOrder" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="PurchaseOrder"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="PurchaseOrder"."storeId" AND s.status='Ativa'));
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY; ALTER TABLE "AuditLog" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "AuditLog" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="AuditLog"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="AuditLog"."storeId" AND s.status='Ativa'));
ALTER TABLE "SystemConfig" ENABLE ROW LEVEL SECURITY; ALTER TABLE "SystemConfig" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "SystemConfig" FOR ALL TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="SystemConfig"."storeId" AND s.status='Ativa')) WITH CHECK ("storeId"=(select current_setting('app.store_id',true)) AND EXISTS(SELECT 1 FROM "Store" s WHERE s.id="SystemConfig"."storeId" AND s.status='Ativa'));
ALTER TABLE "StoreMembership" ENABLE ROW LEVEL SECURITY; ALTER TABLE "StoreMembership" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "membership_read" ON "StoreMembership" FOR SELECT TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR "userId"=(select current_setting('app.user_id',true)) OR "storeId"=(select current_setting('app.store_id',true)));
CREATE POLICY membership_insert ON "StoreMembership" FOR INSERT TO alvorada_runtime WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR ("storeId"=(select current_setting('app.store_id',true)) AND (select current_setting('app.store_role',true))='Administrador'));
CREATE POLICY membership_update ON "StoreMembership" FOR UPDATE TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR ("storeId"=(select current_setting('app.store_id',true)) AND (select current_setting('app.store_role',true))='Administrador')) WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR ("storeId"=(select current_setting('app.store_id',true)) AND (select current_setting('app.store_role',true))='Administrador'));
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY; ALTER TABLE "User" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "identity_read" ON "User" FOR SELECT TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR uid=(select current_setting('app.user_id',true)) OR email=(select current_setting('app.login_email',true)) OR EXISTS(SELECT 1 FROM "StoreMembership" m WHERE m."userId"=uid AND m."storeId"=(select current_setting('app.store_id',true))));
CREATE POLICY identity_insert ON "User" FOR INSERT TO alvorada_runtime WITH CHECK (NOT "isPlatformAdmin" AND (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR ("storeId"=(select current_setting('app.store_id',true)) AND (select current_setting('app.store_role',true))='Administrador')));
ALTER TABLE "Store" ENABLE ROW LEVEL SECURITY; ALTER TABLE "Store" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "store_read" ON "Store" FOR SELECT TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR id=(select current_setting('app.store_id',true)) OR EXISTS(SELECT 1 FROM "StoreMembership" m WHERE m."storeId"=id AND m."userId"=(select current_setting('app.user_id',true))));
CREATE POLICY store_insert ON "Store" FOR INSERT TO alvorada_runtime WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
CREATE POLICY store_update ON "Store" FOR UPDATE TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR (id=(select current_setting('app.store_id',true)) AND (select current_setting('app.store_role',true))='Administrador')) WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR (id=(select current_setting('app.store_id',true)) AND (select current_setting('app.store_role',true))='Administrador'));
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY; ALTER TABLE "Organization" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "organization_read" ON "Organization" FOR SELECT TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true' OR EXISTS(SELECT 1 FROM "Store" s JOIN "StoreMembership" m ON m."storeId"=s.id WHERE s."organizationId"="Organization".id AND m."userId"=(select current_setting('app.user_id',true))));
CREATE POLICY organization_insert ON "Organization" FOR INSERT TO alvorada_runtime WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
ALTER TABLE "PlatformAuditLog" ENABLE ROW LEVEL SECURITY; ALTER TABLE "PlatformAuditLog" NO FORCE ROW LEVEL SECURITY;
CREATE POLICY "platform_audit_read" ON "PlatformAuditLog" FOR SELECT TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
CREATE POLICY platform_audit_insert ON "PlatformAuditLog" FOR INSERT TO alvorada_runtime WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true' AND "actorId"=(select current_setting('app.user_id',true)));


GRANT SELECT,INSERT,UPDATE,DELETE ON "Product","Supplier","Customer","Sale","CashRegisterSession","CashTransaction","StockAdjustmentLog","StockEntryLog","ProductChangeLog","AccountsPayable","PurchaseOrder","AuditLog","SystemConfig" TO alvorada_runtime;
GRANT SELECT,INSERT,UPDATE ON "Store","StoreMembership" TO alvorada_runtime;
GRANT SELECT,INSERT ON "Organization","PlatformAuditLog" TO alvorada_runtime;
GRANT SELECT ON "User" TO alvorada_runtime;
GRANT INSERT(uid,name,email,"passwordHash",role,"avatarUrl","storeId","createdAt","updatedAt","isPlatformAdmin") ON "User" TO alvorada_runtime;

CREATE POLICY platform_config ON "SystemConfig" FOR ALL TO alvorada_runtime
USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true')
WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true');

COMMIT;

