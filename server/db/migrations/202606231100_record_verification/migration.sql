ALTER TABLE records
  ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER note,
  ADD COLUMN submitted_lap_time_ms INT UNSIGNED NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN submitted_lap_time_display VARCHAR(16) NOT NULL DEFAULT '' AFTER submitted_lap_time_ms,
  ADD COLUMN reviewed_by CHAR(36) NULL AFTER submitted_lap_time_display,
  ADD COLUMN reviewed_at DATETIME(3) NULL AFTER reviewed_by,
  ADD COLUMN review_note VARCHAR(200) NULL AFTER reviewed_at,
  ADD INDEX idx_records_track_status (track_id, status, created_at);

UPDATE records SET
  status = 'approved',
  submitted_lap_time_ms = lap_time_ms,
  submitted_lap_time_display = lap_time_display;
