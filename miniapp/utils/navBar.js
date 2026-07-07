"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavBarLayout = getNavBarLayout;
exports.getPageScrollHeight = getPageScrollHeight;
exports.shouldShowNavBack = shouldShowNavBack;
exports.navigateNavBack = navigateNavBack;
/** 导航栏内容区额外下边距（px），避免标题贴底 */
const NAV_CONTENT_EXTRA = 8;
const TAB_ROOT_PAGES = new Set([
    'pages/index/index',
    'pages/leaderboard/index',
    'pages/community/index',
    'pages/user/index',
]);
function getNavBarLayout() {
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
/** 自定义导航栏页面中 scroll-view 可用高度（px） */
function getPageScrollHeight(bottomInset = 0) {
    const sys = wx.getSystemInfoSync();
    const { totalHeight } = getNavBarLayout();
    return sys.windowHeight - totalHeight - bottomInset;
}
/** 与原生导航栏一致：Tab 根页且无历史栈时不显示返回 */
function shouldShowNavBack() {
    const pages = getCurrentPages();
    if (pages.length > 1)
        return true;
    const current = pages[pages.length - 1];
    if (!(current === null || current === void 0 ? void 0 : current.route))
        return false;
    return !TAB_ROOT_PAGES.has(current.route);
}
/** 与原生返回行为一致：有历史则 navigateBack，否则回到首页 Tab */
function navigateNavBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
        wx.navigateBack({ delta: 1 });
        return;
    }
    wx.switchTab({ url: '/pages/index/index' });
}
