import { getRecentTracks, listTracks } from '../../services/track';
import { isLoggedIn, refreshUser, requireLogin } from '../../services/auth';
import { navigateWithLogin } from '../../utils/nav';
import { getNavBarLayout } from '../../utils/navBar';
import { getSessionUser, setSessionUser } from '../../stores/session';
import type { TrackListItem } from '../../types';

const HOME_BG_WIDTH = 571;
const HOME_BG_HEIGHT = 1024;

function calcBgTiles(windowWidth: number, minHeight: number): number[] {
  const tileHeight = windowWidth * (HOME_BG_HEIGHT / HOME_BG_WIDTH);
  const count = Math.max(1, Math.ceil(minHeight / tileHeight) + 1);
  return Array.from({ length: count }, (_, i) => i);
}

Page({
  data: {
    recentTracks: [] as TrackListItem[],
    loading: true,
    topPadding: 0,
    showAdminEntry: false,
    bgTiles: [] as number[],
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    const { totalHeight } = getNavBarLayout();
    this.setData({
      topPadding: totalHeight,
      bgTiles: calcBgTiles(sys.windowWidth, sys.windowHeight),
    });
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
      if (isLoggedIn()) {
        try {
          recent = await getRecentTracks();
        } catch {
          // 最近访问为空时忽略
        }
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
      const user = await requireLogin();
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

  onShareAppMessage() {
    return {
      title: '公园四驱·圈速打榜 — 发现赛道，挑战圈速',
      path: '/pages/index/index',
    };
  },
});
