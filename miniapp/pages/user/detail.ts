import { getUser, requireLogin } from '../../services/auth';
import { listUserPosts, toggleFollow } from '../../services/community';
import { getSessionUser } from '../../stores/session';
import { resolveDisplayImageUrl } from '../../utils/mediaUrl';
import type { PostListItem, PublicUserDetail } from '../../types';

Page({
  data: {
    user: null as PublicUserDetail | null,
    isSelf: false,
    following: undefined as boolean | undefined,
    followLoading: false,
    loading: true,
    posts: [] as PostListItem[],
    postsLoading: false,
    postsHasMore: false,
    postsPage: 1,
  },

  onLoad(options: { id?: string }) {
    if (options.id) this.loadUser(options.id);
    else this.setData({ loading: false });
  },

  async loadUser(id: string) {
    try {
      const user = await getUser(id);
      const sessionUser = getSessionUser();
      const isSelf = sessionUser?.id === user.id;
      this.setData({
        user,
        isSelf,
        following: user.following,
        loading: false,
      });
      await this.loadPosts(true);
    } catch {
      this.setData({ user: null, loading: false });
    }
  },

  async loadPosts(reset = false) {
    const user = this.data.user;
    if (!user) return;

    const page = reset ? 1 : this.data.postsPage;
    this.setData({ postsLoading: true });
    try {
      const res = await listUserPosts(user.id, { page, pageSize: 20 });
      const resolvedList = await Promise.all(
        res.list.map(async (item) => {
          if (!item.coverImage) return item;
          return {
            ...item,
            coverImage: await resolveDisplayImageUrl(item.coverImage),
          };
        }),
      );
      const posts = reset ? resolvedList : [...this.data.posts, ...resolvedList];
      this.setData({
        posts,
        postsHasMore: res.hasMore,
        postsPage: page + 1,
        postsLoading: false,
      });
    } catch {
      this.setData({ postsLoading: false });
    }
  },

  async onToggleFollow() {
    const user = this.data.user;
    if (!user) return;
    try {
      await requireLogin();
    } catch {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (this.data.followLoading) return;
    this.setData({ followLoading: true });
    try {
      const res = await toggleFollow(user.id);
      const followerDelta = res.following ? 1 : -1;
      this.setData({
        following: res.following,
        followLoading: false,
        'user.followerCount': Math.max(0, (user.followerCount ?? 0) + followerDelta),
      });
      wx.showToast({ title: res.following ? '已关注' : '已取消', icon: 'none' });
    } catch (err) {
      this.setData({ followLoading: false });
      const msg = err instanceof Error ? err.message : '操作失败';
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/user/profile' });
  },

  onReachBottom() {
    if (this.data.postsHasMore && !this.data.postsLoading) {
      void this.loadPosts(false);
    }
  },
});
