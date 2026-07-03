"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const organizer_1 = require("../../services/organizer");
const session_1 = require("../../stores/session");
const nav_1 = require("../../utils/nav");
const idCard_1 = require("../../utils/idCard");
Page({
    data: {
        form: {
            realName: '',
            idCardNumber: '',
            phone: '',
            wechat: '',
        },
        submitting: false,
    },
    async onLoad() {
        var _a;
        if (!(await (0, nav_1.guardLogin)('请先登录后再申请')))
            return;
        const user = await (0, auth_1.requireLogin)();
        if (user.isOrganizer) {
            wx.redirectTo({ url: '/pages/user/tracks' });
            return;
        }
        if (((_a = user.organizerApplication) === null || _a === void 0 ? void 0 : _a.status) === 'pending') {
            wx.redirectTo({ url: '/pages/organizer/status' });
        }
    },
    onRealNameInput(e) {
        this.setData({ 'form.realName': e.detail.value });
    },
    onIdCardInput(e) {
        this.setData({ 'form.idCardNumber': e.detail.value });
    },
    onPhoneInput(e) {
        this.setData({ 'form.phone': e.detail.value });
    },
    onWechatInput(e) {
        this.setData({ 'form.wechat': e.detail.value });
    },
    validateForm() {
        const { realName, idCardNumber, phone } = this.data.form;
        if (realName.trim().length < 2) {
            wx.showToast({ title: '请填写真实姓名', icon: 'none' });
            return false;
        }
        if (!(0, idCard_1.isValidIdCard)(idCardNumber)) {
            wx.showToast({ title: '身份证号不合法，请检查', icon: 'none' });
            return false;
        }
        if (!(0, idCard_1.isValidPhone)(phone)) {
            wx.showToast({ title: '请填写有效手机号', icon: 'none' });
            return false;
        }
        return true;
    },
    async onSubmit() {
        if (!this.validateForm())
            return;
        const form = this.data.form;
        this.setData({ submitting: true });
        try {
            await (0, organizer_1.submitOrganizerApplication)({
                realName: form.realName.trim(),
                idCardNumber: form.idCardNumber.trim(),
                phone: form.phone.trim(),
                wechat: form.wechat.trim() || undefined,
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
