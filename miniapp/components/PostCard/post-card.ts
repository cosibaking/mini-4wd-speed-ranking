import type { PostListItem } from '../../types';

Component({
  properties: {
    post: {
      type: Object,
      value: {} as PostListItem,
    },
  },

  methods: {
    onTap() {
      const post = this.properties.post as PostListItem;
      if (post?.id) {
        wx.navigateTo({ url: `/pages/community/post?id=${post.id}` });
      }
    },
  },
});
