-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `open_id` VARCHAR(64) NOT NULL,
    `union_id` VARCHAR(64) NULL,
    `nick_name` VARCHAR(64) NOT NULL DEFAULT '',
    `avatar_url` VARCHAR(512) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_open_id_key`(`open_id`),
    INDEX `idx_users_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracks` (
    `id` CHAR(36) NOT NULL,
    `creator_id` CHAR(36) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `lat` DECIMAL(10, 7) NOT NULL,
    `lng` DECIMAL(10, 7) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `organizer_name` VARCHAR(64) NOT NULL,
    `organizer_contact` VARCHAR(128) NULL,
    `length_meters` INTEGER UNSIGNED NULL,
    `example_video_url` VARCHAR(512) NULL,
    `rule_note` VARCHAR(500) NULL,
    `record_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_tracks_geo`(`lat`, `lng`),
    INDEX `idx_tracks_created`(`created_at`),
    UNIQUE INDEX `uk_creator_name`(`creator_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `track_floor_plans` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `track_id` CHAR(36) NOT NULL,
    `image_url` VARCHAR(512) NOT NULL,
    `sort_order` TINYINT NOT NULL DEFAULT 0,

    INDEX `idx_tfp_track`(`track_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recent_track_visits` (
    `user_id` CHAR(36) NOT NULL,
    `track_id` CHAR(36) NOT NULL,
    `visited_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_rtv_user_time`(`user_id`, `visited_at` DESC),
    PRIMARY KEY (`user_id`, `track_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `records` (
    `id` CHAR(36) NOT NULL,
    `track_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `lap_time_ms` INTEGER UNSIGNED NOT NULL,
    `lap_time_display` VARCHAR(16) NOT NULL,
    `video_url` VARCHAR(512) NOT NULL,
    `config_sheet_type` ENUM('text', 'image') NULL,
    `config_sheet_text` VARCHAR(1000) NULL,
    `config_sheet_url` VARCHAR(512) NULL,
    `note` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_records_track_time`(`track_id`, `lap_time_ms`, `created_at`),
    INDEX `idx_records_user`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `record_car_photos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `record_id` CHAR(36) NOT NULL,
    `image_url` VARCHAR(512) NOT NULL,
    `sort_order` TINYINT NOT NULL DEFAULT 0,

    INDEX `idx_rcp_record`(`record_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `track_best_records` (
    `track_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `record_id` CHAR(36) NOT NULL,
    `lap_time_ms` INTEGER UNSIGNED NOT NULL,
    `first_achieved_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `track_best_records_record_id_key`(`record_id`),
    INDEX `idx_tbr_rank`(`track_id`, `lap_time_ms`, `first_achieved_at`),
    PRIMARY KEY (`track_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boards` (
    `id` VARCHAR(32) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `sort_order` TINYINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` CHAR(36) NOT NULL,
    `board_id` VARCHAR(32) NOT NULL,
    `author_id` CHAR(36) NOT NULL,
    `track_id` CHAR(36) NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `like_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `comment_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `hot_score` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_posts_board_latest`(`board_id`, `created_at` DESC),
    INDEX `idx_posts_board_hot`(`board_id`, `hot_score` DESC, `created_at` DESC),
    INDEX `idx_posts_author`(`author_id`, `created_at` DESC),
    INDEX `idx_posts_track`(`track_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_images` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `post_id` CHAR(36) NOT NULL,
    `image_url` VARCHAR(512) NOT NULL,
    `sort_order` TINYINT NOT NULL DEFAULT 0,

    INDEX `idx_pi_post`(`post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` CHAR(36) NOT NULL,
    `post_id` CHAR(36) NOT NULL,
    `author_id` CHAR(36) NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `like_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_comments_post`(`post_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `likes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `target_type` ENUM('post', 'comment') NOT NULL,
    `target_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_likes_target`(`target_type`, `target_id`),
    UNIQUE INDEX `uk_like`(`user_id`, `target_type`, `target_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `follows` (
    `follower_id` CHAR(36) NOT NULL,
    `followee_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_follows_followee`(`followee_id`, `created_at` DESC),
    PRIMARY KEY (`follower_id`, `followee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_objects` (
    `object_key` VARCHAR(255) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `media_type` ENUM('image', 'video') NOT NULL,
    `purpose` VARCHAR(32) NOT NULL,
    `public_url` VARCHAR(512) NOT NULL,
    `file_size` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('pending', 'confirmed') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `confirmed_at` DATETIME(3) NULL,

    INDEX `idx_media_user`(`user_id`, `created_at` DESC),
    INDEX `idx_media_pending`(`status`, `created_at`),
    PRIMARY KEY (`object_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tracks` ADD CONSTRAINT `tracks_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `track_floor_plans` ADD CONSTRAINT `track_floor_plans_track_id_fkey` FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recent_track_visits` ADD CONSTRAINT `recent_track_visits_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recent_track_visits` ADD CONSTRAINT `recent_track_visits_track_id_fkey` FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `records` ADD CONSTRAINT `records_track_id_fkey` FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `records` ADD CONSTRAINT `records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `record_car_photos` ADD CONSTRAINT `record_car_photos_record_id_fkey` FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `track_best_records` ADD CONSTRAINT `track_best_records_track_id_fkey` FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `track_best_records` ADD CONSTRAINT `track_best_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `track_best_records` ADD CONSTRAINT `track_best_records_record_id_fkey` FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_board_id_fkey` FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_track_id_fkey` FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_images` ADD CONSTRAINT `post_images_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follows` ADD CONSTRAINT `follows_follower_id_fkey` FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follows` ADD CONSTRAINT `follows_followee_id_fkey` FOREIGN KEY (`followee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media_objects` ADD CONSTRAINT `media_objects_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

