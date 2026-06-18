export interface CreateCommentDto {
  postId: string;
  content: string;
}

export interface CommentItem {
  id: string;
  content: string;
  author: { id: string; nickName: string; avatarUrl: string };
  likeCount: number;
  liked: boolean;
  createdAt: string;
}
