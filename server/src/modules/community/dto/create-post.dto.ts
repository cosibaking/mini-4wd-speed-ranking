export interface CreatePostDto {
  boardId: string;
  title: string;
  content: string;
  imageUrls?: string[];
  trackId?: string;
}

export interface PostListQuery {
  boardId: string;
  sort?: 'latest' | 'hot';
  trackId?: string;
  page: number;
  pageSize: number;
}

export interface PostListItem {
  id: string;
  title: string;
  summary: string;
  boardId: string;
  author: { id: string; nickName: string; avatarUrl: string };
  track?: { id: string; name: string };
  likeCount: number;
  commentCount: number;
  createdAt: string;
  coverImage: string | null;
  liked?: boolean;
}

export interface PostDetail {
  id: string;
  boardId: string;
  boardName: string;
  title: string;
  content: string;
  imageUrls: string[];
  track?: { id: string; name: string };
  author: { id: string; nickName: string; avatarUrl: string };
  likeCount: number;
  commentCount: number;
  liked: boolean;
  authorFollowed: boolean;
  createdAt: string;
}
