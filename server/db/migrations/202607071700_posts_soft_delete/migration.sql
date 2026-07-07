-- AlterTable
ALTER TABLE `posts`
    ADD COLUMN `deleted` TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN `deleted_at` DATETIME(3) NULL;
