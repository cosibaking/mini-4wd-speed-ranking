import { getRecentTracks, listTracks } from '../../services/track';
import { ensureLogin, refreshUser } from '../../services/auth';
import { ensureLoginForTab, navigateWithLogin } from '../../utils/nav';
import { getSessionUser, setSessionUser } from '../../stores/session';
import type { TrackListItem } from '../../types';

Page({
  data: {
    recentTracks: [] as TrackListItem[],
    loading: true,
    topPadding: 0,
    showAdminEntry: false,
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    const menu = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menu.top - sys.statusBarHeight) * 2 + menu.height;
    this.setData({ topPadding: sys.statusBarHeight + navBarHeight });
  },

  onShow() {
    this.refreshAdminEntry();
    this.loadRecent();
  },

  async refreshAdminEntry() {
    const user = await refreshUser();
    this.setData({ showAdminEntry: !!user?.isAdmin });
  },

  async loadRecent() {
    this.setData({ loading: true });
    try {
      let recent: TrackListItem[] = [];
      try {
        recent = await getRecentTracks();
      } catch {
        // 未登录或最近访问接口不可用时忽略
      }
      if (recent.length === 0) {
        const res = await listTracks({ pageSize: 3 });
        recent = res.list.slice(0, 3);
      }
      this.setData({ recentTracks: recent, loading: false });
    } catch {
      this.setData({ loading: false });
    }
  },

  async onOrganizerTap() {
    if (!getSessionUser()) {
      const ok = await navigateWithLogin('/pages/organizer/apply');
      if (!ok) return;
    }

    wx.showLoading({ title: '加载中', mask: true });
    try {
      const user = await ensureLogin();
      setSessionUser(user);

      if (user.isOrganizer) {
        wx.navigateTo({ url: '/pages/user/tracks' });
        return;
      }
      if (user.organizerApplication) {
        wx.navigateTo({ url: '/pages/organizer/status' });
        return;
      }
      wx.navigateTo({ url: '/pages/organizer/apply' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onDriverTap() {
    navigateWithLogin('/pages/track/list');
  },

  onAdminTap() {
    wx.navigateTo({ url: '/admin/pages/index/index' });
  },

  onTabItemTap(e: { pagePath: string; index: number; text: string }) {
    if (e.pagePath === 'pages/index/index') return;
    ensureLoginForTab();
  },
});
