"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Component({
    properties: {
        post: {
            type: Object,
            value: {},
        },
    },
    methods: {
        onTap() {
            const post = this.properties.post;
            if (post === null || post === void 0 ? void 0 : post.id) {
                wx.navigateTo({ url: `/pages/community/post?id=${post.id}` });
            }
        },
    },
});
