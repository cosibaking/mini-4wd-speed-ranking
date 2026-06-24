CREATE TABLE `comment_images` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `comment_id` CHAR(36) NOT NULL,
    `image_url` VARCHAR(512) NOT NULL,
    `sort_order` TINYINT NOT NULL DEFAULT 0,

    INDEX `idx_ci_comment`(`comment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `comment_images` ADD CONSTRAINT `comment_images_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
