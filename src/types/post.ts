import { User } from './auth';

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
}

export interface CreatePostInput {
  title: string;
  content: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
}
