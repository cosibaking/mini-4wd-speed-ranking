import { isLoggedIn, requireLogin } from '../services/auth';
import { setSessionUser } from '../stores/session';

type NavMode = 'navigate' | 'switchTab';

function showLoginConfirm(): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title: '需要登录',
      content: '继续操作需使用当前微信账号登录',
      confirmText: '去登录',
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

/** 未登录时引导用户前往「我的」页登录 */
export function redirectToLogin(message?: string): void {
  wx.showModal({
    title: '需要登录',
    content: message ?? '请先登录后再继续',
    confirmText: '去登录',
    cancelText: '返回',
    success: (res) => {
      if (res.confirm) {
        wx.switchTab({ url: '/pages/user/index' });
        return;
      }
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.switchTab({ url: '/pages/index/index' });
      }
    },
  });
}

/** 页面进入前检查登录，未登录则弹窗引导 */
export async function guardLogin(message?: string): Promise<boolean> {
  if (isLoggedIn()) {
    try {
      await requireLogin();
      return true;
    } catch {
      // token 失效，继续走引导登录
    }
  }
  redirectToLogin(message);
  return false;
}

/** 已登录时跳转页面；未登录则引导至「我的」页登录 */
export async function navigateWithLogin(
  url: string,
  options?: { mode?: NavMode }
): Promise<boolean> {
  const mode = options?.mode ?? 'navigate';

  if (!isLoggedIn()) {
    const confirmed = await showLoginConfirm();
    if (!confirmed) return false;
    wx.switchTab({ url: '/pages/user/index' });
    return false;
  }

  wx.showLoading({ title: '加载中...', mask: true });
  try {
    const user = await requireLogin();
    setSessionUser(user);
    if (mode === 'switchTab') {
      await switchTabAsync(url);
    } else {
      await navigateToAsync(url);
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : undefined;
    redirectToLogin(message);
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
