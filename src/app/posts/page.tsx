import { Suspense } from 'react';
import { PostList } from './_components/PostList';
import { TagSidebar } from './_components/TagSidebar';
import { prisma } from '@/data/prisma';

interface PostsPageProps {
  searchParams: { tag?: string };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const tagFilter = searchParams.tag;

  const where = tagFilter
    ? { postTags: { some: { tag: { name: tagFilter } } } }
    : undefined;

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: true,
      _count: {
        select: {
          comments: true,
        },
      },
      postTags: {
        include: {
          tag: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex gap-6">
      <aside className="w-56 flex-shrink-0">
        <Suspense
          fallback={
            <div className="bg-white rounded-lg shadow p-4">
              <div className="h-6 bg-gray-100 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <TagSidebar />
        </Suspense>
      </aside>
      <div className="flex-1 min-w-0">
        {tagFilter && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600">
              필터: <span className="font-semibold text-blue-700">#{tagFilter}</span>
            </span>
          </div>
        )}
        <PostList posts={posts} />
      </div>
    </div>
  );
}
