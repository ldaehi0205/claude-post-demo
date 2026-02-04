export interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  postId: number;
  authorId: number;
  author: {
    id: number;
    name: string;
    userID: string;
  };
}

export interface CreateCommentInput {
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}
