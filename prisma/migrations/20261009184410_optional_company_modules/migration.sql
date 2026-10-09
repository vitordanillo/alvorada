BEGIN;
-- CreateTable
CREATE TABLE "OrganizationModule" (
    "organizationId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "OrganizationModule_pkey" PRIMARY KEY ("organizationId","moduleKey")
);

-- CreateTable
CREATE TABLE "ServiceTable" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTab" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Aberta',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedBy" TEXT NOT NULL,
    "saleId" TEXT,

    CONSTRAINT "ServiceTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTabItem" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "costAtTimeOfUse" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,

    CONSTRAINT "ServiceTabItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupTicket" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemIndex" INTEGER NOT NULL,
    "unitIndex" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBy" TEXT,

    CONSTRAINT "PickupTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTable_storeId_id_key" ON "ServiceTable"("storeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTable_storeId_name_key" ON "ServiceTable"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTab_saleId_key" ON "ServiceTab"("saleId");

-- CreateIndex
CREATE INDEX "ServiceTab_storeId_status_openedAt_idx" ON "ServiceTab"("storeId", "status", "openedAt");

-- CreateIndex
CREATE INDEX "ServiceTab_storeId_tableId_idx" ON "ServiceTab"("storeId", "tableId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTab_storeId_id_key" ON "ServiceTab"("storeId", "id");

-- CreateIndex
CREATE INDEX "ServiceTabItem_storeId_tabId_idx" ON "ServiceTabItem"("storeId", "tabId");

-- CreateIndex
CREATE INDEX "ServiceTabItem_storeId_productId_idx" ON "ServiceTabItem"("storeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTabItem_storeId_requestId_key" ON "ServiceTabItem"("storeId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "PickupTicket_code_key" ON "PickupTicket"("code");

-- CreateIndex
CREATE INDEX "PickupTicket_storeId_status_issuedAt_idx" ON "PickupTicket"("storeId", "status", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PickupTicket_storeId_saleId_itemIndex_unitIndex_key" ON "PickupTicket"("storeId", "saleId", "itemIndex", "unitIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_storeId_id_key" ON "Sale"("storeId", "id");

-- AddForeignKey
ALTER TABLE "OrganizationModule" ADD CONSTRAINT "OrganizationModule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTab" ADD CONSTRAINT "ServiceTab_storeId_tableId_fkey" FOREIGN KEY ("storeId", "tableId") REFERENCES "ServiceTable"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTabItem" ADD CONSTRAINT "ServiceTabItem_storeId_tabId_fkey" FOREIGN KEY ("storeId", "tabId") REFERENCES "ServiceTab"("storeId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceTable" ADD CONSTRAINT "ServiceTable_store_fkey" FOREIGN KEY("storeId") REFERENCES "Store"(id) ON DELETE RESTRICT;
ALTER TABLE "ServiceTab" ADD CONSTRAINT "ServiceTab_sale_fkey" FOREIGN KEY("storeId","saleId") REFERENCES "Sale"("storeId",id) ON DELETE RESTRICT;
ALTER TABLE "ServiceTabItem" ADD CONSTRAINT "ServiceTabItem_product_fkey" FOREIGN KEY("storeId","productId") REFERENCES "Product"("storeId",id) ON DELETE RESTRICT;
ALTER TABLE "PickupTicket" ADD CONSTRAINT "PickupTicket_sale_fkey" FOREIGN KEY("storeId","saleId") REFERENCES "Sale"("storeId",id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX "ServiceTab_one_open_per_table" ON "ServiceTab"("storeId","tableId") WHERE status='Aberta';
CREATE INDEX "ServiceTab_storeId_saleId_idx" ON "ServiceTab"("storeId","saleId");
ALTER TABLE "OrganizationModule" ADD CONSTRAINT "OrganizationModule_known_key" CHECK("moduleKey" IN ('mesas_fichas'));
ALTER TABLE "ServiceTab" ADD CONSTRAINT "ServiceTab_status_check" CHECK(status IN ('Aberta','Fechada','Cancelada'));
ALTER TABLE "ServiceTab" ADD CONSTRAINT "ServiceTab_closed_sale_check" CHECK((status='Fechada')=("saleId" IS NOT NULL));
ALTER TABLE "ServiceTabItem" ADD CONSTRAINT "ServiceTabItem_values_check" CHECK(quantity>0 AND quantity<100000 AND price>=0 AND price<'Infinity'::double precision);
ALTER TABLE "PickupTicket" ADD CONSTRAINT "PickupTicket_status_check" CHECK(status IN ('Pendente','Retirada'));
ALTER TABLE "OrganizationModule" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "OrganizationModule" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON "OrganizationModule" TO alvorada_runtime;
CREATE POLICY module_read ON "OrganizationModule" FOR SELECT TO alvorada_runtime USING (
 (SELECT current_setting('app.platform_admin',true))='true' OR EXISTS(SELECT 1 FROM "Store" s WHERE s.id=(SELECT current_setting('app.store_id',true)) AND s."organizationId"="OrganizationModule"."organizationId" AND s.status='Ativa'));
CREATE POLICY module_insert ON "OrganizationModule" FOR INSERT TO alvorada_runtime WITH CHECK((SELECT current_setting('app.platform_admin',true))='true');
CREATE POLICY module_update ON "OrganizationModule" FOR UPDATE TO alvorada_runtime USING((SELECT current_setting('app.platform_admin',true))='true') WITH CHECK((SELECT current_setting('app.platform_admin',true))='true');
CREATE FUNCTION service_module_access(shop TEXT) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,alvorada AS $$
 SELECT shop=current_setting('app.store_id',true) AND current_setting('app.store_role',true) IN ('Administrador','Gerente','Operador de Caixa') AND EXISTS(SELECT 1 FROM alvorada."Store" s JOIN alvorada."OrganizationModule" m ON m."organizationId"=s."organizationId" WHERE s.id=shop AND s.status='Ativa' AND m."moduleKey"='mesas_fichas' AND m.enabled)
$$;
REVOKE ALL ON FUNCTION service_module_access(TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION service_module_access(TEXT) TO alvorada_runtime;
ALTER TABLE "ServiceTable" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ServiceTable" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON "ServiceTable" TO alvorada_runtime;
CREATE POLICY service_access ON "ServiceTable" FOR ALL TO alvorada_runtime USING("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true)))) WITH CHECK("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true))));
ALTER TABLE "ServiceTab" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ServiceTab" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON "ServiceTab" TO alvorada_runtime;
CREATE POLICY service_read ON "ServiceTab" FOR SELECT TO alvorada_runtime USING ("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true))) OR (SELECT current_setting('app.platform_admin',true))='true');
CREATE POLICY service_insert ON "ServiceTab" FOR INSERT TO alvorada_runtime WITH CHECK("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true))));
CREATE POLICY service_update ON "ServiceTab" FOR UPDATE TO alvorada_runtime USING("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true)))) WITH CHECK("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true))));
ALTER TABLE "ServiceTabItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ServiceTabItem" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON "ServiceTabItem" TO alvorada_runtime;
CREATE POLICY service_access ON "ServiceTabItem" FOR ALL TO alvorada_runtime USING("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true)))) WITH CHECK("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true))));
ALTER TABLE "PickupTicket" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "PickupTicket" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON "PickupTicket" TO alvorada_runtime;
CREATE POLICY service_access ON "PickupTicket" FOR ALL TO alvorada_runtime USING("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true)))) WITH CHECK("storeId"=(SELECT current_setting('app.store_id',true)) AND (SELECT alvorada.service_module_access(current_setting('app.store_id',true))));

CREATE FUNCTION guard_service_module_disable() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,alvorada AS $$
 BEGIN
 IF OLD.enabled AND NOT NEW.enabled AND EXISTS(SELECT 1 FROM alvorada."ServiceTab" t JOIN alvorada."Store" s ON s.id=t."storeId" WHERE s."organizationId"=NEW."organizationId" AND t.status='Aberta') THEN
 RAISE EXCEPTION 'Feche ou cancele as mesas abertas antes de bloquear o modulo' USING ERRCODE='23514';
 END IF; RETURN NEW;
 END;$$;
REVOKE ALL ON FUNCTION guard_service_module_disable() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_module_disable BEFORE UPDATE ON "OrganizationModule" FOR EACH ROW EXECUTE FUNCTION guard_service_module_disable();
COMMIT;
