/** 导航栏内容区额外下边距（px），避免标题贴底 */
const NAV_CONTENT_EXTRA = 8;

const TAB_ROOT_PAGES = new Set([
  'pages/index/index',
  'pages/leaderboard/index',
  'pages/community/index',
  'pages/user/index',
]);

export interface NavBarLayout {
  statusBarHeight: number;
  navBarHeight: number;
  totalHeight: number;
  menuLeft: number;
}

export function getNavBarLayout(): NavBarLayout {
  const sys = wx.getSystemInfoSync();
  const menu = wx.getMenuButtonBoundingClientRect();
  const gap = menu.top - sys.statusBarHeight;
  const navBarHeight = gap * 2 + menu.height + NAV_CONTENT_EXTRA;
  return {
    statusBarHeight: sys.statusBarHeight,
    navBarHeight,
    totalHeight: sys.statusBarHeight + navBarHeight,
    menuLeft: menu.left,
  };
}

/** 与原生导航栏一致：Tab 根页且无历史栈时不显示返回 */
export function shouldShowNavBack(): boolean {
  const pages = getCurrentPages();
  if (pages.length > 1) return true;
  const current = pages[pages.length - 1];
  if (!current?.route) return false;
  return !TAB_ROOT_PAGES.has(current.route);
}

/** 与原生返回行为一致：有历史则 navigateBack，否则回到首页 Tab */
export function navigateNavBack(): void {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    wx.navigateBack({ delta: 1 });
    return;
  }
  wx.switchTab({ url: '/pages/index/index' });
}
