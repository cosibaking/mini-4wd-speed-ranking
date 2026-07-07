ALTER TABLE `posts`
  ADD COLUMN `mock_data` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为种子/测试假数据' AFTER `hot_score`;

CREATE INDEX `idx_posts_mock_data` ON `posts`(`mock_data`);
