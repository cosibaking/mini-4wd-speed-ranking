"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../../../services/admin");
Page({
    data: {
        status: 'pending',
        list: [],
        loading: true,
    },
    onLoad() {
        this.loadList();
    },
    onTabChange(e) {
        const status = e.currentTarget.dataset.status;
        this.setData({ status });
        this.loadList();
    },
    async loadList() {
        this.setData({ loading: true });
        try {
            const res = await (0, admin_1.listOrganizerApplications)({ status: this.data.status, pageSize: 50 });
            this.setData({ list: res.list, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onApprove(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确认通过',
            content: '请确认已完成线下核实。通过后用户可创建赛道。',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.approveOrganizerApplication)(id);
                    wx.showToast({ title: '已通过', icon: 'success' });
                    this.loadList();
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
    onReject(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '拒绝申请',
            content: '确认拒绝该主理人申请？',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.rejectOrganizerApplication)(id);
                    wx.showToast({ title: '已拒绝', icon: 'success' });
                    this.loadList();
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
});
