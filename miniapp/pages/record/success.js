Page({
    onGoRecords() {
        wx.navigateTo({ url: '/pages/user/records' });
    },
    onGoHome() {
        wx.switchTab({ url: '/pages/index/index' });
    },
});
