-- CreateTable
CREATE TABLE `User` (
    `uid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemConfig` (
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `averageCost` DOUBLE NOT NULL,
    `costHistory` JSON NOT NULL,
    `stock` DOUBLE NOT NULL,
    `minStock` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `supplier` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Supplier` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contactName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `creditLimit` DOUBLE NOT NULL,
    `balance` DOUBLE NOT NULL,
    `notes` TEXT NULL,
    `tags` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sale` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `items` JSON NOT NULL,
    `total` DOUBLE NOT NULL,
    `totalCost` DOUBLE NULL,
    `totalProfit` DOUBLE NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `paymentMethods` JSON NOT NULL,
    `cashRegisterSessionId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `cancellationReason` TEXT NULL,
    `cancelledByUid` VARCHAR(191) NULL,
    `cancelledByName` VARCHAR(191) NULL,
    `cancellationDate` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashRegisterSession` (
    `id` VARCHAR(191) NOT NULL,
    `openingTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closingTime` DATETIME(3) NULL,
    `openingBalance` DOUBLE NOT NULL,
    `closingBalance` DOUBLE NULL,
    `calculatedCashInDrawer` DOUBLE NOT NULL,
    `totalSales` DOUBLE NOT NULL,
    `salesByPaymentMethod` JSON NOT NULL,
    `totalExpenses` DOUBLE NOT NULL,
    `totalWithdrawals` DOUBLE NOT NULL,
    `totalCreditPayments` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `openedByUid` VARCHAR(191) NOT NULL,
    `openedByName` VARCHAR(191) NOT NULL,
    `closedByUid` VARCHAR(191) NULL,
    `closedByName` VARCHAR(191) NULL,
    `correction` JSON NULL,
    `openingCorrection` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registeredByUid` VARCHAR(191) NOT NULL,
    `registeredByName` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockAdjustmentLog` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `adjustedByUid` VARCHAR(191) NOT NULL,
    `adjustedByName` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `oldQuantity` DOUBLE NOT NULL,
    `newQuantity` DOUBLE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockEntryLog` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `supplierId` VARCHAR(191) NOT NULL,
    `supplierName` VARCHAR(191) NOT NULL,
    `items` JSON NOT NULL,
    `totalCost` DOUBLE NOT NULL,
    `totalItems` DOUBLE NOT NULL,
    `registeredByUid` VARCHAR(191) NOT NULL,
    `registeredByName` VARCHAR(191) NOT NULL,
    `purchaseOrderId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductChangeLog` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `productId` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `changedByUid` VARCHAR(191) NOT NULL,
    `changedByName` VARCHAR(191) NOT NULL,
    `changes` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountsPayable` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NOT NULL,
    `paymentDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NULL,
    `supplierName` VARCHAR(191) NULL,
    `registeredByUid` VARCHAR(191) NOT NULL,
    `registeredByName` VARCHAR(191) NOT NULL,
    `cashSessionId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrder` (
    `id` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `supplierName` VARCHAR(191) NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateExpected` DATETIME(3) NOT NULL,
    `dateReceived` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL,
    `items` JSON NOT NULL,
    `totalCost` DOUBLE NOT NULL,
    `registeredByUid` VARCHAR(191) NOT NULL,
    `registeredByName` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
