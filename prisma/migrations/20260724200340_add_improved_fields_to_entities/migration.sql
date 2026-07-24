-- AlterTable
ALTER TABLE `accountspayable` ADD COLUMN `category` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `birthDate` DATETIME(3) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `cpfCnpj` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `zipCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `brand` VARCHAR(191) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `expiryDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `cnpj` VARCHAR(191) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `tradeName` VARCHAR(191) NULL,
    ADD COLUMN `zipCode` VARCHAR(191) NULL;
