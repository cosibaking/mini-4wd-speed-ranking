#!/usr/bin/env bash
# 清空 mock_data=true 的帖子及相关数据（保留真实帖子与其他业务数据）。
# 仅依赖 bash 与 mysql 客户端，直接操作数据库。
#
# 清理范围（仅限 mock_data=1 的帖子及其子数据）：
#   - 帖子/评论点赞（likes）
#   - 社区相关通知（payload 引用 mock 帖子/评论）
#   - 评论图片、评论、帖子图片、帖子
#
# 连接信息（按优先级）：
#   1. 命令行参数 --host --port --user --password --database
#   2. 环境变量 MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE
#   3. 环境变量 DATABASE_URL（mysql://用户:密码@主机:端口/库名）
#   4. server/.env.local 或 server/.env 中的 DATABASE_URL
#
# 用法：
#   bash scripts/clear-mock-posts.sh
#   bash scripts/clear-mock-posts.sh --yes
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[clear-mock-posts]${NC} $*"; }
ok()    { echo -e "${GREEN}[clear-mock-posts]${NC} ✓ $*"; }
fail()  { echo -e "${RED}[clear-mock-posts]${NC} ✗ $*"; exit 1; }

MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="mini4wd"
MYSQL_PASSWORD="mini4wd"
MYSQL_DATABASE="mini4wd"
SKIP_CONFIRM=false

MOCK_POSTS_SUB="SELECT id FROM posts WHERE mock_data = 1"
MOCK_COMMENTS_SUB="SELECT id FROM comments WHERE post_id IN (${MOCK_POSTS_SUB})"

CLEAR_STEPS=(
  "likes:mock|mock 帖子/评论点赞"
  "notifications:mock|mock 社区相关通知"
  "comment_images:mock|mock 评论图片"
  "comments:mock|mock 评论"
  "post_images:mock|mock 帖子图片"
  "posts:mock|mock 帖子"
)

usage() {
  cat <<'EOF'
用法: bash scripts/clear-mock-posts.sh [选项]

选项:
  --host HOST         MySQL 主机
  --port PORT         MySQL 端口（默认 3306）
  --user USER         MySQL 用户
  --password PASS     MySQL 密码
  --database DB       数据库名
  --yes               跳过交互确认（危险）
  -h, --help          显示帮助

未传连接参数时，将依次读取 MYSQL_*、DATABASE_URL、server/.env.local、server/.env。

仅删除 posts.mock_data = 1 的帖子及其关联数据，真实帖子不受影响。
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

  case "${table}:${variant}" in
    likes:mock)
      echo "DELETE FROM likes WHERE (target_type = 'post' AND target_id IN (${MOCK_POSTS_SUB})) OR (target_type = 'comment' AND target_id IN (${MOCK_COMMENTS_SUB}));"
      ;;
    notifications:mock)
      echo "DELETE FROM notifications WHERE type IN ('post_liked', 'post_commented', 'comment_liked', 'comment_replied') AND (JSON_UNQUOTE(JSON_EXTRACT(payload, '$.postId')) IN (${MOCK_POSTS_SUB}) OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.commentId')) IN (${MOCK_COMMENTS_SUB}));"
      ;;
    comment_images:mock)
      echo "DELETE FROM comment_images WHERE comment_id IN (${MOCK_COMMENTS_SUB});"
      ;;
    comments:mock)
      echo "DELETE FROM comments WHERE post_id IN (${MOCK_POSTS_SUB});"
      ;;
    post_images:mock)
      echo "DELETE FROM post_images WHERE post_id IN (${MOCK_POSTS_SUB});"
      ;;
    posts:mock)
      echo "DELETE FROM posts WHERE mock_data = 1;"
      ;;
    *)
      fail "未知清理步骤: ${table}:${variant}"
      ;;
  esac
}

count_for_step() {
  local step="$1"
  local table="${step%%|*}"
  local variant="${table#*:}"
  table="${table%%:*}"

  case "${table}:${variant}" in
    likes:mock)
      count_rows likes "(target_type = 'post' AND target_id IN (${MOCK_POSTS_SUB})) OR (target_type = 'comment' AND target_id IN (${MOCK_COMMENTS_SUB}))"
      ;;
    notifications:mock)
      count_rows notifications "type IN ('post_liked', 'post_commented', 'comment_liked', 'comment_replied') AND (JSON_UNQUOTE(JSON_EXTRACT(payload, '$.postId')) IN (${MOCK_POSTS_SUB}) OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.commentId')) IN (${MOCK_COMMENTS_SUB}))"
      ;;
    comment_images:mock)
      count_rows comment_images "comment_id IN (${MOCK_COMMENTS_SUB})"
      ;;
    comments:mock)
      count_rows comments "post_id IN (${MOCK_POSTS_SUB})"
      ;;
    post_images:mock)
      count_rows post_images "post_id IN (${MOCK_POSTS_SUB})"
      ;;
    posts:mock)
      count_rows posts "mock_data = 1"
      ;;
    *)
      fail "未知清理步骤: ${table}:${variant}"
      ;;
  esac
}

confirm_action() {
  if [[ "$SKIP_CONFIRM" == true ]]; then
    return 0
  fi

  echo ""
  echo -e "${YELLOW}警告：将清空所有 mock_data=true 的帖子及相关数据，且不可恢复。${NC}"
  echo -e "${YELLOW}真实帖子（mock_data=false）将保留。${NC}"
  echo ""
  read -r -p '输入 yes 确认执行: ' answer
  [[ "$answer" == "yes" ]] || fail "已取消"
}

show_preview() {
  local step label count
  info "待清理 mock 数据预览："
  for step in "${CLEAR_STEPS[@]}"; do
    label="${step#*|}"
    count="$(count_for_step "$step")"
    printf '  - %-24s %s 行\n' "$label" "$count"
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
  info "将清空 mock_data=true 的帖子及关联数据"

  show_preview
  confirm_action
  run_clear

  ok "完成"
}

main "$@"
