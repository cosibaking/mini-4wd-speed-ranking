"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Component({
    data: {
        visible: false,
        contractName: '《用户隐私保护指引》',
    },
    lifetimes: {
        attached() {
            const app = getApp();
            app.globalData.privacyPopup = this;
            this.loadContractName();
        },
        detached() {
            const app = getApp();
            if (app.globalData.privacyPopup === this) {
                app.globalData.privacyPopup = null;
            }
        },
    },
    methods: {
        loadContractName() {
            if (typeof wx.getPrivacySetting !== 'function')
                return;
            wx.getPrivacySetting({
                success: (res) => {
                    if (res.privacyContractName) {
                        this.setData({ contractName: res.privacyContractName });
                    }
                },
            });
        },
        show() {
            this.loadContractName();
            this.setData({ visible: true });
        },
        hide() {
            this.setData({ visible: false });
        },
        onOpenContract() {
            if (typeof wx.openPrivacyContract !== 'function')
                return;
            wx.openPrivacyContract({
                fail: () => {
                    wx.showToast({ title: '暂时无法打开隐私协议', icon: 'none' });
                },
            });
        },
        onAgree() {
            const app = getApp();
            const resolve = app.globalData.resolvePrivacyAuthorization;
            if (resolve) {
                resolve({ buttonId: 'privacy-agree-btn', event: 'agree' });
                app.globalData.resolvePrivacyAuthorization = null;
            }
            this.hide();
        },
        onDisagree() {
            const app = getApp();
            const resolve = app.globalData.resolvePrivacyAuthorization;
            if (resolve) {
                resolve({ event: 'disagree' });
                app.globalData.resolvePrivacyAuthorization = null;
            }
            this.hide();
            wx.showToast({ title: '需同意隐私协议后才能使用相关功能', icon: 'none' });
        },
    },
});
