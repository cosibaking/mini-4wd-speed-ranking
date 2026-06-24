import type { CommentItem } from '../../types';

Component({
  properties: {
    comment: {
      type: Object,
      value: {} as CommentItem,
    },
    isReply: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    onLikeTap() {
      const comment = this.properties.comment as CommentItem;
      this.triggerEvent('like', { id: comment.id });
    },

    onReplyTap() {
      const comment = this.properties.comment as CommentItem;
      this.triggerEvent('reply', {
        id: comment.id,
        nickName: comment.author.nickName,
      });
    },

    onImageTap(e: WechatMiniprogram.TouchEvent) {
      const url = e.currentTarget.dataset.url as string;
      const comment = this.properties.comment as CommentItem;
      this.triggerEvent('previewimage', { url, commentId: comment.id });
    },

    onChildLike(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
      this.triggerEvent('like', e.detail);
    },

    onChildReply(e: WechatMiniprogram.CustomEvent<{ id: string; nickName: string }>) {
      this.triggerEvent('reply', e.detail);
    },

    onChildPreviewImage(
      e: WechatMiniprogram.CustomEvent<{ url: string; commentId: string }>,
    ) {
      this.triggerEvent('previewimage', e.detail);
    },
  },
});
