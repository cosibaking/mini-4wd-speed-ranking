"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Component({
    properties: {
        comment: {
            type: Object,
            value: {},
        },
        isReply: {
            type: Boolean,
            value: false,
        },
    },
    methods: {
        onLikeTap() {
            const comment = this.properties.comment;
            this.triggerEvent('like', { id: comment.id });
        },
        onReplyTap() {
            const comment = this.properties.comment;
            this.triggerEvent('reply', {
                id: comment.id,
                nickName: comment.author.nickName,
            });
        },
        onImageTap(e) {
            const url = e.currentTarget.dataset.url;
            const comment = this.properties.comment;
            this.triggerEvent('previewimage', { url, commentId: comment.id });
        },
        onChildLike(e) {
            this.triggerEvent('like', e.detail);
        },
        onChildReply(e) {
            this.triggerEvent('reply', e.detail);
        },
        onChildPreviewImage(e) {
            this.triggerEvent('previewimage', e.detail);
        },
    },
});
