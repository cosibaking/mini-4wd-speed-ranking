#!/usr/bin/env bash
# 清空所有赛道相关数据（保留用户、社区、板块等其他业务数据）。
# 仅依赖 bash 与 mysql 客户端，直接操作数据库。
#
# 清理范围：
#   - 赛道榜单、圈速记录、车辆照片
#   - 最近访问、平面图
#   - 赛道本体
#   - 帖子关联的 track_id（置空，不删帖）
#   - 圈速相关通知、赛道/圈速媒体元数据
#
# 连接信息（按优先级）：
#   1. 命令行参数 --host --port --user --password --database
#   2. 环境变量 MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE
#   3. 环境变量 DATABASE_URL（mysql://用户:密码@主机:端口/库名）
#   4. server/.env.local 或 server/.env 中的 DATABASE_URL
#
# 用法：
#   bash scripts/clear-all-tracks.sh
#   bash scripts/clear-all-tracks.sh --yes
#   bash scripts/clear-all-tracks.sh --host 127.0.0.1 --user mini4wd --password mini4wd --database mini4wd
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[clear-tracks]${NC} $*"; }
ok()    { echo -e "${GREEN}[clear-tracks]${NC} ✓ $*"; }
fail()  { echo -e "${RED}[clear-tracks]${NC} ✗ $*"; exit 1; }

MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="mini4wd"
MYSQL_PASSWORD="mini4wd"
MYSQL_DATABASE="mini4wd"
SKIP_CONFIRM=false

# 按外键依赖顺序清理
CLEAR_STEPS=(
  "track_best_records|榜单最佳成绩"
  "record_car_photos|圈速车辆照片"
  "records|圈速记录"
  "recent_track_visits|最近访问"
  "track_floor_plans|赛道平面图"
  "notifications:record|圈速相关通知"
  "media_objects:track|赛道/圈速媒体元数据"
  "posts:unlink|帖子赛道关联"
  "tracks|赛道"
)

usage() {
  cat <<'EOF'
用法: bash scripts/clear-all-tracks.sh [选项]

选项:
  --host HOST         MySQL 主机
  --port PORT         MySQL 端口（默认 3306）
  --user USER         MySQL 用户
  --password PASS     MySQL 密码
  --database DB       数据库名
  --yes               跳过交互确认（危险）
  -h, --help          显示帮助

未传连接参数时，将依次读取 MYSQL_*、DATABASE_URL、server/.env.local、server/.env。

保留：用户、关注、社区帖子/评论、板块、主理人申请等非赛道数据。
EOF
}

url_decode() {
  local encoded="${1//+/ }"
  printf '%b' "${encoded//%/\\x}"
}

read_env_database_url() {
  local file="$1"
  [[ -f "$file" ]] || return 1

  local line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -n "$line" ]] || continue
    [[ "$line" == *=* ]] || continue

    key="${line%%=*}"
    key="$(echo "$key" | sed 's/[[:space:]]*$//')"
    [[ "$key" == "DATABASE_URL" ]] || continue

    value="${line#*=}"
    value="$(echo "$value" | sed 's/^[[:space:]]*//')"
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    echo "$value"
    return 0
  done < "$file"
  return 1
}

parse_database_url() {
  local url="$1"
  [[ "$url" =~ ^mysql:// ]] || fail "DATABASE_URL 格式应为 mysql://用户:密码@主机:端口/库名"

  url="${url#mysql://}"

  local userpass hostpart
  if [[ "$url" != *@* ]]; then
    fail "DATABASE_URL 缺少 @ 符号"
  fi
  userpass="${url%%@*}"
  hostpart="${url#*@}"

  MYSQL_USER="${userpass%%:*}"
  MYSQL_PASSWORD="${userpass#*:}"
  MYSQL_USER="$(url_decode "$MYSQL_USER")"
  MYSQL_PASSWORD="$(url_decode "$MYSQL_PASSWORD")"

  local path="${hostpart#*/}"
  path="${path%%\?*}"
  MYSQL_DATABASE="${path%%/*}"

  local hostport="${hostpart%%/*}"
  MYSQL_HOST="${hostport%%:*}"
  if [[ "$hostport" == *:* ]]; then
    MYSQL_PORT="${hostport#*:}"
    MYSQL_PORT="${MYSQL_PORT%%/*}"
  else
    MYSQL_PORT="3306"
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --host) MYSQL_HOST="${2:-}"; shift 2 ;;
      --port) MYSQL_PORT="${2:-}"; shift 2 ;;
      --user) MYSQL_USER="${2:-}"; shift 2 ;;
      --password) MYSQL_PASSWORD="${2:-}"; shift 2 ;;
      --database) MYSQL_DATABASE="${2:-}"; shift 2 ;;
      --yes) SKIP_CONFIRM=true; shift ;;
      -h|--help) usage; exit 0 ;;
      *) fail "未知参数: $1（使用 --help 查看用法）" ;;
    esac
  done
}

