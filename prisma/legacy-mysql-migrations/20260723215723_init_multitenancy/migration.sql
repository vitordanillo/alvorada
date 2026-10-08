-- AlterTable
ALTER TABLE `accountspayable` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `cashregistersession` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `cashtransaction` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `loyaltyPoints` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `productchangelog` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `purchaseorder` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sale` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `stockadjustmentlog` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `stockentrylog` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `storeId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Store` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` VARCHAR(191) NOT NULL,
    `details` TEXT NOT NULL,
    `userUid` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashRegisterSession` ADD CONSTRAINT `CashRegisterSession_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashTransaction` ADD CONSTRAINT `CashTransaction_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAdjustmentLog` ADD CONSTRAINT `StockAdjustmentLog_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockEntryLog` ADD CONSTRAINT `StockEntryLog_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductChangeLog` ADD CONSTRAINT `ProductChangeLog_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountsPayable` ADD CONSTRAINT `AccountsPayable_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrder` ADD CONSTRAINT `PurchaseOrder_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
