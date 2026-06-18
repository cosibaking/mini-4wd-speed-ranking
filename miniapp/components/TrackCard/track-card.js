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
            if (t && t.distance !== undefined) {
                this.setData({ distanceText: (0, geo_1.formatDistance)(t.distance) });
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