resolve_connection() {
  if [[ -n "$MYSQL_HOST" && -n "$MYSQL_USER" && -n "$MYSQL_DATABASE" ]]; then
    return 0
  fi

  if [[ -n "${DATABASE_URL:-}" ]]; then
    parse_database_url "$DATABASE_URL"
    return 0
  fi

  local env_url=""
  env_url="$(read_env_database_url "$PROJECT_ROOT/server/.env.local" 2>/dev/null || true)"
  if [[ -z "$env_url" ]]; then
    env_url="$(read_env_database_url "$PROJECT_ROOT/server/.env" 2>/dev/null || true)"
  fi
  if [[ -n "$env_url" ]]; then
    parse_database_url "$env_url"
    return 0
  fi

  fail "未找到数据库连接信息。请传 --host/--user/--password/--database，或配置 server/.env 中的 DATABASE_URL"
}

require_mysql_client() {
  command -v mysql >/dev/null 2>&1 || fail "未找到 mysql 客户端，请先安装 MySQL client"
}

mysql_query() {
  MYSQL_PWD="$MYSQL_PASSWORD" mysql \
    --protocol=TCP \
    -N -s \
    -h "$MYSQL_HOST" \
    -P "$MYSQL_PORT" \
    -u "$MYSQL_USER" \
    "$MYSQL_DATABASE" \
    -e "$1"
}

count_rows() {
  local table="$1"
  local where="${2:-}"
  if [[ -n "$where" ]]; then
    mysql_query "SELECT COUNT(*) FROM \`${table}\` WHERE ${where};"
  else
    mysql_query "SELECT COUNT(*) FROM \`${table}\`;"
  fi
}

sql_for_step() {
  local step="$1"
  local table="${step%%|*}"
  local variant="${table#*:}"
  table="${table%%:*}"

  case "$variant" in
    record)
      echo "DELETE FROM notifications WHERE type IN ('record_approved', 'record_rejected', 'record_pending_review');"
      ;;
    track)
      echo "DELETE FROM media_objects WHERE purpose IN ('track_floor_plan', 'track_example_video', 'record_video', 'record_config', 'record_car_photo');"
      ;;
    unlink)
      echo "UPDATE posts SET track_id = NULL WHERE track_id IS NOT NULL;"
      ;;
    *)
      echo "DELETE FROM \`${table}\`;"
      ;;
  esac
}

count_for_step() {
  local step="$1"
  local table="${step%%|*}"
  local variant="${table#*:}"
  table="${table%%:*}"

  case "$variant" in
    record)
      count_rows notifications "type IN ('record_approved', 'record_rejected', 'record_pending_review')"
      ;;
    track)
      count_rows media_objects "purpose IN ('track_floor_plan', 'track_example_video', 'record_video', 'record_config', 'record_car_photo')"
      ;;
    unlink)
      count_rows posts "track_id IS NOT NULL"
      ;;
    *)
      count_rows "$table"
      ;;
  esac
}

confirm_action() {
  if [[ "$SKIP_CONFIRM" == true ]]; then
    return 0
  fi

  echo ""
  echo -e "${YELLOW}警告：将清空所有赛道相关数据，且不可恢复。${NC}"
  echo -e "${YELLOW}保留：用户、社区、板块、关注、主理人申请等。${NC}"
  echo ""
  read -r -p '输入 yes 确认执行: ' answer
  [[ "$answer" == "yes" ]] || fail "已取消"
}

show_preview() {
  local step label table count
  info "待清理数据预览："
  for step in "${CLEAR_STEPS[@]}"; do
    label="${step#*|}"
    count="$(count_for_step "$step")"
    printf '  - %-20s %s 行\n' "$label" "$count"
  done
}

run_clear() {
  local step label sql
  for step in "${CLEAR_STEPS[@]}"; do
    label="${step#*|}"
    sql="$(sql_for_step "$step")"
    MYSQL_PWD="$MYSQL_PASSWORD" mysql \
      --protocol=TCP \
      -h "$MYSQL_HOST" \
      -P "$MYSQL_PORT" \
      -u "$MYSQL_USER" \
      "$MYSQL_DATABASE" \
      -e "$sql"
    ok "已清理 ${label}"
  done
}

main() {
  parse_args "$@"
  resolve_connection
  require_mysql_client

  info "目标：${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}"
  info "将清空赛道、圈速、榜单及相关关联数据"

  show_preview
  confirm_action
  run_clear

  ok "完成"
}

main "$@"
