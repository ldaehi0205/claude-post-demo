export interface Post {
  id: number
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface CreatePostInput {
  title: string
  content: string
}

export interface UpdatePostInput {
  title?: string
  content?: string
}
