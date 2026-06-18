"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const geo_1 = require("../../utils/geo");
const nav_1 = require("../../utils/nav");
Component({
    properties: {
        track: {
            type: Object,
            value: {},
        },
        showDistance: {
            type: Boolean,
            value: true,
        },
        theme: {
            type: String,
            value: 'light',
        },
        requireLogin: {
            type: Boolean,
            value: false,
        },
    },
    data: {
        distanceText: '',
    },
    observers: {
        track(t) {
            var _a;
            if (!t)
                return;
            const meters = (_a = t.distance) !== null && _a !== void 0 ? _a : t.distanceMeters;
            if (meters != null) {
                this.setData({ distanceText: (0, geo_1.formatDistance)(meters) });
            }
            else {
                this.setData({ distanceText: '' });
            }
        },
    },
    methods: {
        onTap() {
            const track = this.properties.track;
            if (!(track === null || track === void 0 ? void 0 : track.id))
                return;
            const url = `/pages/track/detail?id=${track.id}`;
            if (this.properties.requireLogin) {
                (0, nav_1.navigateWithLogin)(url);
                return;
            }
            wx.navigateTo({ url });
        },
    },
});
