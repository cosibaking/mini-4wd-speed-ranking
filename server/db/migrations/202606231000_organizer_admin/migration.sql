-- 主理人认证与管理后台权限
ALTER TABLE users
  ADD COLUMN is_organizer_certified TINYINT(1) NOT NULL DEFAULT 0 AFTER avatar_url,
  ADD COLUMN admin_role ENUM('admin', 'operator') NULL AFTER is_organizer_certified;

CREATE TABLE organizer_applications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  real_name VARCHAR(64) NOT NULL,
  id_card_number VARCHAR(18) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  wechat VARCHAR(64) NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  real_name_verified_at DATETIME(3) NULL,
  review_note VARCHAR(255) NULL,
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_oa_user (user_id),
  INDEX idx_oa_status_created (status, created_at DESC),
  CONSTRAINT fk_oa_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_oa_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 已有赛道的创建者视为已认证主理人
UPDATE users u
SET is_organizer_certified = 1
WHERE EXISTS (SELECT 1 FROM tracks t WHERE t.creator_id = u.id);
