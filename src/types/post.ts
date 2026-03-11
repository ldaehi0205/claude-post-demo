import { User } from './auth';
import { Tag } from './tag';

export interface Post {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  imageUrl: string | null;
  viewCount: number;
  likeCount?: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: User;
  _count?: {
    comments: number;
    likes: number;
  };
  postTags?: Array<{
    tag: Tag;
  }>;
}

export interface LikeResponse {
  likeCount: number;
  isLiked: boolean;
}

export interface LikeMutationContext {
  previousLikeCount: number;
  previousIsLiked: boolean;
}

export interface CreatePostInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface PaginatedPostsResponse {
  items: Post[];
  hasNext: boolean;
  total: number;
  page: number;
  limit: number;
}
