import { User } from './auth';

export interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
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
