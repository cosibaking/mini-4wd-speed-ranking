ALTER TABLE `comments` ADD COLUMN `parent_id` CHAR(36) NULL AFTER `post_id`;

CREATE INDEX `idx_comments_parent` ON `comments`(`parent_id`);

ALTER TABLE `comments` ADD CONSTRAINT `comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
