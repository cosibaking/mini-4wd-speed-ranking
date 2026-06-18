"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const auth_1 = require("../../services/auth");
const track_1 = require("../../services/track");
const media_1 = require("../../services/media");
const session_1 = require("../../stores/session");
const geo_1 = require("../../utils/geo");
Page({
    data: {
        step: 1,
        trackId: '',
        isEdit: false,
        form: {
            name: '',
            location: null,
            organizerName: '',
            organizerContact: '',
            lengthMeters: '',
            floorPlanUrls: [],
            exampleVideoUrl: '',
            ruleNote: '',
        },
        submitting: false,
        locationAddress: '',
        mapLatitude: geo_1.DEFAULT_MAP_CENTER.latitude,
        mapLongitude: geo_1.DEFAULT_MAP_CENTER.longitude,
        mapScale: 16,
        mapMarkers: [],
        mapSubkey: config_1.TENCENT_MAP_SUBKEY,
        resolvingAddress: false,
    },
    async onLoad(options) {
        var _a, _b;
        await (0, auth_1.ensureLogin)();
        this.syncOrganizerName();
        if (options.id) {
            this.setData({ trackId: options.id, isEdit: true });
            wx.setNavigationBarTitle({ title: '编辑赛道' });
            const track = await (0, track_1.getTrack)(options.id);
            this.setData({
                form: {
                    name: track.name,
                    location: track.location,
                    organizerName: ((_a = (0, session_1.getSessionUser)()) === null || _a === void 0 ? void 0 : _a.nickName) || '微信用户',
                    organizerContact: track.organizerContact || '',
                    lengthMeters: track.lengthMeters ? String(track.lengthMeters) : '',
                    floorPlanUrls: track.floorPlanUrls || [],
                    exampleVideoUrl: track.exampleVideoUrl || '',
                    ruleNote: track.ruleNote || '',
                },
                locationAddress: ((_b = track.location) === null || _b === void 0 ? void 0 : _b.address) || '',
            });
            if (track.location) {
                this.updateMapView(track.location.lat, track.location.lng, track.name);
            }
            return;
        }
        try {
            const loc = await (0, geo_1.getUserLocation)();
            this.updateMapView(loc.lat, loc.lng);
        }
        catch (_c) {
            // 定位失败时使用默认中心
        }
    },
    onShow() {
        this.syncOrganizerName();
    },
    syncOrganizerName() {
        const user = (0, session_1.getSessionUser)();
        this.setData({ 'form.organizerName': (user === null || user === void 0 ? void 0 : user.nickName) || '微信用户' });
    },
    updateMapView(lat, lng, title) {
        const markers = title ? [(0, geo_1.buildTrackMarker)(lat, lng, title)] : [];
        this.setData({
            mapLatitude: lat,
            mapLongitude: lng,
            mapMarkers: markers,
        });
    },
    onNameInput(e) {
        this.setData({ 'form.name': e.detail.value });
    },
    onOrganizerContactInput(e) {
        this.setData({ 'form.organizerContact': e.detail.value });
    },
    onLengthInput(e) {
        this.setData({ 'form.lengthMeters': e.detail.value });
    },
    onRuleNoteInput(e) {
        this.setData({ 'form.ruleNote': e.detail.value });
    },
    formatSelectedAddress(res) {
        const address = (res.address || '').trim();
        const name = (res.name || '').trim();
        if (address && name) {
            return address.includes(name) ? address : `${name} ${address}`;
        }
        return address || name;
    },
    isCoordinateLikeAddress(text) {
        return /^地图选点/.test(text) || /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(text);
    },
    async applyLocation(lat, lng, addressHint) {
        if (this.data.resolvingAddress)
            return;
        let address = (addressHint || '').trim();
        if (!address || this.isCoordinateLikeAddress(address)) {
            this.setData({ resolvingAddress: true });
            try {
                wx.showLoading({ title: '解析地址中' });
                address = await (0, geo_1.reverseGeocodeAddress)(lat, lng);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '地址解析失败';
                wx.showToast({ title: msg, icon: 'none' });
                return;
            }
            finally {
                wx.hideLoading();
                this.setData({ resolvingAddress: false });
            }
        }
        if (!address || this.isCoordinateLikeAddress(address)) {
            wx.showToast({ title: '未能解析有效地址，请重试', icon: 'none' });
            return;
        }
        const title = this.data.form.name.trim() || '赛道位置';
        this.setData({
            locationAddress: address,
            'form.location': { lat, lng, address },
        });
        this.updateMapView(lat, lng, title);
    },
    onMapTap(e) {
        const { latitude, longitude } = e.detail;
        this.applyLocation(latitude, longitude);
    },
    onMapPoiTap(e) {
        const { name, latitude, longitude } = e.detail;
        this.applyLocation(latitude, longitude, name);
    },
    onChooseLocation() {
        wx.chooseLocation({
            success: async (res) => {
                const address = this.formatSelectedAddress(res);
                await this.applyLocation(res.latitude, res.longitude, address);
            },
        });
    },
    async onAddFloorPlan() {
        const urls = this.data.form.floorPlanUrls;
        if (urls.length >= 3) {
            wx.showToast({ title: '最多3张', icon: 'none' });
            return;
        }
        try {
            wx.showLoading({ title: '上传中' });
            const uploaded = await (0, media_1.chooseAndUploadImage)('track_floor_plan', 3 - urls.length);
            this.setData({ 'form.floorPlanUrls': [...urls, ...uploaded] });
        }
        catch (err) {
            if (err instanceof media_1.UploadCancelledError) {
                return;
            }
            console.error('[track/edit] floor plan upload failed', err);
            const message = err instanceof Error ? err.message : '上传失败';
            wx.showToast({ title: message.slice(0, 20), icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    async onAddVideo() {
        try {
            wx.showLoading({ title: '上传中' });
            const url = await (0, media_1.chooseAndUploadVideo)('track_example_video');
            this.setData({ 'form.exampleVideoUrl': url });
        }
        catch (err) {
            console.error('[track/edit] video upload failed', err);
            wx.showToast({ title: '上传失败', icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    validateStep1() {
        const { name, location, organizerName } = this.data.form;
        if (!name.trim()) {
            wx.showToast({ title: '请填写赛道名称', icon: 'none' });
            return false;
        }
        if (!location) {
            wx.showToast({ title: '请在地图上选择赛道位置', icon: 'none' });
            return false;
        }
        if (!organizerName.trim()) {
            wx.showToast({ title: '请填写主理人名称', icon: 'none' });
            return false;
        }
        return true;
    },
    onNext() {
        if (this.data.step === 1 && !this.validateStep1())
            return;
        if (this.data.step < 3) {
            this.setData({ step: this.data.step + 1 });
        }
    },
    onPrev() {
        if (this.data.step > 1) {
            this.setData({ step: this.data.step - 1 });
        }
    },
    async onSubmit() {
        if (!this.validateStep1()) {
            this.setData({ step: 1 });
            return;
        }
        const form = this.data.form;
        const payload = {
            name: form.name.trim(),
            location: form.location,
            organizerName: form.organizerName.trim(),
            organizerContact: form.organizerContact.trim() || undefined,
            floorPlanUrls: form.floorPlanUrls,
            exampleVideoUrl: form.exampleVideoUrl || undefined,
            ruleNote: form.ruleNote.trim() || undefined,
        };
        if (form.lengthMeters) {
            payload.lengthMeters = parseInt(form.lengthMeters, 10);
        }
        this.setData({ submitting: true });
        try {
            let track;
            if (this.data.isEdit) {
                track = await (0, track_1.updateTrack)(this.data.trackId, payload);
            }
            else {
                track = await (0, track_1.createTrack)(payload);
            }
            wx.showToast({ title: '保存成功', icon: 'success' });
            setTimeout(() => {
                wx.redirectTo({ url: `/pages/track/detail?id=${track.id}` });
            }, 1000);
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
