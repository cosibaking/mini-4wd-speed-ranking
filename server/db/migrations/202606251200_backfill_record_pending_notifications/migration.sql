INSERT INTO notifications (id, user_id, type, title, content, payload, is_read, created_at)
SELECT
  UUID(),
  t.creator_id,
  'record_pending_review',
  '有新的成绩待审核',
  CONCAT(
    IF(u.nick_name = '' OR u.nick_name IS NULL, '车友', u.nick_name),
    ' 在「',
    t.name,
    '」提交了 ',
    r.submitted_lap_time_display,
    '，请及时审核'
  ),
  JSON_OBJECT(
    'recordId', r.id,
    'trackId', r.track_id,
    'trackName', t.name,
    'actorId', r.user_id,
    'actorNickName', IF(u.nick_name = '' OR u.nick_name IS NULL, '车友', u.nick_name),
    'linkPath', CONCAT('/pages/organizer/review?id=', r.id)
  ),
  0,
  r.created_at
FROM records r
INNER JOIN tracks t ON t.id = r.track_id
INNER JOIN users u ON u.id = r.user_id
WHERE r.status = 'pending'
  AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.type = 'record_pending_review'
      AND JSON_UNQUOTE(JSON_EXTRACT(n.payload, '$.recordId')) = r.id
  );
