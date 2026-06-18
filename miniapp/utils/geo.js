"use strict";
/** 地理距离计算 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAP_MARKER_ICON = exports.DEFAULT_MAP_CENTER = void 0;
exports.calcDistanceMeters = calcDistanceMeters;
exports.formatDistance = formatDistance;
exports.getUserLocation = getUserLocation;
exports.buildTrackMarker = buildTrackMarker;
exports.openMapNavigation = openMapNavigation;
exports.showMapNavigationPicker = showMapNavigationPicker;
exports.openNavigation = openNavigation;
exports.reverseGeocodeAddress = reverseGeocodeAddress;
const http_1 = require("../services/http");
const EARTH_RADIUS_M = 6371000;
/** 地图默认中心（北京），未填经纬度时 map 组件的默认值 */
exports.DEFAULT_MAP_CENTER = { latitude: 39.9042, longitude: 116.4074 };
exports.MAP_MARKER_ICON = '/assets/map/marker.png';
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
/** Haversine 距离（米） */
function calcDistanceMeters(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
/** 格式化为可读距离 */
function formatDistance(meters) {
    if (meters === undefined || meters === null)
        return '';
    if (meters < 1000)
        return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}
/** 获取用户当前位置（gcj02 火星坐标系，与 map 组件一致） */
function getUserLocation() {
    return new Promise((resolve, reject) => {
        wx.getLocation({
            type: 'gcj02',
            success: (res) => resolve({ lat: res.latitude, lng: res.longitude }),
            fail: reject,
        });
    });
}
/** 构建赛道标记点 */
function buildTrackMarker(lat, lng, title) {
    return {
        id: 1,
        latitude: lat,
        longitude: lng,
        iconPath: exports.MAP_MARKER_ICON,
        width: 32,
        height: 42,
        callout: {
            content: title,
            display: 'ALWAYS',
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
            borderWidth: 1,
            borderColor: '#E85D04',
            bgColor: '#ffffff',
            color: '#333333',
        },
    };
}
function openWechatMap({ name, lat, lng, address }) {
    wx.openLocation({
        latitude: lat,
        longitude: lng,
        name,
        address,
        scale: 16,
    });
}
/**
 * 通过 MapContext.openMapApp 拉起地图 App 选择导航。
 * 需页面存在 id 与 mapId 一致的 map 组件。
 */
function openMapNavigation(mapId, options) {
    const ctx = wx.createMapContext(mapId);
    ctx.openMapApp({
        latitude: options.lat,
        longitude: options.lng,
        destination: options.name || options.address,
        fail: () => {
            openWechatMap(options);
        },
    });
}
function openMapMiniProgram(appId, path, appName) {
    wx.navigateToMiniProgram({
        appId,
        path,
        fail: () => {
            wx.showToast({ title: `无法打开${appName}`, icon: 'none' });
        },
    });
}
function openTencentMap(opts) {
    const name = encodeURIComponent(opts.name || opts.address);
    openMapMiniProgram('wx5bc2ae712e694a62', `/modules/routePlan/pages/index/index?type=drive&to=${name}&tocoord=${opts.lat},${opts.lng}`, '腾讯地图');
}
function openAmap(opts) {
    const name = encodeURIComponent(opts.name || opts.address);
    openMapMiniProgram('wx7646beb07707391a', `/pages/index/index?type=route&dest=${opts.lng},${opts.lat}&destName=${name}`, '高德地图');
}
function openBaiduMap(opts) {
    const name = encodeURIComponent(opts.name || opts.address);
    openMapMiniProgram('wx93ce83f128d17374', `/pages/index/index?type=nav&dest=${opts.lat},${opts.lng}&destName=${name}`, '百度地图');
}
/** @deprecated 请使用 openMapNavigation */
function showMapNavigationPicker(options) {
    const systemInfo = wx.getSystemInfoSync();
    const apps = [
        { name: '微信地图', open: () => openWechatMap(options) },
        { name: '腾讯地图', open: () => openTencentMap(options) },
        { name: '高德地图', open: () => openAmap(options) },
        { name: '百度地图', open: () => openBaiduMap(options) },
    ];
    if (systemInfo.platform === 'ios') {
        apps.push({ name: 'Apple 地图', open: () => openWechatMap(options) });
    }
    wx.showActionSheet({
        itemList: apps.map((app) => app.name),
        success: (res) => {
            const app = apps[res.tapIndex];
            if (app)
                app.open();
        },
    });
}
/** @deprecated 请使用 openMapNavigation */
function openNavigation(name, lat, lng, address) {
    showMapNavigationPicker({ name, lat, lng, address });
}
/** 坐标逆地理编码（map 选点未返回地址时使用） */
function reverseGeocodeAddress(lat, lng) {
    return (0, http_1.request)(`/geo/reverse?lat=${lat}&lng=${lng}`, { auth: false }).then((res) => res.address);
}
