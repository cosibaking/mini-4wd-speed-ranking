"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const clientConfig_1 = require("../../services/clientConfig");
const organizer_1 = require("../../services/organizer");
const session_1 = require("../../stores/session");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        form: {
            realName: '',
            idCardNumber: '',
            phone: '',
            wechat: '',
        },
        realNameCode: '',
        realNameMock: false,
        launchingAuth: false,
        submitting: false,
    },
    async onLoad() {
        var _a;
        if (!(await (0, nav_1.guardLogin)('请先登录后再申请')))
            return;
        const [user, clientConfig] = await Promise.all([(0, auth_1.requireLogin)(), (0, clientConfig_1.getClientConfig)()]);
        this.setData({ realNameMock: (0, clientConfig_1.isRealNameMockEnabled)(clientConfig) });
        if (user.isOrganizer) {
            wx.redirectTo({ url: '/pages/user/tracks' });
            return;
        }
        if (((_a = user.organizerApplication) === null || _a === void 0 ? void 0 : _a.status) === 'pending') {
            wx.redirectTo({ url: '/pages/organizer/status' });
        }
    },
    onShow() {
        if (this.data.realNameMock) {
            return;
        }
        const code = (0, organizer_1.extractRealNameCode)();
        if (code && code !== this.data.realNameCode) {
            this.setData({ realNameCode: code });
            this.verifyReturnedCode(code);
        }
    },
    onRealNameInput(e) {
        this.setData({ 'form.realName': e.detail.value, realNameCode: '' });
    },
    onIdCardInput(e) {
        this.setData({ 'form.idCardNumber': e.detail.value, realNameCode: '' });
    },
    onPhoneInput(e) {
        this.setData({ 'form.phone': e.detail.value });
    },
    onWechatInput(e) {
        this.setData({ 'form.wechat': e.detail.value });
    },
    validateForm() {
        const { realName, idCardNumber, phone } = this.data.form;
        if (!realName.trim()) {
            wx.showToast({ title: '请填写姓名', icon: 'none' });
            return false;
        }
        if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCardNumber.trim())) {
            wx.showToast({ title: '身份证号格式不正确', icon: 'none' });
            return false;
        }
        if (!/^1\d{10}$/.test(phone.trim())) {
            wx.showToast({ title: '请填写有效手机号', icon: 'none' });
            return false;
        }
        return true;
    },
    async onLaunchRealNameAuth() {
        if (!this.validateForm())
            return;
        this.setData({ launchingAuth: true });
        try {
            if (this.data.realNameMock) {
                await this.verifyReturnedCode(organizer_1.MOCK_REALNAME_CODE);
                return;
            }
            await (0, organizer_1.launchRealNameAuth)();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '打开实名校验失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            this.setData({ launchingAuth: false });
        }
    },
    async verifyReturnedCode(code) {
        if (!this.validateForm())
            return;
        const form = this.data.form;
        try {
            wx.showLoading({ title: '校验中' });
            await (0, organizer_1.verifyOrganizerRealName)({
                realName: form.realName.trim(),
                idCardNumber: form.idCardNumber.trim(),
                code,
            });
            this.setData({ realNameCode: code });
            wx.showToast({ title: '实名校验通过', icon: 'success' });
        }
        catch (err) {
            this.setData({ realNameCode: '' });
            const msg = err instanceof Error ? err.message : '实名校验失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    async onSubmit() {
        if (!this.validateForm())
            return;
        if (!this.data.realNameCode) {
            wx.showToast({ title: '请先完成实名校验', icon: 'none' });
            return;
        }
        const form = this.data.form;
        this.setData({ submitting: true });
        try {
            await (0, organizer_1.submitOrganizerApplication)({
                realName: form.realName.trim(),
                idCardNumber: form.idCardNumber.trim(),
                phone: form.phone.trim(),
                wechat: form.wechat.trim() || undefined,
                code: this.data.realNameCode,
            });
            const user = await (0, auth_1.getMe)();
            (0, session_1.setSessionUser)(user);
            wx.showToast({ title: '申请已提交', icon: 'success' });
            setTimeout(() => {
                wx.redirectTo({ url: '/pages/organizer/status' });
            }, 800);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '提交失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            this.setData({ submitting: false });
        }
    },
});
