import { User } from './auth';
import { Tag } from './tag';

export interface Post {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  imageUrl: string | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: User;
  _count?: {
    comments: number;
  };
  postTags?: Array<{
    tag: Tag;
  }>;
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
