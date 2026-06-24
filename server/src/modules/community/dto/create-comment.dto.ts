export interface CreateCommentDto {
  postId: string;
  content: string;
  imageUrls?: string[];
  parentId?: string;
}

export interface CommentReplyTo {
  id: string;
  nickName: string;
}

export interface CommentItem {
  id: string;
  content: string;
  imageUrls: string[];
  author: { id: string; nickName: string; avatarUrl: string };
  likeCount: number;
  liked: boolean;
  createdAt: string;
  parentId?: string;
  replyTo?: CommentReplyTo;
  replies?: CommentItem[];
}
