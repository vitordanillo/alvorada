-- AlterTable
ALTER TABLE "User" ADD COLUMN     "disabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "maxUsers" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDue" TIMESTAMP(3) NOT NULL,
    "billingDay" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_storeId_key" ON "Subscription"("storeId");

-- CreateIndex
CREATE INDEX "Subscription_status_nextDue_idx" ON "Subscription"("status", "nextDue");

-- CreateIndex
CREATE INDEX "Invoice_status_dueDate_idx" ON "Invoice"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_subscriptionId_dueDate_key" ON "Invoice"("subscriptionId", "dueDate");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Plan" ADD CONSTRAINT plan_values CHECK ("priceCents">=0 AND "maxUsers">=1);
ALTER TABLE "Subscription" ADD CONSTRAINT subscription_values CHECK ("priceCents">=0 AND "maxUsers">=1 AND "billingDay" BETWEEN 1 AND 31 AND status IN ('Ativa','Pausada','Cancelada'));
ALTER TABLE "Invoice" ADD CONSTRAINT invoice_values CHECK ("amountCents">=0 AND status IN ('Pendente','Pago','Cancelada') AND ((status='Pago' AND "paidAt" IS NOT NULL AND "paymentMethod" IS NOT NULL) OR (status<>'Pago' AND "paidAt" IS NULL)));
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "Plan","Subscription","Invoice" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON "Plan","Subscription","Invoice" TO alvorada_runtime;
CREATE POLICY platform_only ON "Plan" FOR ALL TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true') WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
CREATE POLICY platform_only ON "Subscription" FOR ALL TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true') WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
CREATE POLICY subscription_store_read ON "Subscription" FOR SELECT TO alvorada_runtime USING ("storeId"=(select current_setting('app.store_id',true)));
CREATE POLICY platform_only ON "Invoice" FOR ALL TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true') WITH CHECK (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
GRANT UPDATE("disabled","sessionVersion","passwordHash","updatedAt") ON "User" TO alvorada_runtime;
GRANT INSERT("disabled","sessionVersion") ON "User" TO alvorada_runtime;
CREATE POLICY platform_user_update ON "User" FOR UPDATE TO alvorada_runtime USING (NOT "isPlatformAdmin" AND coalesce((select current_setting('app.platform_admin',true)),'false')='true') WITH CHECK (NOT "isPlatformAdmin" AND coalesce((select current_setting('app.platform_admin',true)),'false')='true');
GRANT DELETE ON "StoreMembership" TO alvorada_runtime;
CREATE POLICY platform_membership_delete ON "StoreMembership" FOR DELETE TO alvorada_runtime USING (coalesce((select current_setting('app.platform_admin',true)),'false')='true');
