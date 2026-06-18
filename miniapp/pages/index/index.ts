import { getRecentTracks, listTracks } from '../../services/track';
import { ensureLoginForTab, navigateWithLogin } from '../../utils/nav';
import type { TrackListItem } from '../../types';

Page({
  data: {
    recentTracks: [] as TrackListItem[],
    loading: true,
    topPadding: 0,
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    const menu = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menu.top - sys.statusBarHeight) * 2 + menu.height;
    this.setData({ topPadding: sys.statusBarHeight + navBarHeight });
  },

  onShow() {
    this.loadRecent();
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

  onOrganizerTap() {
    navigateWithLogin('/pages/user/tracks');
  },

  onDriverTap() {
    navigateWithLogin('/pages/track/list');
  },

  onTabItemTap(e: { pagePath: string; index: number; text: string }) {
    if (e.pagePath === 'pages/index/index') return;
    ensureLoginForTab();
  },
});
