import { ensureLogin, isLoggedIn } from '../services/auth';
import { setSessionUser } from '../stores/session';

type NavMode = 'navigate' | 'switchTab';

function showLoginConfirm(): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title: '需要登录',
      content: '继续操作需使用当前微信账号登录',
      confirmText: '微信登录',
      cancelText: '取消',
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    });
  });
}

function navigateToAsync(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.navigateTo({ url, success: () => resolve(), fail: reject });
  });
}

function switchTabAsync(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.switchTab({ url, success: () => resolve(), fail: reject });
  });
}

function showLoginError(message?: string): void {
  wx.showModal({
    title: '登录失败',
    content: message || '微信登录未成功，请检查网络后重试',
    showCancel: false,
  });
}

/** 确保已登录后再跳转页面 */
export async function navigateWithLogin(
  url: string,
  options?: { mode?: NavMode }
): Promise<boolean> {
  const mode = options?.mode ?? 'navigate';
  const needLogin = !isLoggedIn();

  if (needLogin) {
    const confirmed = await showLoginConfirm();
    if (!confirmed) return false;
  }

  wx.showLoading({ title: '登录中...', mask: true });
  try {
    const user = await ensureLogin();
    setSessionUser(user);
    if (mode === 'switchTab') {
      await switchTabAsync(url);
    } else {
      await navigateToAsync(url);
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : undefined;
    showLoginError(message);
    return false;
  } finally {
    wx.hideLoading();
  }
}

export const PENDING_LEADERBOARD_TRACK_KEY = 'pending_leaderboard_track_id';

/** 切换到圈速榜 Tab 并定位到指定赛道 */
export function switchToLeaderboard(trackId: string): void {
  wx.setStorageSync(PENDING_LEADERBOARD_TRACK_KEY, trackId);
  wx.switchTab({ url: '/pages/leaderboard/index' });
}

/** 底部 Tab 切换时确保已登录（Tab 会先切换，登录失败则返回首页） */
export function ensureLoginForTab(): void {
  if (!isLoggedIn()) {
    wx.showLoading({ title: '登录中...', mask: true });
  }

  ensureLogin()
    .then((user) => {
      setSessionUser(user);
    })
    .catch((err) => {
      wx.switchTab({ url: '/pages/index/index' });
      const message = err instanceof Error ? err.message : undefined;
      showLoginError(message);
    })
    .finally(() => {
      wx.hideLoading();
    });
}
