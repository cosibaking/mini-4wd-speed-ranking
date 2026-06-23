-- 修复 202606231000 因迁移脚本跳过注释块而未执行的 users 字段变更
ALTER TABLE users
  ADD COLUMN is_organizer_certified TINYINT(1) NOT NULL DEFAULT 0 AFTER avatar_url,
  ADD COLUMN admin_role ENUM('admin', 'operator') NULL AFTER is_organizer_certified;

UPDATE users u
SET is_organizer_certified = 1
WHERE EXISTS (SELECT 1 FROM tracks t WHERE t.creator_id = u.id);
