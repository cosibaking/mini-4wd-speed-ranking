#!/usr/bin/env bash
# 一键部署到 82 测试服务器：拉代码 → rsync → 构建迁移 → PM2 重启 → 健康检查
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="${DEPLOY_CONFIG:-$SCRIPT_DIR/deploy.config}"

# ── 颜色 ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()    { echo -e "${GREEN}[deploy]${NC} ✓ $*"; }
warn()  { echo -e "${YELLOW}[deploy]${NC} ⚠ $*"; }
fail()  { echo -e "${RED}[deploy]${NC} ✗ $*"; exit 1; }

step() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $*${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ── 加载配置 ──────────────────────────────────────────────
[[ -f "$CONFIG_FILE" ]] || fail "未找到配置文件: $CONFIG_FILE\n  请先执行: cp scripts/deploy.config.example scripts/deploy.config"

# shellcheck disable=SC1090
source "$CONFIG_FILE"

DEPLOY_HOST="${DEPLOY_HOST:?请设置 DEPLOY_HOST}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/home/ubuntu/mini-4wd-speed-ranking}"
DEPLOY_PORT="${DEPLOY_PORT:-3001}"
DEPLOY_PM2_NAME="${DEPLOY_PM2_NAME:-mini4wd-api}"
DEPLOY_HEALTH_PATH="${DEPLOY_HEALTH_PATH:-/api/v1/health}"
GIT_BRANCH="${GIT_BRANCH:-main}"
ALLOW_DIRTY="${ALLOW_DIRTY:-false}"
VERIFY_PUBLIC="${VERIFY_PUBLIC:-true}"
HEALTH_RETRIES="${HEALTH_RETRIES:-10}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-2}"

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
RSYNC_EXCLUDES=(
  --exclude node_modules
  --exclude .git
  --exclude server/dist
  --exclude server/.env
  --exclude docker-compose.yml
  --exclude scripts/deploy.config
  --exclude .DS_Store
)

# ── SSH / rsync 封装 ──────────────────────────────────────
setup_ssh() {
  if [[ -n "${DEPLOY_PASSWORD:-}" ]]; then
    command -v sshpass >/dev/null 2>&1 || fail "未安装 sshpass，请: brew install sshpass（或改用 SSH 密钥并清空 DEPLOY_PASSWORD）"
    export SSHPASS="$DEPLOY_PASSWORD"
    SSH_CMD=(sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15)
    RSYNC_SSH=(sshpass -e rsync -e "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15")
  else
    SSH_CMD=(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15)
    RSYNC_SSH=(rsync -e "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15")
  fi
}

remote() {
  "${SSH_CMD[@]}" "$SSH_TARGET" "$@"
}

# ── Step 0: 前置检查 ──────────────────────────────────────
step "0/5  前置检查"
setup_ssh

info "项目目录: $PROJECT_ROOT"
info "目标服务器: $SSH_TARGET"
info "远程目录: $DEPLOY_REMOTE_DIR"
info "API 端口: $DEPLOY_PORT"

"${SSH_CMD[@]}" "$SSH_TARGET" "echo ok" >/dev/null 2>&1 \
  || fail "无法 SSH 连接到 $SSH_TARGET"

ok "SSH 连接正常"

# ── Step 1: 拉取最新代码 ──────────────────────────────────
step "1/5  拉取最新代码"
cd "$PROJECT_ROOT"

if [[ -d .git ]]; then
  if [[ "$ALLOW_DIRTY" != "true" ]] && [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    fail "工作区有未提交改动。请先 commit/stash，或设置 ALLOW_DIRTY=true"
  fi

  if [[ -n "$GIT_BRANCH" ]]; then
    CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
    if [[ "$CURRENT_BRANCH" != "$GIT_BRANCH" ]]; then
      warn "当前分支 $CURRENT_BRANCH，切换到 $GIT_BRANCH"
      git checkout "$GIT_BRANCH"
    fi
    info "git pull origin $GIT_BRANCH ..."
    git pull --ff-only origin "$GIT_BRANCH"
    ok "代码已更新 ($(git rev-parse --short HEAD) $(git log -1 --format='%s'))"
  else
    warn "GIT_BRANCH 为空，跳过 git pull"
  fi
else
  warn "非 git 仓库，跳过 git pull"
fi

# ── Step 2: 同步代码到服务器 ──────────────────────────────
step "2/5  同步代码 (rsync)"
info "排除: node_modules, .git, server/dist, server/.env, docker-compose.yml"

"${RSYNC_SSH[@]}" -avz --delete \
  "${RSYNC_EXCLUDES[@]}" \
  "$PROJECT_ROOT/" \
  "$SSH_TARGET:$DEPLOY_REMOTE_DIR/"

ok "代码同步完成"

# ── Step 3: 远程构建与部署 ──────────────────────────────────
step "3/5  远程构建、迁移、重启"

REMOTE_SCRIPT=$(cat <<'REMOTE_EOF'
set -euo pipefail
cd "$DEPLOY_REMOTE_DIR"

echo "[remote] npm install ..."
npm install --no-audit --no-fund

echo "[remote] db migrate ..."
npm run db:migrate

echo "[remote] build server ..."
npm run build:server

echo "[remote] pm2 restart ..."
if pm2 describe "$DEPLOY_PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$DEPLOY_PM2_NAME" --update-env
else
  pm2 start dist/index.js --name "$DEPLOY_PM2_NAME" --cwd "$DEPLOY_REMOTE_DIR/server"
fi
pm2 save

echo "[remote] pm2 status:"
pm2 describe "$DEPLOY_PM2_NAME" | grep -E 'status|exec cwd|script path' || true
REMOTE_EOF
)

remote bash -s <<EOF
export DEPLOY_REMOTE_DIR="$DEPLOY_REMOTE_DIR"
export DEPLOY_PM2_NAME="$DEPLOY_PM2_NAME"
$REMOTE_SCRIPT
EOF

ok "远程部署完成"

# ── Step 4: 健康检查（服务器本机） ────────────────────────
step "4/5  健康检查（服务器本机）"

HEALTH_URL="http://127.0.0.1:${DEPLOY_PORT}${DEPLOY_HEALTH_PATH}"
info "等待服务就绪: $HEALTH_URL"

SERVER_HEALTH=""
for ((i = 1; i <= HEALTH_RETRIES; i++)); do
  SERVER_HEALTH="$(remote curl -sf "$HEALTH_URL" 2>/dev/null || true)"
  if [[ -n "$SERVER_HEALTH" ]] && echo "$SERVER_HEALTH" | grep -q '"status"'; then
    ok "本机 health 通过 (第 ${i} 次)"
    echo "  $SERVER_HEALTH"
    break
  fi
  if [[ $i -eq HEALTH_RETRIES ]]; then
    fail "本机 health 检查失败（重试 ${HEALTH_RETRIES} 次）\n  查看日志: ssh $SSH_TARGET 'pm2 logs $DEPLOY_PM2_NAME --lines 50'"
  fi
  info "第 ${i}/${HEALTH_RETRIES} 次未就绪，${HEALTH_INTERVAL}s 后重试 ..."
  sleep "$HEALTH_INTERVAL"
done

# ── Step 5: 公网验证（可选） ──────────────────────────────
step "5/5  公网验证"

PUBLIC_URL="http://${DEPLOY_HOST}:${DEPLOY_PORT}${DEPLOY_HEALTH_PATH}"

if [[ "$VERIFY_PUBLIC" == "true" ]]; then
  info "探测公网: $PUBLIC_URL"
  PUBLIC_HEALTH="$(curl -sf --connect-timeout 5 "$PUBLIC_URL" 2>/dev/null || true)"
  if [[ -n "$PUBLIC_HEALTH" ]] && echo "$PUBLIC_HEALTH" | grep -q '"status"'; then
    ok "公网 health 通过"
    echo "  $PUBLIC_HEALTH"
  else
    warn "公网 health 未通过（可能安全组未放行 TCP ${DEPLOY_PORT}）"
    warn "请在腾讯云安全组添加入站规则: TCP ${DEPLOY_PORT}"
    warn "本机 health 已通过，服务本身运行正常"
  fi
else
  info "VERIFY_PUBLIC=false，跳过公网探测"
fi

# ── 完成 ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  部署成功！${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "  API:      http://${DEPLOY_HOST}:${DEPLOY_PORT}${DEPLOY_HEALTH_PATH}"
echo "  Mock登录: POST http://${DEPLOY_HOST}:${DEPLOY_PORT}/api/v1/auth/login"
echo "  日志:     ssh ${SSH_TARGET} 'pm2 logs ${DEPLOY_PM2_NAME}'"
echo "  重启:     ssh ${SSH_TARGET} 'pm2 restart ${DEPLOY_PM2_NAME}'"
echo ""
