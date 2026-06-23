const PENDING_TRACK_KEY = 'pending_leaderboard_track_id';
Page({
    data: {
        trackId: '',
    },
    onLoad(options) {
        if (options.trackId) {
            this.setData({ trackId: options.trackId });
        }
    },
    onGoLeaderboard() {
        const { trackId } = this.data;
        if (trackId) {
            wx.setStorageSync(PENDING_TRACK_KEY, trackId);
        }
        wx.switchTab({ url: '/pages/leaderboard/index' });
    },
    onGoHome() {
        wx.switchTab({ url: '/pages/index/index' });
    },
});
