import { Suspense } from 'react';
import { PostList } from './_components/PostList';
import { TagSidebar } from './_components/TagSidebar';

const SKELETON_TAG_COUNT = 3;

interface PostsPageProps {
  searchParams: { tag?: string };
}

export default function PostsPage({ searchParams }: PostsPageProps) {
  const tagFilter = searchParams.tag;

  return (
    <div className="flex gap-6">
      <aside className="w-56 flex-shrink-0">
        <Suspense
          fallback={
            <div className="bg-white rounded-lg shadow p-4">
              <div className="h-6 bg-gray-100 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                {Array.from({ length: SKELETON_TAG_COUNT }, (_, i) => (
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
        <PostList tag={tagFilter} />
      </div>
    </div>
  );
}
