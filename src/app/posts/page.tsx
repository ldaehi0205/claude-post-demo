import { PostList } from '@/components/posts/PostList';
import { prisma } from '@/data/prisma';

export default async function PostsPage() {
  // const posts = await postsApi.getAll();
  const posts = await prisma.post.findMany({
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <PostList posts={posts} />
    </div>
  );
}
